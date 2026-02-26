'use client';

interface TrendPoint {
  date: string;
  events: number;
  uniqueUsers: number;
}

interface EngagementTrendProps {
  data: TrendPoint[];
}

export function EngagementTrend({ data }: EngagementTrendProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Daily Activity</h3>
        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
      </div>
    );
  }

  const maxEvents = Math.max(...data.map((d) => d.events), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Daily Activity</h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((point) => {
          const height = (point.events / maxEvents) * 100;
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-[var(--color-accent)]/70 hover:bg-[var(--color-accent)] rounded-t transition-colors min-h-[2px]"
                style={{ height: `${height}%` }}
                title={`${point.date}: ${point.events} events, ${point.uniqueUsers} users`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-400">
          {data[0]?.date.slice(5)}
        </span>
        <span className="text-xs text-gray-400">
          {data[data.length - 1]?.date.slice(5)}
        </span>
      </div>
    </div>
  );
}
