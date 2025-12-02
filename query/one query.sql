DECLARE @startDate as DATE = '2025-01-01';
DECLARE @endDate as DATE = GETDATE();

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