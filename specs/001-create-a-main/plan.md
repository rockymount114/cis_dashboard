# Implementation Plan: Main KPI Dashboard

## Feature

Main KPI Dashboard

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS. The `SWR` library will be used for data fetching.
- **Backend**: Next.js API Routes (Node.js).
- **Database**: MS-SQL, using the `mssql` library for the connection.

## Project Structure

- **API Endpoint**: A new API route will be created at `app/api/kpis/route.ts`.
- **Database Logic**: A new utility file at `lib/db.ts` will be created to manage the database connection pool and queries.
- **Frontend Component**: The UI will be implemented in `app/page.tsx`.
- **Environment Variables**: Database credentials (host, user, password, database) will be stored in `.env.local`.

## Implementation Strategy

The implementation will be done in two main stages:

1.  **Backend First**: Create the database connection logic and the API endpoint. This will allow the frontend to have a working endpoint to connect to.
2.  **Frontend Development**: Build the UI components and connect them to the API endpoint to display the data.
