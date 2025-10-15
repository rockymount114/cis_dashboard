export function KpiCard({ title, value }: { title: string; value: number | string }) {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : value;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-2">{formattedValue}</p>
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
