# Development Tasks: Main KPI Dashboard

This document outlines the development tasks required to implement the Main KPI Dashboard feature.

## Phases

### Phase 1: Project Setup

These tasks prepare the development environment.

-   **T001**: [x] Install the MS-SQL database driver: `npm install mssql`
-   **T002**: [x] Install the data fetching library: `npm install swr`
-   **T003**: [x] Create the environment file `.env.local` and add placeholders for database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).

---

### Phase 2: Foundational Backend

This phase creates the core database connectivity.

-   **T004**: [x] Create the database connection module at `lib/db.ts`. This module will initialize and export a connection pool for the MS-SQL database using the credentials from `.env.local`.

---

### Phase 3: User Story 1 - View Default KPI Dashboard

**Goal**: Display the 5 KPIs with default data for the current year.

**Independent Test**: Navigate to the main page and see the 5 KPI cards populated with data.

-   **T005** [x] [US1]: Create the basic API route file at `app/api/kpis/route.ts`. [P]
-   **T006** [x] [US1]: In `lib/db.ts`, create a function `getKpiData` that accepts an optional date range. [P]
-   **T007** [x] [US1]: In `getKpiData`, implement the query for "Total Accounts": `SELECT COUNT(*) as total_accounts FROM ADVANCED.BIF002`. For now, ignore the date range.
-   **T008** [x] [US1]: In `getKpiData`, add placeholder queries for the other 4 KPIs ("Total Customers", "Total Billed", "Total Payments", "Total Unpaid") that return a value of `0`.
-   **T009** [x] [US1]: In `app/api/kpis/route.ts`, implement the `GET` handler. It should call `getKpiData` (with no date range for now) and return the 5 KPIs as JSON.
-   **T010** [x] [US1]: In `app/page.tsx`, create the UI for the 5 KPI cards using Tailwind CSS for styling. [P]
-   **T011** [x] [US1]: In `app/page.tsx`, create a non-functional UI for the date range filter. [P]
-   **T012** [x] [US1]: In `app/page.tsx`, use the `useSWR` hook to fetch data from the `/api/kpis` endpoint.
-   **T013** [x] [US1]: Connect the fetched data to the KPI cards to display the values.

**Checkpoint**: At the end of this phase, the dashboard will display KPI data. "Total Accounts" will be live, and the other four will be placeholders. The date filter UI will be visible but not functional.

---

### Phase 4: User Story 2 - Filter KPIs by Custom Date Range

**Goal**: Enable users to filter the KPIs by selecting a custom date range.

**Independent Test**: Select a new start and end date and verify that the KPI values update.

-   **T014** [x] [US2]: In `app/api/kpis/route.ts`, update the `GET` handler to read `startDate` and `endDate` from the URL search parameters.
-   **T015** [x] [US2]: In `lib/db.ts`, update the `getKpiData` function to pass the date range to the database queries.
-   **T016** [x] [US2]: Update the "Total Accounts" query to use the date range. **Note**: This assumes a date column named `creation_date` exists: `... WHERE creation_date BETWEEN @startDate AND @endDate`.
-   **T017** [x] [US2]: In `app/page.tsx`, add state management for the start and end dates from the date range filter.
-   **T018** [x] [US2]: Modify the `useSWR` hook to pass the selected `startDate` and `endDate` as query parameters, causing the data to be re-fetched automatically when the dates change.

**Checkpoint**: At the end of this phase, the dashboard will be fully interactive. Changing the date filter will update the KPI values.

---

### Phase 5: Polish & Integration

These tasks improve the user experience.

-   **T019** [x]: In `app/page.tsx`, add loading state indicators (e.g., skeleton screens) to the KPI cards while data is being fetched. [P]
-   **T020** [x]: In `app/page.tsx`, add error handling to display a user-friendly message if the API call fails. [P]
-   **T021** [x]: Review the dashboard and ensure the layout is responsive and usable on mobile devices.

## Dependencies

-   **User Story 1** must be completed before **User Story 2** can begin.
-   **Foundational Backend** must be completed before **User Story 1** can begin.

## Parallel Execution

-   Within User Story 1, backend tasks (T005-T009) can be developed in parallel with frontend UI tasks (T010-T011).
-   Within the Polish phase, loading states (T019) and error handling (T020) can be developed in parallel.
