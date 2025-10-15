# Feature: Enhance Chart Tooltip with Collection Percentage

This document outlines the tasks required to add the collection percentage to the tooltip of the Billed vs. Collected line chart.

## Phase 1: User Story 1 - Enhance Tooltip

*   **Goal:** As a user, I want to see the collection percentage (collected vs. billed) for each month in the chart's tooltip, so I can quickly assess collection efficiency.
*   **Independent Test Criteria:** When hovering over a data point on the chart, the tooltip should display the billed amount, the collected amount, and the collection percentage, formatted to one decimal place (e.g., '85.3%').

*   **T001: [Frontend] Update Chart Tooltip Formatter**
    *   **File:** `app/components/BilledVsCollectedChart.tsx`
    *   **Action:** Modify the `Tooltip` component within the line chart to display the billed amount, collected amount, and the calculated collection percentage.

## Implementation Strategy

This is a minor enhancement that can be implemented directly in the existing chart component.
