# Tasks: CIS Dashboard KPI - Total Billed Amount

**Input**: Design context from user prompt.
**Prerequisites**: The project is a standard Next.js application.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js App**: `app/` for pages and components, `app/api/` for API routes, `lib/` for shared logic.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

*This phase is already complete as we are working in an existing Next.js project.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [ ] T001 Verify database connection is configured in `lib/db.ts` and can connect to the `ADVANCED` schema.

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Display Total Billed Amount (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to see the total amount billed for a selected date range on the dashboard.

**Independent Test**: 1. Select a date range on the main page. 2. Verify that a "Total Billed" card displays a numerical value fetched from the backend. 3. Manually query the database with the same date range and confirm the numbers match.

### Implementation for User Story 1

- [ ] T002 [US1] Create the API route file `app/api/kpis/total-billed/route.ts`.
- [ ] T003 [US1] In `app/api/kpis/total-billed/route.ts`, implement the GET handler to receive 'from' and 'to' date query parameters.
- [ ] T004 [US1] In the API route, use the database connection from `lib/db.ts` to execute the provided SQL query against the `ADVANCED.BIF951` table. Use the date parameters to filter the `D_BILLDATE` column.
- [ ] T005 [US1] The API route should return the calculated `totalBilled` amount as a JSON response (e.g., `{ "totalBilled": 12345.67 }`).
- [ ] T006 [P] [US1] Create a new directory `app/components/` for UI components.
- [ ] T007 [P] [US1] Create a new React component `app/components/TotalBilledCard.tsx` that accepts a `total` prop and displays it.
- [ ] T008 [US1] In the main page file `app/page.tsx`, add two date input fields for the user to select a start and end date.
- [ ] T009 [US1] In `app/page.tsx`, manage the state for the start date, end date, and the fetched `totalBilled` amount.
- [ ] T010 [US1] In `app/page.tsx`, implement a data fetching function (e.g., inside a `useEffect` hook) that calls the `/api/kpis/total-billed` endpoint whenever the date range changes.
- [ ] T011 [US1] In `app/page.tsx`, render the `TotalBilledCard` component, passing the fetched `totalBilled` amount to it.
- [ ] T012 [US1] Add basic error handling for the API fetch (e.g., display a message if the data fails to load).
- [ ] T013 [US1] Add basic loading state handling (e.g., show a "Loading..." message while the data is being fetched).


**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T014 Code cleanup and refactoring.
- [ ] T015 Add currency formatting to the displayed `totalBilled` amount.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Must be complete before User Story 1.
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion.

### Within User Story 1

- **Backend (T002-T005)** should be completed before the **Frontend (T008-T011)** integration, though component creation (T006-T007) can happen in parallel.
- T002 -> T003 -> T004 -> T005
- T008 -> T009 -> T010 -> T011

### Parallel Opportunities

- **T006 & T007**: The `components` directory and the `TotalBilledCard` can be created while the backend API is being developed.
- The backend API tasks (T002-T005) can be worked on by one developer while the frontend shell and state management (T008, T009) can be worked on by another.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational.
2. Complete Phase 3: User Story 1.
3. **STOP and VALIDATE**: Test User Story 1 independently as described in its "Independent Test" section.
4. Deploy/demo if ready.
