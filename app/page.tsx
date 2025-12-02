'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';

import { KpiData } from '@/lib/db';
import { KpiCard, KpiCardSkeleton } from '@/app/components/KpiCard';
import { BilledVsCollectedChart } from '@/app/components/BilledVsCollectedChart';

// Memoized fetcher helps avoid unnecessary re-creation on each render
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

export default function Home() {
  // Format Date as yyyy-MM-dd
  const getFormattedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = useMemo(() => new Date(), []);
  const firstDayOfYear = useMemo(() => new Date(today.getFullYear(), 0, 1), [today]);

  const [startDate, setStartDate] = useState(getFormattedDate(firstDayOfYear));
  const [endDate, setEndDate] = useState(getFormattedDate(today));

  // Debounced state to avoid too many requests while typing dates quickly
  const [debouncedStartDate, setDebouncedStartDate] = useState(startDate);
  const [debouncedEndDate, setDebouncedEndDate] = useState(endDate);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStartDate(startDate);
      setDebouncedEndDate(endDate);
    }, 300); // delay debounce by 300ms
    return () => clearTimeout(timer);
  }, [startDate, endDate]);

  // Construct API URL with query params only if valid dates
  const apiUrl = useMemo(() => {
    if (debouncedStartDate && debouncedEndDate) {
      return `/api/kpis?startDate=${debouncedStartDate}&endDate=${debouncedEndDate}`;
    }
    return '/api/kpis';
  }, [debouncedStartDate, debouncedEndDate]);

  const { data, error, isLoading } = useSWR<KpiData>(apiUrl, fetcher);

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
      <header className="z-10 max-w-5xl w-full flex justify-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">CIS Dashboard</h1>
      </header>

      {/* Date Filter UI */}
      <section className="mb-8 flex gap-4 items-center bg-white p-4 rounded-lg shadow-md max-w-5xl w-full">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            max={endDate} // Prevent startDate > endDate
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
            min={startDate} // Prevent endDate < startDate
            max={getFormattedDate(today)} // Cannot select future dates
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </section>

      {/* Status and Error Handling */}
      {error && (
        <div className="text-red-600 font-semibold mb-4">
          Failed to load KPI data: {error.message || 'Please try again later.'}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-5xl">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      )}

      {/* KPI Cards */}
      {data && !isLoading && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-5xl">
          <KpiCard title="Customers" value={data.totalCustomers} format="number" />
          <KpiCard title="Accounts" value={data.totalAccounts} format="number" />
          <KpiCard title="Billed" value={data.totalBilled} format="currency" />
          <KpiCard
            title="Collected"
            value={data.totalPayments}
            format="currency"
            percentage={(data.totalPayments / data.totalBilled) * 100}
            percentage_label="of Billed"
          />
          <KpiCard
            title="Gap"
            value={data.totalUnpaid}
            format="currency"
            percentage={(data.totalUnpaid / data.totalBilled) * 100}
            percentage_label="of Billed"
          />
        </section>
      )}

      {/* Chart */}
      {startDate && endDate && (
        <section className="w-full max-w-5xl mt-8">
          <BilledVsCollectedChart startDate={startDate} endDate={endDate} />
        </section>
      )}
    </main>
  );
}
