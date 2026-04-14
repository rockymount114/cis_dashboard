/*

Monthly Billing & Collection Analysis - ADVANCED.BIF951 + BIF956

Purpose:
    Track billed vs collected amounts by month, with collection efficiency KPIs:
    - Collection Rate %, Avg Days to Pay, Aging Buckets, Overpayments, Unpaid %
    
Logic:
    1. Bills: ADVANCED.BIF951 where L_PROCESSED=1, L_CANCEL=0, L_NOBILL=0
       Excludes C_BILLTYPE IN ('CB','RB') = cancels and rebills
    2. Payments: ADVANCED.BIF956 where Y_AMOUNT<0, L_PROCESSED=1, L_DELETED=0, C_TRANSCODE LIKE 'PAY%'
    3. Matching: Each payment matched to most recent bill for same C_ACCOUNT on or before D_PAYDATE
       Note: I_ORIGINATEDFROMBILL is not populated in this system, so we use account+date logic
    4. Aging: Based on days from D_BILLDATE to first payment date for that bill
       Buckets: 0-30, 31-60, 61-90, 90+ days. Overpayments tracked separately.
    5. All dates truncated to month-start for grouping. SQL Server 2014 compatible.

C_BILLTYPE Reference:
    AF: Auto Final Bill
    FB: Auto Final Bill  
    FR: Removed Meter Read
    IT: Regular Bill
    MB: Scheduled Read (likely Master Bill)
    MF: Master Final Bill
    RB: Cancel Rebill - EXCLUDED
    CB: Cancel Bill - EXCLUDED
    SC: Scheduled Read

Assumptions:
    - Payments apply FIFO: newest bill first. Change ORDER BY b.D_BILLDATE DESC to ASC for oldest-first
    - Payments > billed amount are capped in aging buckets and excess shown in PctOverpaid

*/
DECLARE @startDate DATE = '2025-01-01';
DECLARE @endDate DATE = GETDATE();

WITH Months AS (
    -- Generate all months in range so zero-activity months still appear
    SELECT DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + v.number, 0) AS MonthStart
    FROM master..spt_values v
    WHERE v.type = 'P'
      AND DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + v.number, 0) <= EOMONTH(@endDate)
),
Bills AS (
    -- All valid bills in period, excluding cancels/rebills
    SELECT
        b.I_BIF951PK,
        b.C_ACCOUNT,
        b.D_BILLDATE,
        DATEADD(MONTH, DATEDIFF(MONTH, 0, b.D_BILLDATE), 0) AS BillMonthStart,
        b.Y_CURRENTTRANSACTIONS AS BilledAmount,
        b.C_BILLTYPE
    FROM ADVANCED.BIF951 AS b
    WHERE b.L_PROCESSED = 1
        AND b.L_CANCEL = 0
        AND b.L_NOBILL = 0
        AND b.C_BILLTYPE NOT IN ('CB', 'RB') -- exclude Cancel Bill and Cancel Rebill
        AND b.D_BILLDATE >= @startDate
        AND b.D_BILLDATE < DATEADD(DAY, 1, @endDate)
),
Payments AS (
    -- All valid payments in period
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
PaymentsWithBills AS (
    -- Match each payment to most recent bill for same account <= payment date
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
            ORDER BY b.D_BILLDATE DESC -- DESC = FIFO newest first, ASC = oldest first
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
PaidBills AS (
    -- Roll payments up to bill level: first pay date, total paid, days to pay
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
    -- Monthly billed totals
    SELECT
        BillMonthStart,
        SUM(BilledAmount) AS TotalBilled,
        COUNT(DISTINCT I_BIF951PK) AS BillCount,
        COUNT(DISTINCT C_ACCOUNT) AS AccountsBilled
    FROM Bills
    GROUP BY BillMonthStart
),
CollectedMonthly AS (
    -- Monthly collected totals, independent of which bill they paid
    SELECT
        PayMonthStart AS MonthStart,
        SUM(PaidAmount) AS TotalCollected
    FROM Payments
    GROUP BY PayMonthStart
),
AgingMonthly AS (
    -- Calculate avg days + aging buckets per bill month
    -- Caps paid at billed amount to prevent >100%. Excess goes to OverpaidAmount.
    SELECT
        b.BillMonthStart AS MonthStart,
        AVG(CAST(pb.DaysToPay AS DECIMAL(10,2))) AS AvgDaysToPay,
        SUM(CASE WHEN pb.DaysToPay BETWEEN 0 AND 30 
                 THEN CASE WHEN pb.AmountPaidToBill > pb.BilledAmount 
                           THEN pb.BilledAmount ELSE pb.AmountPaidToBill END
                 ELSE 0 END) AS Paid_0_30,
        SUM(CASE WHEN pb.DaysToPay BETWEEN 31 AND 60 
                 THEN CASE WHEN pb.AmountPaidToBill > pb.BilledAmount 
                           THEN pb.BilledAmount ELSE pb.AmountPaidToBill END
                 ELSE 0 END) AS Paid_31_60,
        SUM(CASE WHEN pb.DaysToPay BETWEEN 61 AND 90 
                 THEN CASE WHEN pb.AmountPaidToBill > pb.BilledAmount 
                           THEN pb.BilledAmount ELSE pb.AmountPaidToBill END
                 ELSE 0 END) AS Paid_61_90,
        SUM(CASE WHEN pb.DaysToPay > 90 
                 THEN CASE WHEN pb.AmountPaidToBill > pb.BilledAmount 
                           THEN pb.BilledAmount ELSE pb.AmountPaidToBill END
                 ELSE 0 END) AS Paid_90Plus,
        SUM(CASE WHEN pb.AmountPaidToBill > pb.BilledAmount 
                 THEN pb.AmountPaidToBill - pb.BilledAmount ELSE 0 END) AS OverpaidAmount,
        SUM(b.BilledAmount) - SUM(
            CASE WHEN pb.I_BIF951PK IS NOT NULL 
                 THEN CASE WHEN pb.AmountPaidToBill > pb.BilledAmount 
                           THEN pb.BilledAmount ELSE pb.AmountPaidToBill END
                 ELSE 0 END
        ) AS UnpaidBalance
    FROM Bills b
    LEFT JOIN PaidBills pb ON pb.I_BIF951PK = b.I_BIF951PK
    GROUP BY b.BillMonthStart
),
Combined AS (
    -- Join all monthly metrics together
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
        ISNULL(a.OverpaidAmount, 0) AS OverpaidAmount,
        ISNULL(a.UnpaidBalance, 0) AS UnpaidBalance
    FROM Months m
    LEFT JOIN BilledMonthly b ON m.MonthStart = b.BillMonthStart
    LEFT JOIN CollectedMonthly c ON m.MonthStart = c.MonthStart
    LEFT JOIN AgingMonthly a ON m.MonthStart = a.MonthStart
)
-- Final output with calculated percentages and YTD running totals
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
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * OverpaidAmount / TotalBilled, 2) END AS PctOverpaid,
    CASE WHEN TotalBilled = 0 THEN 0 ELSE ROUND(100.0 * UnpaidBalance / TotalBilled, 2) END AS PctUnpaid,
    SUM(TotalBilled) OVER (PARTITION BY YEAR(MonthStart) ORDER BY MonthStart ROWS UNBOUNDED PRECEDING) AS YTDBilled,
    SUM(TotalCollected) OVER (PARTITION BY YEAR(MonthStart) ORDER BY MonthStart ROWS UNBOUNDED PRECEDING) AS YTDCollected
FROM Combined
ORDER BY MonthStart;
