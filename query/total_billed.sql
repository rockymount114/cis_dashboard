with Billed AS (
    SELECT
        b.C_CUSTOMER,
        b.C_ACCOUNT,
		b.D_BILLDATE,
		b.D_DUEDATE,
        SUM(b.Y_CURRENTTRANSACTIONS) AS TotalBilled
    FROM ADVANCED.BIF951 AS b
    WHERE
        b.L_PROCESSED = 1
        AND b.L_CANCEL = 0
        AND b.L_NOBILL = 0
        AND b.C_BILLTYPE <> 'CB'
        --AND YEAR(b.D_BILLDATE) = @Year
        --AND MONTH(b.D_BILLDATE) = @Month
		AND b.D_BILLDATE >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1) AND b.D_BILLDATE <= GETDATE()
		--and b.C_CUSTOMER = '00166620'
		--and b.C_ACCOUNT = '0070375'

    GROUP BY
        b.C_CUSTOMER,
        b.C_ACCOUNT
		, b.D_DUEDATE
		, b.D_BILLDATE
		)

select sum(TotalBilled) totolBilled from Billed




SELECT 
    SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled
FROM ADVANCED.BIF951 AS b
WHERE
    b.L_PROCESSED = 1
    AND b.L_CANCEL = 0
    AND b.L_NOBILL = 0
    AND b.C_BILLTYPE <> 'CB'
    AND b.D_BILLDATE >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
    AND b.D_BILLDATE <= GETDATE()

