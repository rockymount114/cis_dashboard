# Feature: Optimize Chart Data Query

## Phase 1: Refactor Chart Data Query

### Task T001: Consolidate Chart Data Queries

**File:** `lib/db.ts`

**Goal:** Replace the two separate queries for fetching chart data with a single, more efficient query.

**Details:**

- The current implementation in `getChartData` executes two separate SQL queries to fetch `totalBilledByMonth` and `totalCollectedByMonth`.
- This will be replaced by a single SQL query that calculates both values in one go, reducing database overhead and improving performance.
- The new query uses Common Table Expressions (CTEs) and a `FULL OUTER JOIN` to combine the billed and collected data.

**Implementation:**

```typescript
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // Set to false for non-Azure SQL Server instances
    trustServerCertificate: true, // Keep true for local dev / self-signed certs
    requestTimeout: 60000, // 60 seconds
    connectionTimeout: 60000, // 60 seconds
    readonly: true
  },
};

let pool: sql.ConnectionPool;

const getPool = async () => {
  if (!pool) {
    try {
      pool = await sql.connect(config);
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }
  return pool;
};

export interface KpiData {
  totalCustomers: number;
  totalAccounts: number;
  totalBilled: number;
  totalPayments: number;
  totalUnpaid: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const getKpiData = async (dateRange?: DateRange): Promise<KpiData> => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    const query = `
      WITH Base AS (
        SELECT *
        FROM ADVANCED.BIF951 b
        WHERE b.L_PROCESSED = 1
          AND b.L_CANCEL = 0
          AND b.L_NOBILL = 0
          AND b.C_BILLTYPE <> 'CB'
          AND b.D_BILLDATE BETWEEN @startDate AND @endDate
      ),
      Payments AS (
        SELECT ABS(SUM(t.Y_AMOUNT)) AS totalCollected
        FROM ADVANCED.BIF956 t
        WHERE t.Y_AMOUNT < 0
          AND t.L_PROCESSED = 1
          AND t.L_DELETED = 0
          AND t.C_TRANSCODE LIKE 'PAY%'
          AND t.D_PAYDATE BETWEEN @startDate AND @endDate
      )
      SELECT 
        COUNT(DISTINCT C_CUSTOMER) AS totalCustomers,
        COUNT(DISTINCT C_ACCOUNT) AS totalAccounts,
        SUM(Y_CURRENTTRANSACTIONS) AS totalBilled,
        (SELECT totalCollected FROM Payments) AS totalPayments,
        SUM(Y_CURRENTTRANSACTIONS) - (SELECT totalCollected FROM Payments) AS totalUnpaid
      FROM Base;
    `;

    if (dateRange) {
      request.input('startDate', sql.Date, dateRange.startDate);
      request.input('endDate', sql.Date, dateRange.endDate);
    }

    const result = await request.query(query);
    const record = result.recordset[0];

    return {
      totalCustomers: record.totalCustomers,
      totalAccounts: record.totalAccounts,
      totalBilled: record.totalBilled,
      totalPayments: record.totalPayments,
      totalUnpaid: record.totalUnpaid,
    };
  } catch (err) {
    console.error('Error fetching KPI data:', err);
    // Re-throw the error to be handled by the API route
    throw err;
  }
};


export interface ChartData {
  month: string;
  billed: number;
  collected: number;
}

export const getChartData = async (dateRange: DateRange): Promise<ChartData[]> => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('startDate', sql.Date, dateRange.startDate);
    request.input('endDate', sql.Date, dateRange.endDate);

    const query = `
      WITH Billed AS (
        SELECT 
          FORMAT(DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1), 'yyyy-MM') AS YearMonth, 
          SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled 
        FROM ADVANCED.BIF951 AS b 
        WHERE b.L_PROCESSED = 1 
          AND b.L_CANCEL = 0 
          AND b.L_NOBILL = 0 
          AND b.C_BILLTYPE <> 'CB' 
          AND b.D_BILLDATE >= @startDate AND b.D_BILLDATE <= @endDate 
        GROUP BY FORMAT(DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1), 'yyyy-MM')
      ), 
      Collected AS ( 
        SELECT 
          FORMAT(t.D_PAYDATE, 'yyyy-MM') AS YearMonth, 
          ABS(SUM(t.Y_AMOUNT)) AS totalCollected 
        FROM ADVANCED.BIF956 AS t 
        WHERE t.Y_AMOUNT < 0 
          AND t.L_PROCESSED = 1 
          AND t.L_DELETED = 0 
          AND t.C_TRANSCODE LIKE 'PAY%' 
          AND t.D_PAYDATE >= @startDate AND t.D_PAYDATE <= @endDate 
        GROUP BY FORMAT(t.D_PAYDATE, 'yyyy-MM')
      ) 
      SELECT 
        COALESCE(b.YearMonth, c.YearMonth) AS month,
        ISNULL(b.totalBilled, 0) AS billed,
        ISNULL(c.totalCollected, 0) AS collected
      FROM Billed b 
      FULL OUTER JOIN Collected c ON b.YearMonth = c.YearMonth 
      ORDER BY month;
    `;

    const result = await request.query(query);

    return result.recordset.map(record => ({
      month: record.month,
      billed: record.billed,
      collected: record.collected,
    }));
  } catch (err) {
    console.error('Error fetching chart data:', err);
    throw err;
  }
};

export { getPool, sql };
```
