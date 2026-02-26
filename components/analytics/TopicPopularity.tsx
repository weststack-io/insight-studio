'use client';

interface TopicPopularityProps {
  data: { topic: string; count: number }[];
}

export function TopicPopularity({ data }: TopicPopularityProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          Content Type Popularity
        </h3>
        <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        Content Type Popularity
      </h3>
      <div className="space-y-3">
        {data.map(({ topic, count }) => (
          <div key={topic}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 capitalize">
                {topic}s
              </span>
              <span className="text-gray-500">{count} events</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[var(--color-accent)] h-2 rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
