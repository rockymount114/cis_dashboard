import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // Set to false for non-Azure SQL Server instances
    trustServerCertificate: true, // Keep true for local dev / self-signed certs
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
    
    let query = `
                  SELECT 
                    COUNT(A.C_CUSTOMER) AS totalCustomers,
                    COUNT(A.C_ACCOUNT) AS totalAccounts,
                    300 AS totalPayments,
                    400 AS totalUnpaid
                  FROM ADVANCED.BIF003 AS A -- Customer/Account Table
                  JOIN ADVANCED.BIF002 AS B 
                    ON A.C_ACCOUNT = B.C_ACCOUNT -- Service Address Table
                  JOIN ADVANCED.BIF001 AS C 
                    ON A.C_CUSTOMER = C.C_CUSTOMER -- Customer Name Table
                `;

    const totalBilledQuery = `
                  SELECT SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled
                  FROM ADVANCED.BIF951 AS b
                  WHERE b.L_PROCESSED = 1
                    AND b.L_CANCEL = 0
                    AND b.L_NOBILL = 0
                    AND b.C_BILLTYPE <> 'CB'
                    AND b.D_BILLDATE >= @startDate
                    AND b.D_BILLDATE <= @endDate;
                `;
               
    const totalPaymentsQuery = `
                                  SELECT
                                  ABS(SUM(t.Y_AMOUNT)) AS totalCollected
                                  FROM ADVANCED.BIF956 t
                                  WHERE
                                  t.Y_AMOUNT < 0
                                  AND t.L_PROCESSED = 1
                                  AND t.L_DELETED = 0
                                  AND t.C_TRANSCODE LIKE 'PAY%'
                                  AND t.D_PAYDATE >= @startDate
                                  AND t.D_PAYDATE <= @endDate           
    
                                `;            

    if (dateRange) {
      request.input('startDate', sql.Date, dateRange.startDate);
      request.input('endDate', sql.Date, dateRange.endDate);
      query += `
                WHERE A.C_ACCOUNTSTATUS = 'AC'
                AND A.D_MOVEIN BETWEEN @startDate AND @endDate
              `;
    }

    const result = await request.query(query);
    const record = result.recordset[0];

    const totalBilledResult = await request.query(totalBilledQuery);
    const totalBilledRecord = totalBilledResult.recordset[0];

    const totalCollectedResult = await request.query(totalPaymentsQuery);
    const totalCollectedRecord = totalCollectedResult.recordset[0];

    return {
      totalCustomers: record.totalCustomers,
      totalAccounts: record.totalAccounts,
      totalBilled: totalBilledRecord.totalBilled,
      totalPayments: totalCollectedRecord.totalCollected,
      totalUnpaid: totalBilledRecord.totalBilled - totalCollectedRecord.totalCollected,
    };
  } catch (err) {
    console.error('Error fetching KPI data:', err);
    // Re-throw the error to be handled by the API route
    throw err;
  }
};

export { getPool, sql };
