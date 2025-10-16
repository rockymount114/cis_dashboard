
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
            decimals={1}
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
