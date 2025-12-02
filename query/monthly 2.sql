DECLARE @startDate AS DATE = '2025-01-01';
DECLARE @endDate AS DATE = GETDATE();

WITH Billed AS (
    SELECT
        DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1) AS MonthStart,
        SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled
    FROM ADVANCED.BIF951 AS b
    WHERE b.L_PROCESSED = 1
      AND b.L_CANCEL = 0
      AND b.L_NOBILL = 0
      AND b.C_BILLTYPE <> 'CB'
      AND b.D_BILLDATE >= @startDate
      AND b.D_BILLDATE <= @endDate
    GROUP BY DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1)
),
Collected AS (
    SELECT
        DATEFROMPARTS(YEAR(t.D_PAYDATE), MONTH(t.D_PAYDATE), 1) AS MonthStart,
        ABS(SUM(t.Y_AMOUNT)) AS totalCollected
    FROM ADVANCED.BIF956 AS t
    WHERE t.Y_AMOUNT < 0
      AND t.L_PROCESSED = 1
      AND t.L_DELETED = 0
      AND t.C_TRANSCODE LIKE 'PAY%'
      AND t.D_PAYDATE >= @startDate
      AND t.D_PAYDATE <= @endDate
    GROUP BY DATEFROMPARTS(YEAR(t.D_PAYDATE), MONTH(t.D_PAYDATE), 1)
)
SELECT
    COALESCE(b.MonthStart, c.MonthStart) AS MonthStart,
    ISNULL(b.totalBilled, 0) AS totalBilled,
    ISNULL(c.totalCollected, 0) AS totalCollected
FROM Billed b
FULL OUTER JOIN Collected c
    ON b.MonthStart = c.MonthStart
ORDER BY MonthStart;
