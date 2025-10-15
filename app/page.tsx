'use client';

import { useState } from 'react';
import useSWR from 'swr';

// This interface should be in a shared file, e.g., lib/db.ts and exported
export interface KpiData {
  totalCustomers: number;
  totalAccounts: number;
  totalBilled: number;
  totalPayments: number;
  totalUnpaid: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

import { KpiCard, KpiCardSkeleton } from '@/app/components/KpiCard';

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
          <KpiCard title="Total Customers" value={data.totalCustomers} format="number"/>
          <KpiCard title="Total Accounts" value={data.totalAccounts} format="number"/>
          <KpiCard title="Total Billed" value={data.totalBilled} format="currency"/>
          <KpiCard title="Total Collected" value={data.totalPayments} format="currency"/>
          <KpiCard title="Total Unpaid" value={data.totalUnpaid} format="currency"/>
        </div>
      )}

    </main>
  );
}