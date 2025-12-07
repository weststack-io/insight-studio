"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import {
  IconRss,
  IconFileText,
  IconRefresh,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDatabase,
  IconChartBar,
} from "@tabler/icons-react";

interface ContentSource {
  id: string;
  type: string;
  title: string;
  url?: string;
  date?: string;
  reliabilityScore?: number;
  tags?: string[];
}

interface IngestionConfig {
  id: string;
  sourceType: string;
  status: string;
  lastRun?: string;
  nextRun?: string;
  config: any;
}

export default function SourcesPage() {
  const { data: session } = useSession();
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [ingestions, setIngestions] = useState<IngestionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sources" | "ingestion">("sources");
  const [showRSSModal, setShowRSSModal] = useState(false);
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [rssUrl, setRssUrl] = useState("");
  const [rssTitle, setRssTitle] = useState("");
  const [ingestionType, setIngestionType] = useState("market_data");
  const [ingestionSchedule, setIngestionSchedule] = useState("daily");

  useEffect(() => {
    if (session) {
      fetchSources();
      fetchIngestions();
    }
  }, [session]);

  const fetchSources = async () => {
    try {
      const response = await fetch("/api/sources");
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngestions = async () => {
    try {
      const response = await fetch("/api/ingestion");
      const data = await response.json();
      setIngestions(data.ingestions || []);
    } catch (error) {
      console.error("Failed to fetch ingestion configurations:", error);
    }
  };

  const handleIngestRSS = async () => {
    if (!rssUrl) {
      alert("Please enter an RSS feed URL");
      return;
    }

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "ingest_rss",
          url: rssUrl,
          title: rssTitle || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully ingested ${data.result.itemsCreated} items`);
        setShowRSSModal(false);
        setRssUrl("");
        setRssTitle("");
        fetchSources();
      } else {
        const error = await response.json();
        alert(`Failed to ingest RSS feed: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to ingest RSS feed:", error);
      alert("Failed to ingest RSS feed");
    }
  };

  const handleCreateIngestion = async () => {
    try {
      const config: any = {};
      if (ingestionType === "market_data") {
        config.schedule = ingestionSchedule;
      } else if (ingestionType === "rss") {
        config.url = rssUrl;
        config.title = rssTitle;
        config.schedule = ingestionSchedule;
      }

      const response = await fetch("/api/ingestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType: ingestionType,
          config,
          schedule: ingestionSchedule,
          status: "active",
        }),
      });

      if (response.ok) {
        alert("Ingestion configuration created successfully");
        setShowIngestionModal(false);
        setIngestionType("market_data");
        setIngestionSchedule("daily");
        setRssUrl("");
        setRssTitle("");
        fetchIngestions();
      } else {
        const error = await response.json();
        alert(`Failed to create ingestion: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create ingestion:", error);
      alert("Failed to create ingestion configuration");
    }
  };

  const handleDeleteIngestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingestion configuration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/ingestion?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Ingestion configuration deleted successfully");
        fetchIngestions();
      } else {
        const error = await response.json();
        alert(`Failed to delete ingestion: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to delete ingestion:", error);
      alert("Failed to delete ingestion configuration");
    }
  };

  const handleRecalculateReliability = async (sourceId: string) => {
    try {
      const response = await fetch("/api/sources", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId,
          action: "calculate_reliability",
        }),
      });

      if (response.ok) {
        alert("Reliability score recalculated");
        fetchSources();
      } else {
        const error = await response.json();
        alert(`Failed to recalculate reliability: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to recalculate reliability:", error);
      alert("Failed to recalculate reliability score");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Content Sources & Ingestion
            </h1>
            <p className="text-gray-600">
              Manage data sources and automated ingestion pipelines
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("sources")}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === "sources"
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Content Sources
              </button>
              <button
                onClick={() => setActiveTab("ingestion")}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === "ingestion"
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Ingestion Configurations
              </button>
            </div>
          </div>

          {/* Sources Tab */}
          {activeTab === "sources" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Content Sources ({sources.length})
                </h2>
                <button
                  onClick={() => setShowRSSModal(true)}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition inline-flex items-center gap-2"
                >
                  <IconPlus size={18} />
                  <span>Add RSS Feed</span>
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {sources.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <IconDatabase size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No content sources found</p>
                    <p className="text-sm mt-2">
                      Add an RSS feed to start ingesting content
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {source.type === "news" ? (
                                <IconRss size={20} className="text-blue-500" />
                              ) : (
                                <IconFileText size={20} className="text-gray-500" />
                              )}
                              <h3 className="font-medium text-gray-900">
                                {source.title}
                              </h3>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {source.type}
                              </span>
                            </div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {source.url}
                              </a>
                            )}
                            {source.date && (
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(source.date).toLocaleDateString()}
                              </p>
                            )}
                            {source.reliabilityScore !== undefined && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  Reliability:{" "}
                                  {(source.reliabilityScore * 100).toFixed(0)}%
                                </span>
                                <button
                                  onClick={() =>
                                    handleRecalculateReliability(source.id)
                                  }
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Recalculate
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ingestion Tab */}
          {activeTab === "ingestion" && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Ingestion Configurations ({ingestions.length})
                </h2>
                <button
                  onClick={() => setShowIngestionModal(true)}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition inline-flex items-center gap-2"
                >
                  <IconPlus size={18} />
                  <span>Create Configuration</span>
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {ingestions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <IconChartBar size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No ingestion configurations found</p>
                    <p className="text-sm mt-2">
                      Create a configuration to automate data ingestion
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {ingestions.map((ingestion) => (
                      <div
                        key={ingestion.id}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {ingestion.sourceType}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  ingestion.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : ingestion.status === "error"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {ingestion.status}
                              </span>
                            </div>
                            {ingestion.lastRun && (
                              <p className="text-sm text-gray-600">
                                Last run:{" "}
                                {new Date(ingestion.lastRun).toLocaleString()}
                              </p>
                            )}
                            {ingestion.nextRun && (
                              <p className="text-sm text-gray-600">
                                Next run:{" "}
                                {new Date(ingestion.nextRun).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteIngestion(ingestion.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <IconTrash size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RSS Modal */}
          {showRSSModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4">Add RSS Feed</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RSS Feed URL *
                    </label>
                    <input
                      type="url"
                      value={rssUrl}
                      onChange={(e) => setRssUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                      placeholder="https://example.com/feed.xml"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={rssTitle}
                      onChange={(e) => setRssTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                      placeholder="Feed title"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowRSSModal(false);
                        setRssUrl("");
                        setRssTitle("");
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleIngestRSS}
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition"
                    >
                      Ingest Feed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ingestion Modal */}
          {showIngestionModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4">
                  Create Ingestion Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Type *
                    </label>
                    <select
                      value={ingestionType}
                      onChange={(e) => setIngestionType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    >
                      <option value="market_data">Market Data</option>
                      <option value="rss">RSS Feed</option>
                    </select>
                  </div>
                  {ingestionType === "rss" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RSS Feed URL *
                        </label>
                        <input
                          type="url"
                          value={rssUrl}
                          onChange={(e) => setRssUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                          placeholder="https://example.com/feed.xml"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title (optional)
                        </label>
                        <input
                          type="text"
                          value={rssTitle}
                          onChange={(e) => setRssTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                          placeholder="Feed title"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule *
                    </label>
                    <select
                      value={ingestionSchedule}
                      onChange={(e) => setIngestionSchedule(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowIngestionModal(false);
                        setIngestionType("market_data");
                        setIngestionSchedule("daily");
                        setRssUrl("");
                        setRssTitle("");
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateIngestion}
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

