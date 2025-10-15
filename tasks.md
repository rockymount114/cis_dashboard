# Feature: Billed vs. Collected Line Chart

This document outlines the tasks required to implement a line chart comparing total billed and total collected amounts per month.

## Phase 1: Setup

*   **T001: [System] Install Charting Library**
    *   **File:** `package.json`
    *   **Action:** Add a charting library to the project.
    *   **Command:** `npm install recharts`

## Phase 2: Foundational (Backend)

*   **T002: [Backend] Create SQL Query Files** [P]
    *   **File:** `query/total_billed_by_month.sql`
    *   **Action:** Create a new SQL file with the provided query for total billed by month.
    *   **Content:**
        ```sql
        SELECT FORMAT(DATEFROMPARTS(YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE), 1), 'yyyy-MM') AS BillYearMonth, SUM(b.Y_CURRENTTRANSACTIONS) AS totalBilled FROM ADVANCED.BIF951 AS b WHERE b.L_PROCESSED = 1 AND b.L_CANCEL = 0 AND b.L_NOBILL = 0 AND b.C_BILLTYPE <> 'CB' AND b.D_BILLDATE >= @startDate AND b.D_BILLDATE <= @endDate GROUP BY YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE) ORDER BY YEAR(b.D_BILLDATE), MONTH(b.D_BILLDATE);
        ```
*   **T003: [Backend] Create SQL Query Files** [P]
    *   **File:** `query/total_collected_by_month.sql`
    *   **Action:** Create a new SQL file with the provided query for total collected by month.
    *   **Content:**
        ```sql
        SELECT FORMAT(t.D_PAYDATE, 'yyyy-MM') AS PayYearMonth, ABS(SUM(t.Y_AMOUNT)) AS TotalCollected FROM ADVANCED.BIF956 t WHERE t.Y_AMOUNT < 0 AND t.L_PROCESSED = 1 AND t.L_DELETED = 0 AND t.C_TRANSCODE LIKE 'PAY%' AND t.D_PAYDATE >= @startDate AND t.D_PAYDATE <= @endDate GROUP BY FORMAT(t.D_PAYDATE, 'yyyy-MM') ORDER BY PayYearMonth;
        ```

*   **T004: [Backend] Create Database Function for Chart Data**
    *   **File:** `lib/db.ts`
    *   **Action:** Create a new function `getChartData` that executes the two new SQL queries and merges the results into a single time-series dataset. The function should accept a date range.

*   **T005: [Backend] Create API Endpoint for Chart Data**
    *   **File:** `app/api/kpis/billed-vs-collected/route.ts`
    *   **Action:** Create a new API route that calls the `getChartData` function from `lib/db.ts` and returns the data as JSON.

## Phase 3: User Story 1 - Display Billed vs. Collected Line Chart

*   **Goal:** As a user, I want to see a line chart comparing total billed and total collected amounts for the selected date range, so I can track revenue and collection efficiency.
*   **Independent Test Criteria:** The chart should render on the page and display two lines, one for billed amounts and one for collected amounts, with data points for each month in the selected range.

*   **T006: [Frontend] Create Line Chart Component** [P]
    *   **File:** `app/components/BilledVsCollectedChart.tsx`
    *   **Action:** Create a new React component that uses `recharts` to render a line chart. This component will fetch data from the new `/api/kpis/billed-vs-collected` endpoint using `useSWR`, passing the selected date range as query parameters.

*   **T007: [Frontend] Integrate Chart into Dashboard**
    *   **File:** `app/page.tsx`
    *   **Action:** Import and render the `BilledVsCollectedChart` component on the main dashboard page.

## Phase 4: Polish & Integration

*   **T008: [Styling] Style Chart Component**
    *   **File:** `app/components/BilledVsCollectedChart.tsx`
    *   **Action:** Add styling to the chart to match the overall look and feel of the dashboard. Ensure it is responsive and includes a legend and tooltips.

## Dependencies

*   (T002, T003) can be done in parallel.
*   T004 depends on T002 and T003.
*   T005 depends on T004.
*   T006 can be done in parallel with backend tasks (T002-T005) after T001 is complete.
*   T007 depends on T006 and T005.
*   T008 depends on T007.

## Parallel Execution Examples

*   **Initial Setup:**
    *   Developer A can start on T001 and T006 (creating the skeleton of the chart component).
    *   Developer B can start on T002 and T003.
*   **After Backend Foundations:**
    *   Once T005 is complete, the frontend developer (Developer A) can fully integrate the chart component with the live API endpoint.

## Implementation Strategy

The feature will be delivered in a single increment. The MVP is the complete, functional line chart integrated into the dashboard.