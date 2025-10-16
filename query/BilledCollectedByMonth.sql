DECLARE @startDate as DATE = '2025-01-01';
DECLARE @endDate as DATE = GETDATE();

WITH Billed AS (
    SELECT 
        FORMAT(DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1), 'yyyy-MM') AS YearMonth,
        SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled
    FROM ADVANCED.BIF951 AS b
    WHERE b.L_PROCESSED = 1
        AND b.L_CANCEL = 0
        AND b.L_NOBILL = 0
        AND b.C_BILLTYPE <> 'CB'
        AND b.D_BILLDATE >= @startDate
        AND b.D_BILLDATE <= @endDate
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
        AND t.D_PAYDATE >= @startDate
        AND t.D_PAYDATE <= @endDate
    GROUP BY FORMAT(t.D_PAYDATE, 'yyyy-MM')
)
SELECT 
    COALESCE(b.YearMonth, c.YearMonth) AS Month,
    ISNULL(b.totalBilled, 0) AS totalBilled,
    ISNULL(c.totalCollected, 0) AS totalCollected
FROM Billed b
FULL OUTER JOIN Collected c
    ON b.YearMonth = c.YearMonth
ORDER BY Month;
