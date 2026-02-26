'use client';

interface MetricsRow {
  id: string;
  contentId: string;
  contentType: string;
  totalOpens: number;
  uniqueOpens: number;
  avgDwellTime: number;
  avgScrollDepth: number;
  completionRate: number;
  avgRating: number | null;
  engagementScore: number;
}

interface MetricsTableProps {
  metrics: MetricsRow[];
  contentTitles?: Map<string, string>;
}

export function MetricsTable({ metrics, contentTitles }: MetricsTableProps) {
  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <p className="text-sm text-gray-400 text-center py-8">
          No metrics data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Content
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Type
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Opens
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Unique
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Avg Dwell
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Scroll %
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Completion
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Rating
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr
                key={m.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px] truncate">
                  {contentTitles?.get(m.contentId) ||
                    m.contentId.slice(0, 8) + '...'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/10 text-secondary capitalize">
                    {m.contentType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {m.totalOpens}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {m.uniqueOpens}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatDwell(m.avgDwellTime)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {Math.round(m.avgScrollDepth)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {Math.round(m.completionRate * 100)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {m.avgRating ? m.avgRating.toFixed(1) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ${
                      m.engagementScore >= 70
                        ? 'bg-green-100 text-green-700'
                        : m.engagementScore >= 40
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {m.engagementScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDwell(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m ${sec}s`;
}
