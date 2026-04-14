DECLARE @startDate DATE = '2026-01-01';
DECLARE @endDate DATE = GETDATE();

-- 1. Generate all months in range so we don't miss months with 0 billed/collected
WITH Months AS (
    SELECT DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + v.number, 0) AS MonthStart
    FROM master..spt_values v
    WHERE v.type = 'P'
      AND DATEADD(MONTH, DATEDIFF(MONTH, 0, @startDate) + v.number, 0) <= EOMONTH(@endDate)
),
Billed AS (
    SELECT
        DATEADD(MONTH, DATEDIFF(MONTH, 0, b.D_BILLDATE), 0) AS MonthStart,
        SUM(b.Y_CURRENTTRANSACTIONS) AS TotalBilled,
        COUNT(DISTINCT b.I_BILLNUMBER) AS BillCount,
        COUNT(DISTINCT b.C_ACCOUNT) AS AccountsBilled
    FROM ADVANCED.BIF951 AS b
    WHERE b.L_PROCESSED = 1
        AND b.L_CANCEL = 0
        AND b.L_NOBILL = 0
        AND b.C_BILLTYPE <> 'CB'
        AND b.D_BILLDATE >= @startDate
        AND b.D_BILLDATE < DATEADD(DAY, 1, @endDate) -- inclusive end date
    GROUP BY DATEADD(MONTH, DATEDIFF(MONTH, 0, b.D_BILLDATE), 0)
),
Collected AS (
    SELECT
        DATEADD(MONTH, DATEDIFF(MONTH, 0, t.D_PAYDATE), 0) AS MonthStart,
        SUM(ABS(t.Y_AMOUNT)) AS TotalCollected,
        COUNT(DISTINCT t.I_RECEIPT) AS PaymentCount,
        COUNT(DISTINCT t.C_ACCOUNT) AS AccountsPaid
    FROM ADVANCED.BIF956 AS t
    WHERE t.Y_AMOUNT < 0 -- payments are negative
        AND t.L_PROCESSED = 1
        AND t.L_DELETED = 0
        AND t.C_TRANSCODE LIKE 'PAY%'
        AND t.D_PAYDATE >= @startDate
        AND t.D_PAYDATE < DATEADD(DAY, 1, @endDate)
    GROUP BY DATEADD(MONTH, DATEDIFF(MONTH, 0, t.D_PAYDATE), 0)
),
Combined AS (
    SELECT
        m.MonthStart,
        CONVERT(CHAR(7), m.MonthStart, 121) AS YearMonth, -- 'YYYY-MM' format
        ISNULL(b.TotalBilled, 0) AS TotalBilled,
        ISNULL(c.TotalCollected, 0) AS TotalCollected,
        ISNULL(b.BillCount, 0) AS BillCount,
        ISNULL(c.PaymentCount, 0) AS PaymentCount,
        ISNULL(b.AccountsBilled, 0) AS AccountsBilled,
        ISNULL(c.AccountsPaid, 0) AS AccountsPaid
    FROM Months m
    LEFT JOIN Billed b ON m.MonthStart = b.MonthStart
    LEFT JOIN Collected c ON m.MonthStart = c.MonthStart
)
SELECT
    YearMonth,
    TotalBilled,
    TotalCollected,
    BillCount,
    PaymentCount,
    AccountsBilled,
    AccountsPaid,
    -- Collection rate: % of billed amount collected in same month
    CASE WHEN TotalBilled = 0 THEN NULL
         ELSE ROUND(100.0 * TotalCollected / TotalBilled, 2)
    END AS CollectionRatePct,
    -- YTD running totals
    SUM(TotalBilled) OVER (
        PARTITION BY YEAR(MonthStart)
        ORDER BY MonthStart
        ROWS UNBOUNDED PRECEDING
    ) AS YTDBilled,
    SUM(TotalCollected) OVER (
        PARTITION BY YEAR(MonthStart)
        ORDER BY MonthStart
        ROWS UNBOUNDED PRECEDING
    ) AS YTDCollected,
    -- 3-month rolling avg collection rate
    AVG(CASE WHEN TotalBilled = 0 THEN NULL
             ELSE 100.0 * TotalCollected / TotalBilled END)
        OVER (ORDER BY MonthStart ROWS 2 PRECEDING) AS Rolling3MoCollectRatePct
FROM Combined
ORDER BY MonthStart;


/*
Notes for your schema
Index usage: BIF951 filters on L_PROCESSED, D_BILLDATE - you have BIF951_PROCESSED and BIF951_BILLDATE indexes. BIF956 uses L_PROCESSED, L_DELETED, D_PAYDATE - consider adding an index on D_PAYDATE if it’s slow.
Payments: I kept Y_AMOUNT < 0 and ABS() because payments look negative in BIF956. If you have refunds/NSF, check C_TRANSCODE values.
Month alignment: We truncate to first-of-month with DATEADD(MONTH, DATEDIFF(MONTH, 0, date), 0) because FORMAT() is slow and not SARGable on 2014. This lets SQL use indexes.
End date inclusive: Used < DATEADD(DAY, 1, @endDate) instead of <= @endDate so we catch all times on the end date.

Bonus: Collection lag analysis
If you want to match payments to the bills they paid, join BIF956.I_ORIGINATEDFROMBILL to BIF951.I_BILLNUMBER. That gives true “days to collect” but is slower. Ask if you want that version.

Want me to add avg days to pay, aging buckets, or break it down by C_BILLTYPE?
*/
