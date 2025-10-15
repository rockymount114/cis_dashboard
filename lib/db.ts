import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // Set to false for non-Azure SQL Server instances
    trustServerCertificate: true, // Keep true for local dev / self-signed certs
    requestTimeout: 60000, // 30 seconds
    connectionTimeout: 60000 // 30 seconds
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
                    count(distinct C_CUSTOMER) AS totalCustomers,
                    count(distinct C_ACCOUNT) AS totalAccounts
                  FROM ADVANCED.BIF951 AS b
                  WHERE
                        b.L_PROCESSED = 1
                        AND b.L_CANCEL = 0
                        AND b.L_NOBILL = 0
                        AND b.C_BILLTYPE <> 'CB'
                `;

    let totalBilledQuery = `
                  SELECT SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled
                  FROM ADVANCED.BIF951 AS b
                  WHERE b.L_PROCESSED = 1
                    AND b.L_CANCEL = 0
                    AND b.L_NOBILL = 0
                    AND b.C_BILLTYPE <> 'CB'
                `;
               
    let totalPaymentsQuery = `
                                  SELECT
                                  ABS(SUM(t.Y_AMOUNT)) AS totalCollected
                                  FROM ADVANCED.BIF956 t
                                  WHERE
                                  t.Y_AMOUNT < 0
                                  AND t.L_PROCESSED = 1
                                  AND t.L_DELETED = 0
                                  AND t.C_TRANSCODE LIKE 'PAY%'   
    
                                `;            

    if (dateRange) {
      query += `
                AND b.D_BILLDATE >= @startDate
                AND b.D_BILLDATE <= @endDate
              `;
      totalBilledQuery += `
        AND b.D_BILLDATE >= @startDate
        AND b.D_BILLDATE <= @endDate
      `;
      totalPaymentsQuery += `
        AND t.D_PAYDATE >= @startDate
        AND t.D_PAYDATE <= @endDate
      `;
      request.input('startDate', sql.Date, dateRange.startDate);
      request.input('endDate', sql.Date, dateRange.endDate);
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

    const totalBilledByMonthQuery = `SELECT FORMAT(DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1), 'yyyy-MM') AS BillYearMonth, SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled FROM ADVANCED.BIF951 AS b WHERE b.L_PROCESSED = 1 AND b.L_CANCEL = 0 AND b.L_NOBILL = 0 AND b.C_BILLTYPE <> 'CB' AND b.D_BILLDATE >= @startDate AND b.D_BILLDATE <= @endDate GROUP BY YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE) ORDER BY YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE);`;
    const totalCollectedByMonthQuery = `SELECT FORMAT(t.D_PAYDATE, 'yyyy-MM') AS PayYearMonth, ABS(SUM(t.Y_AMOUNT)) AS TotalCollected FROM ADVANCED.BIF956 t WHERE t.Y_AMOUNT < 0 AND t.L_PROCESSED = 1 AND t.L_DELETED = 0 AND t.C_TRANSCODE LIKE 'PAY%' AND t.D_PAYDATE >= @startDate AND t.D_PAYDATE <= @endDate GROUP BY FORMAT(t.D_PAYDATE, 'yyyy-MM') ORDER BY PayYearMonth;`;

    const billedResult = await request.query(totalBilledByMonthQuery);
    const collectedResult = await request.query(totalCollectedByMonthQuery);

    const billedData = billedResult.recordset as { BillYearMonth: string; totalBilled: number }[];
    const collectedData = collectedResult.recordset as { PayYearMonth: string; TotalCollected: number }[];

    const mergedData: { [key: string]: ChartData } = {};

    billedData.forEach(item => {
      const month = item.BillYearMonth;
      if (!mergedData[month]) {
        mergedData[month] = { month, billed: 0, collected: 0 };
      }
      mergedData[month].billed += item.totalBilled;
    });

    collectedData.forEach(item => {
      const month = item.PayYearMonth;
      if (!mergedData[month]) {
        mergedData[month] = { month, billed: 0, collected: 0 };
      }
      mergedData[month].collected += item.TotalCollected;
    });

    return Object.values(mergedData).sort((a, b) => a.month.localeCompare(b.month));
  } catch (err) {
    console.error('Error fetching chart data:', err);
    throw err;
  }
};

export { getPool, sql };

