DECLARE @startDate AS DATE = '2025-01-01';
DECLARE @endDate AS DATE = GETDATE();

WITH BaseData AS (
    SELECT
        b.D_BILLDATE AS date,
        b.Y_CURRENTTRANSACTIONS AS billed,
        NULL AS collected
    FROM ADVANCED.BIF951 AS b
    WHERE b.L_PROCESSED = 1
      AND b.L_CANCEL = 0
      AND b.L_NOBILL = 0
      AND b.C_BILLTYPE <> 'CB'
      AND b.D_BILLDATE >= @startDate
      AND b.D_BILLDATE <= @endDate

    UNION ALL

    SELECT
        t.D_PAYDATE AS date,
        NULL AS billed,
        ABS(t.Y_AMOUNT) AS collected
    FROM ADVANCED.BIF956 AS t
    WHERE t.Y_AMOUNT < 0
      AND t.L_PROCESSED = 1
      AND t.L_DELETED = 0
      AND t.C_TRANSCODE LIKE 'PAY%'
      AND t.D_PAYDATE >= @startDate
      AND t.D_PAYDATE <= @endDate
),
WeeklyAggregates AS (
    SELECT
        DATEADD(day, 1 - DATEPART(WEEKDAY, date), date) AS WeekStart,
        DATEFROMPARTS(YEAR(date), MONTH(date), 1) AS MonthStart,
        SUM(ISNULL(billed, 0)) AS totalBilled,
        SUM(ISNULL(collected, 0)) AS totalCollected
    FROM BaseData
    GROUP BY
        DATEADD(day, 1 - DATEPART(WEEKDAY, date), date),
        DATEFROMPARTS(YEAR(date), MONTH(date), 1)
)
SELECT
    WeekStart,
    MonthStart,
    totalBilled,
    totalCollected
FROM WeeklyAggregates
ORDER BY WeekStart;
