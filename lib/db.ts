import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Use this if you're on Azure
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
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
    
    let totalAccountsQuery = 'SELECT COUNT(*) as total_accounts FROM ADVANCED.BIF003';

    if (dateRange) {
      request.input('startDate', sql.Date, dateRange.startDate);
      request.input('endDate', sql.Date, dateRange.endDate);
      // IMPORTANT: This assumes a date column named 'creation_date' exists in ADVANCED.BIF002
      totalAccountsQuery += ' WHERE D_MOVEIN BETWEEN @startDate AND @endDate';
    }

    const result = await request.query(totalAccountsQuery);
    const totalAccounts = result.recordset[0].total_accounts;

    // The other KPIs are still placeholders
    // In a real scenario, you would add their queries here, also using the dateRange if applicable

    return {
      totalCustomers: 0, // Placeholder
      totalAccounts: totalAccounts,
      totalBilled: 0, // Placeholder
      totalPayments: 0, // Placeholder
      totalUnpaid: 0, // Placeholder
    };
  } catch (err) {
    console.error('Error fetching KPI data:', err);
    return {
      totalCustomers: 0,
      totalAccounts: 0,
      totalBilled: 0,
      totalPayments: 0,
      totalUnpaid: 0,
    };
  }
};

export { getPool, sql };
