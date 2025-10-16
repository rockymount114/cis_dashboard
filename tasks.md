# Feature: Add Percentage to KPI Cards

## Phase 1: Modify KpiCard Component

### Task T001: Enhance `KpiCard` to Display Percentages

**File:** `app/components/KpiCard.tsx`

**Goal:** Update the `KpiCard` component to optionally display a percentage value below the main value.

**Details:**

- Add a new optional prop `percentage` of type `number` to `KpiCardProps`.
- Add a new optional prop `percentage_label` of type `string` to `KpiCardProps`.
- Conditionally render a new `<p>` tag to display the percentage if the `percentage` prop is provided.
- The percentage should be formatted with two decimal places and a '%' sign.

**Implementation:**

```typescript
import CountUp from 'react-countup';

interface KpiCardProps {
  title: string;
  value: number;
  format?: "currency" | "number";
  percentage?: number;
  percentage_label?: string;
}

export function KpiCard({ title, value, format = "currency", percentage, percentage_label }: KpiCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 text-center shake-on-hover">
      <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
      <p className="text-xl font-bold text-gray-900 mt-2">
        <CountUp
          end={value}
          duration={2}
          separator=","
          prefix={format === "currency" ? "$" : ""}
          decimals={format === "currency" ? 2 : 0}
        />
      </p>
      {percentage !== undefined && (
        <p className="text-sm text-gray-500 mt-1">
          <CountUp
            end={percentage}
            duration={2}
            separator=","
            decimals={2}
            suffix="%"
          />
          {percentage_label && <span className="ml-1">{percentage_label}</span>}
        </p>
      )}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 text-center animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
      <div className="h-10 bg-gray-300 rounded w-1/2 mx-auto mt-2"></div>
    </div>
  );
}
```

## Phase 2: Update Home Page to Provide Percentage Data

### Task T002: Update Home Page to Calculate and Pass Percentages

**File:** `app/page.tsx`

**Goal:** Calculate the "Collected" and "Gap" percentages and pass them to the respective `KpiCard` components.

**Details:**

- In the `Home` component, when the `data` is available, calculate:
  - `collectedPercentage`: `(data.totalPayments / data.totalBilled) * 100`
  - `gapPercentage`: `(data.totalUnpaid / data.totalBilled) * 100`
- Pass these calculated percentages to the "Collected" and "Gap" `KpiCard` components using the new `percentage` prop.
- Pass a `percentage_label` as well.

**Implementation:**

```typescript
'use client';

import { useState } from 'react';
import useSWR from 'swr';

import { KpiData } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

import { KpiCard, KpiCardSkeleton } from '@/app/components/KpiCard';
import { BilledVsCollectedChart } from '@/app/components/BilledVsCollectedChart';


export default function Home() {
  const getFormattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

  const [startDate, setStartDate] = useState(getFormattedDate(firstDayOfYear));
  const [endDate, setEndDate] = useState(getFormattedDate(today));

  // Construct the API URL with query parameters if dates are set
  const apiUrl = `/api/kpis${startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`;
  const { data, error } = useSWR<KpiData>(apiUrl, fetcher);

  const collectedPercentage = data ? (data.totalPayments / data.totalBilled) * 100 : 0;
  const gapPercentage = data ? (data.totalUnpaid / data.totalBilled) * 100 : 0;

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 w-full">CIS Dashboard</h1>
      </div>

      {/* Date Filter UI */}
      <div className="mb-8 flex gap-4 items-center bg-white p-4 rounded-lg shadow-md">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input 
            type="date" 
            id="startDate" 
            name="startDate" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input 
            type="date" 
            id="endDate" 
            name="endDate" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
          />
        </div>
      </div>


      {error && <div className="text-red-500">Failed to load KPI data. Please try again later.</div>}
      
      {!data && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-5xl">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-5xl">
          <KpiCard title="Customers" value={data.totalCustomers} format="number"/>
          <KpiCard title="Accounts" value={data.totalAccounts} format="number"/>
          <KpiCard title="Billed" value={data.totalBilled} format="currency"/>
          <KpiCard 
            title="Collected" 
            value={data.totalPayments} 
            format="currency"
            percentage={collectedPercentage}
            percentage_label="of Billed"
          />
          <KpiCard 
            title="Gap" 
            value={data.totalUnpaid} 
            format="currency"
            percentage={gapPercentage}
            percentage_label="of Billed"
          />
        </div>
      )}

      {startDate && endDate && <BilledVsCollectedChart startDate={startDate} endDate={endDate} />}

    </main>
  );
}
```
