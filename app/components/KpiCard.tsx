
interface KpiCardProps {
  title: string;
  value: number | string;
  format?: "currency" | "number";
}

export function KpiCard({ title, value, format = "currency" }: KpiCardProps) {
  let formattedValue: string | number = value;

  if (typeof value === 'number') {
    if (format === "currency") {
      formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } else if (format === "number") {
      formattedValue = value.toLocaleString('en-US'); // e.g., 1,200 instead of 1200
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
      <p className="text-xl font-bold text-gray-900 mt-2">{formattedValue}</p>
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
