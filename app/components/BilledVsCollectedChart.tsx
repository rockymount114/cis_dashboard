'use client';

import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatYAxis(value: number) {
    if (value >= 1000000) {
      return `${value / 1000000}M`;
    }
    if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value;
  }

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const billed = payload[0].payload.billed;
      const collected = payload[0].payload.collected;
      const percentage = billed > 0 ? (collected / billed) * 100 : 0;
  
      return (
        <div className="p-2 bg-white border rounded shadow-md">
          <p className="label">{`${label}`}</p>
          <p className="intro" style={{ color: payload[1].color }}>{`Billed: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(billed)}`}</p>
          <p className="intro" style={{ color: payload[0].color }}>{`Collected: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(collected)}`}</p>
          <p className="intro">{`Collection Rate: ${percentage.toFixed(1)}%`}</p>
        </div>
      );
    }
  
    return null;
  };

export const BilledVsCollectedChart = ({ startDate, endDate }: { startDate: string, endDate: string }) => {
  const { data, error } = useSWR<ChartData[]>(`/api/kpis/billed-vs-collected?startDate=${startDate}&endDate=${endDate}`, fetcher);

  if (error) return <div className="flex items-center justify-center h-full text-red-500">Failed to load chart data.</div>;
  if (!data) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Billed vs. Collected By Month</h2>
        <ResponsiveContainer>
            <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="billed" stroke="#ff3333" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="collected" stroke="#3333ff" />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};
