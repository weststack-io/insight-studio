'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Header from '@/components/Header';
import { KPICard } from '@/components/analytics/KPICard';
import { EngagementTrend } from '@/components/analytics/EngagementTrend';
import { TopicPopularity } from '@/components/analytics/TopicPopularity';
import { MetricsTable } from '@/components/analytics/MetricsTable';

type Tab = 'overview' | 'performance' | 'engagement' | 'reports';

interface DashboardData {
  kpis: {
    totalEvents: number;
    activeUsers: number;
    openRate: number;
    completionRate: number;
    avgDwellTime: number;
    completeEvents: number;
  };
  dailyTrends: { date: string; events: number; uniqueUsers: number }[];
  topContent: any[];
  topicPopularity: { topic: string; count: number }[];
  period: string;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdvisor = user?.role === 'advisor';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState('30d');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [learningLogs, setLearningLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsFilter, setMetricsFilter] = useState({
    contentType: '',
    sort: 'engagementScore',
  });
  const [reportPeriod, setReportPeriod] = useState('30d');
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [backfillError, setBackfillError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdvisor) return;
    fetchDashboardData();
  }, [isAdvisor, period]);

  useEffect(() => {
    if (!isAdvisor || activeTab !== 'performance') return;
    fetchMetrics();
  }, [isAdvisor, activeTab, metricsFilter, period]);

  useEffect(() => {
    if (!isAdvisor || activeTab !== 'engagement') return;
    fetchLearningLogs();
  }, [isAdvisor, activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/dashboard?period=${period}`);
      if (res.ok) {
        setDashboardData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams({ period });
      if (metricsFilter.contentType) params.set('contentType', metricsFilter.contentType);
      if (metricsFilter.sort) params.set('sort', metricsFilter.sort);

      const res = await fetch(`/api/analytics/metrics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMetricsData(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchLearningLogs = async () => {
    // Preference learning logs will be fetched when the algorithm runs
    // For now, show placeholder
    setLearningLogs([]);
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportError(null);
    try {
      // Use metrics and dashboard data to build a report
      const res = await fetch(`/api/analytics/dashboard?period=${reportPeriod}`);
      if (res.ok) {
        setReportData(await res.json());
      } else {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      setReportData(null);
      setReportError(
        err instanceof Error ? err.message : 'Failed to generate report'
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackfillMetrics = async () => {
    setBackfilling(true);
    setBackfillMessage(null);
    setBackfillError(null);

    try {
      const res = await fetch('/api/analytics/backfill', {
        method: 'POST',
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = data?.details ? ` (${data.details})` : '';
        throw new Error((data?.error || 'Failed to rebuild metrics') + detail);
      }

      const processed = data?.processedContentItems ?? 0;
      const events = data?.eventCount ?? 0;
      const before = data?.beforeMetricsCount ?? 0;
      const after = data?.afterMetricsCount ?? 0;

      setBackfillMessage(
        `Rebuilt ${processed} content item(s) from ${events} event(s). Metrics rows: ${before} -> ${after}.`
      );

      if (activeTab === 'overview') {
        await fetchDashboardData();
      }
      if (activeTab === 'performance') {
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to backfill analytics metrics:', err);
      setBackfillError(
        err instanceof Error ? err.message : 'Failed to rebuild metrics'
      );
    } finally {
      setBackfilling(false);
    }
  };

  if (!isAdvisor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header tenant={user?.tenant} user={user} signOut={signOut} />
        <div className="pt-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500">
              This page is only available to advisors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Content Performance' },
    { id: 'engagement', label: 'User Engagement' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header tenant={user?.tenant} user={user} signOut={signOut} />
      <div className="pt-24 px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && activeTab === 'overview' ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && dashboardData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Total Events"
                    value={dashboardData.kpis.totalEvents.toLocaleString()}
                    subtitle={`in last ${period}`}
                  />
                  <KPICard
                    title="Active Users"
                    value={dashboardData.kpis.activeUsers}
                  />
                  <KPICard
                    title="Completion Rate"
                    value={`${dashboardData.kpis.completionRate}%`}
                    target=">40%"
                    trend={
                      dashboardData.kpis.completionRate >= 40 ? 'up' : 'down'
                    }
                  />
                  <KPICard
                    title="Avg Dwell Time"
                    value={formatDwellDisplay(dashboardData.kpis.avgDwellTime)}
                    target=">5 min"
                    trend={
                      dashboardData.kpis.avgDwellTime >= 300 ? 'up' : 'down'
                    }
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EngagementTrend data={dashboardData.dailyTrends} />
                  <TopicPopularity data={dashboardData.topicPopularity} />
                </div>

                {dashboardData.topContent.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Top Performing Content
                    </h3>
                    <MetricsTable metrics={dashboardData.topContent} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && !dashboardData && !loading && (
              <div className="text-center py-12 text-gray-400">
                No analytics data available yet. Data will appear as clients interact with content.
              </div>
            )}

            {/* Content Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={metricsFilter.contentType}
                    onChange={(e) =>
                      setMetricsFilter((f) => ({
                        ...f,
                        contentType: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="briefing">Briefings</option>
                    <option value="explainer">Explainers</option>
                    <option value="lesson">Lessons</option>
                  </select>
                  <select
                    value={metricsFilter.sort}
                    onChange={(e) =>
                      setMetricsFilter((f) => ({ ...f, sort: e.target.value }))
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="engagementScore">Engagement Score</option>
                    <option value="totalOpens">Total Opens</option>
                    <option value="completionRate">Completion Rate</option>
                    <option value="avgDwellTime">Avg Dwell Time</option>
                    <option value="avgRating">Rating</option>
                  </select>
                </div>
                <MetricsTable metrics={metricsData} />
              </div>
            )}

            {/* User Engagement Tab */}
            {activeTab === 'engagement' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <KPICard
                    title="Active Users"
                    value={dashboardData?.kpis.activeUsers ?? 0}
                    subtitle={`in last ${period}`}
                  />
                  <KPICard
                    title="Content Completions"
                    value={dashboardData?.kpis.completeEvents ?? 0}
                    subtitle={`in last ${period}`}
                  />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Preference Learning Activity
                  </h3>
                  {learningLogs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No preference learning activity yet. The system adjusts preferences weekly based on engagement patterns.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {learningLogs.map((log: any) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              {log.topic}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {log.previousLevel} → {log.newLevel}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            Confidence: {Math.round(log.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Generate Engagement Report
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {generatingReport ? 'Generating...' : 'Generate Report'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackfillMetrics}
                      disabled={backfilling}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {backfilling
                        ? 'Rebuilding...'
                        : 'Rebuild Analytics Metrics'}
                    </button>
                  </div>
                  {reportError && (
                    <p className="text-sm text-red-600 mt-3">{reportError}</p>
                  )}
                  {backfillError && (
                    <p className="text-sm text-red-600 mt-3">{backfillError}</p>
                  )}
                  {backfillMessage && (
                    <p className="text-sm text-green-700 mt-3">{backfillMessage}</p>
                  )}
                </div>

                {reportData && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">
                        Report Summary
                      </h3>
                      <button
                        type="button"
                        onClick={downloadReport}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        Download JSON
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Total Events</p>
                        <p className="text-lg font-bold text-gray-900">
                          {reportData.kpis.totalEvents.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Active Users</p>
                        <p className="text-lg font-bold text-gray-900">
                          {reportData.kpis.activeUsers}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Completion Rate</p>
                        <p className="text-lg font-bold text-gray-900">
                          {reportData.kpis.completionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Avg Dwell Time</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDwellDisplay(reportData.kpis.avgDwellTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Content Types</p>
                        <p className="text-lg font-bold text-gray-900">
                          {reportData.topicPopularity?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Top Content</p>
                        <p className="text-lg font-bold text-gray-900">
                          {reportData.topContent?.length ?? 0} items
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}

function formatDwellDisplay(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}
