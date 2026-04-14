DECLARE @startDate DATE = '2026-01-01';
DECLARE @endDate DATE = GETDATE();

WITH Months AS (
    SELECT DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + v.number, 0) AS MonthStart
    FROM master..spt_values v
    WHERE v.type = 'P'
      AND DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + v.number, 0) <= EOMONTH(@endDate)
),
Bills AS (
    SELECT
        b.I_BIF951PK,
        b.C_ACCOUNT,
        b.D_BILLDATE,
        DATEADD(MONTH, DATEDIFF(MONTH, 0, b.D_BILLDATE), 0) AS BillMonthStart,
        b.Y_CURRENTTRANSACTIONS AS BilledAmount
    FROM ADVANCED.BIF951 AS b
    WHERE b.L_PROCESSED = 1
        AND b.L_CANCEL = 0
        AND b.L_NOBILL = 0
        AND b.C_BILLTYPE <> 'CB'
        AND b.D_BILLDATE >= @startDate
        AND b.D_BILLDATE < DATEADD(DAY, 1, @endDate)
),
Payments AS (
    SELECT
        t.C_ACCOUNT,
        t.D_PAYDATE,
        DATEADD(MONTH, DATEDIFF(MONTH, 0, t.D_PAYDATE), 0) AS PayMonthStart,
        ABS(t.Y_AMOUNT) AS PaidAmount
    FROM ADVANCED.BIF956 AS t
    WHERE t.Y_AMOUNT < 0
        AND t.L_PROCESSED = 1
        AND t.L_DELETED = 0
        AND t.C_TRANSCODE LIKE 'PAY%'
        AND t.D_PAYDATE >= @startDate
        AND t.D_PAYDATE < DATEADD(DAY, 1, @endDate)
),
-- Match each payment to the most recent bill for that account <= paydate
PaymentsWithBills AS (
    SELECT
        p.C_ACCOUNT,
        p.D_PAYDATE,
        p.PayMonthStart,
        p.PaidAmount,
        b.I_BIF951PK,
        b.D_BILLDATE,
        b.BillMonthStart,
        b.BilledAmount,
        ROW_NUMBER() OVER (
            PARTITION BY p.C_ACCOUNT, p.D_PAYDATE, p.PaidAmount 
            ORDER BY b.D_BILLDATE DESC
        ) AS rn
    FROM Payments p
    OUTER APPLY (
        SELECT TOP 1 b.I_BIF951PK, b.D_BILLDATE, b.BillMonthStart, b.BilledAmount
        FROM Bills b
        WHERE b.C_ACCOUNT = p.C_ACCOUNT
          AND b.D_BILLDATE <= p.D_PAYDATE
        ORDER BY b.D_BILLDATE DESC
    ) b
),
-- Aggregate payments back to bill level
PaidBills AS (
    SELECT
        BillMonthStart,
        I_BIF951PK,
        D_BILLDATE,
        BilledAmount,
        MIN(D_PAYDATE) AS FirstPayDate,
        DATEDIFF(DAY, D_BILLDATE, MIN(D_PAYDATE)) AS DaysToPay,
        SUM(PaidAmount) AS AmountPaidToBill
    FROM PaymentsWithBills
    WHERE rn = 1 AND I_BIF951PK IS NOT NULL
    GROUP BY BillMonthStart, I_BIF951PK, D_BILLDATE, BilledAmount
),
BilledMonthly AS (
    SELECT
        BillMonthStart,
        SUM(BilledAmount) AS TotalBilled,
        COUNT(DISTINCT I_BIF951PK) AS BillCount,
        COUNT(DISTINCT C_ACCOUNT) AS AccountsBilled
    FROM Bills
    GROUP BY BillMonthStart
),
CollectedMonthly AS (
    SELECT
        PayMonthStart AS MonthStart,
        SUM(PaidAmount) AS TotalCollected
    FROM Payments
    GROUP BY PayMonthStart
),
-- FIXED: explicitly alias columns to avoid ambiguous name errors
AgingMonthly AS (
    SELECT
        b.BillMonthStart AS MonthStart,
        AVG(CAST(pb.DaysToPay AS DECIMAL(10,2))) AS AvgDaysToPay,
        SUM(CASE WHEN pb.DaysToPay BETWEEN 0 AND 30 THEN pb.BilledAmount ELSE 0 END) AS Paid_0_30,
        SUM(CASE WHEN pb.DaysToPay BETWEEN 31 AND 60 THEN pb.BilledAmount ELSE 0 END) AS Paid_31_60,
        SUM(CASE WHEN pb.DaysToPay BETWEEN 61 AND 90 THEN pb.BilledAmount ELSE 0 END) AS Paid_61_90,
        SUM(CASE WHEN pb.DaysToPay > 90 THEN pb.BilledAmount ELSE 0 END) AS Paid_90Plus,
        SUM(CASE WHEN pb.I_BIF951PK IS NULL THEN b.BilledAmount ELSE 0 END) AS UnpaidBalance
    FROM Bills b
    LEFT JOIN PaidBills pb ON pb.I_BIF951PK = b.I_BIF951PK
    GROUP BY b.BillMonthStart
),
Combined AS (
    SELECT
        m.MonthStart,
        CONVERT(CHAR(7), m.MonthStart, 121) AS YearMonth,
        ISNULL(b.TotalBilled, 0) AS TotalBilled,
        ISNULL(c.TotalCollected, 0) AS TotalCollected,
        ISNULL(b.BillCount, 0) AS BillCount,
        ISNULL(b.AccountsBilled, 0) AS AccountsBilled,
        a.AvgDaysToPay,
        ISNULL(a.Paid_0_30, 0) AS Paid_0_30,
        ISNULL(a.Paid_31_60, 0) AS Paid_31_60,
        ISNULL(a.Paid_61_90, 0) AS Paid_61_90,
        ISNULL(a.Paid_90Plus, 0) AS Paid_90Plus,
        ISNULL(a.UnpaidBalance, 0) AS UnpaidBalance
    FROM Months m
    LEFT JOIN BilledMonthly b ON m.MonthStart = b.BillMonthStart
    LEFT JOIN CollectedMonthly c ON m.MonthStart = c.MonthStart
    LEFT JOIN AgingMonthly a ON m.MonthStart = a.MonthStart
)
SELECT
    YearMonth,
    TotalBilled,
    TotalCollected,
    BillCount,
    AccountsBilled,
    CASE WHEN TotalBilled = 0 THEN NULL
         ELSE ROUND(100.0 * TotalCollected / TotalBilled, 2)
    END AS CollectionRatePct,
    ROUND(ISNULL(AvgDaysToPay, 0), 1) AS AvgDaysToPay,
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * Paid_0_30 / TotalBilled, 2) END AS PctPaid_0_30,
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * Paid_31_60 / TotalBilled, 2) END AS PctPaid_31_60,
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * Paid_61_90 / TotalBilled, 2) END AS PctPaid_61_90,
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * Paid_90Plus / TotalBilled, 2) END AS PctPaid_90Plus,
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * UnpaidBalance / TotalBilled, 2) END AS PctUnpaid,
    SUM(TotalBilled) OVER (PARTITION BY YEAR(MonthStart) ORDER BY MonthStart ROWS UNBOUNDED PRECEDING) AS YTDBilled,
    SUM(TotalCollected) OVER (PARTITION BY YEAR(MonthStart) ORDER BY MonthStart ROWS UNBOUNDED PRECEDING) AS YTDCollected
FROM Combined
ORDER BY MonthStart;
