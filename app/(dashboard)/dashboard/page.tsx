"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { BriefingCard } from "@/components/content/BriefingCard";
import { LessonView } from "@/components/content/LessonView";
import { PreferenceSelector } from "@/components/personalization/PreferenceSelector";
import { Briefing, Lesson, Explainer } from "@/types";

interface PersonalizedContent {
  briefings: Briefing[];
  explainers: Explainer[];
  lessons: Lesson[];
  recommendedTopics: string[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState<PersonalizedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "feed" | "preferences" | "profile"
  >("feed");

  useEffect(() => {
    if (session) {
      fetchPersonalizedContent();
    }
  }, [session]);

  const fetchPersonalizedContent = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/personalize");
      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      console.error("Failed to fetch personalized content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <p className="text-gray-600 mb-6 text-lg">
              Please sign in to continue
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-md hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user as any;
  const tenant = user.tenant;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8 lg:gap-12">
              <Link
                href="/dashboard"
                className="text-xl sm:text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
              >
                {tenant?.name || "Insight Studio"}
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/briefings"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Briefings
                </Link>
                <Link
                  href="/explainers"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Explainers
                </Link>
                <Link
                  href="/lessons"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Lessons
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline-block text-sm text-gray-600 truncate max-w-[150px] lg:max-w-none">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto -mb-px justify-center">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap transition-colors border-b-2 ${
                activeTab === "feed"
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Personalized Feed
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap transition-colors border-b-2 ${
                activeTab === "preferences"
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap transition-colors border-b-2 ${
                activeTab === "profile"
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "feed" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                  <p className="text-gray-500 text-lg">
                    Loading personalized content...
                  </p>
                </div>
              </div>
            ) : content ? (
              <div className="space-y-8 lg:space-y-12 max-w-5xl mx-auto">
                {/* Recommended Topics */}
                {content.recommendedTopics.length > 0 && (
                  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                    <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6 text-center">
                      Recommended Topics
                    </h2>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {content.recommendedTopics.map((topic, index) => (
                        <Link
                          key={index}
                          href={`/explainers?topic=${encodeURIComponent(
                            topic
                          )}`}
                          className="px-4 py-2 bg-secondary text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium shadow-sm hover:shadow-md"
                        >
                          {topic}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recent Briefings */}
                {content.briefings.length > 0 && (
                  <section>
                    <div className="flex items-center justify-center mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        Recent Briefings
                      </h2>
                    </div>
                    <div className="space-y-4 lg:space-y-6">
                      {content.briefings.map((briefing) => (
                        <BriefingCard key={briefing.id} briefing={briefing} />
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <Link
                        href="/briefings"
                        className="inline-flex items-center gap-2 text-primary hover:opacity-80 font-medium transition-opacity group"
                      >
                        View all briefings
                        <span className="group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </Link>
                    </div>
                  </section>
                )}

                {/* Recommended Lessons */}
                {content.lessons.length > 0 && (
                  <section>
                    <div className="flex items-center justify-center mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        Recommended Lessons
                      </h2>
                    </div>
                    <div className="space-y-4 lg:space-y-6">
                      {content.lessons.map((lesson) => (
                        <LessonView key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <Link
                        href="/lessons"
                        className="inline-flex items-center gap-2 text-primary hover:opacity-80 font-medium transition-opacity group"
                      >
                        View all lessons
                        <span className="group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </Link>
                    </div>
                  </section>
                )}

                {content.briefings.length === 0 &&
                  content.lessons.length === 0 &&
                  content.recommendedTopics.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 lg:p-16 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No personalized content yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Set your preferences and generate some content to get
                          started.
                        </p>
                        <button
                          onClick={() => setActiveTab("preferences")}
                          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-md hover:shadow-lg"
                        >
                          Set Preferences
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Failed to load content
                  </h3>
                  <p className="text-gray-600 mb-6">
                    There was an error loading your personalized content. Please
                    try refreshing the page.
                  </p>
                  <button
                    onClick={() => fetchPersonalizedContent()}
                    className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-md hover:shadow-lg"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <PreferenceSelector
                onPreferencesChange={() => fetchPersonalizedContent()}
              />
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 text-center">
                Profile Settings
              </h2>
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    defaultValue={user.language || "en"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Generation
                  </label>
                  <select
                    defaultValue={user.generation || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="GenX">Gen X</option>
                    <option value="Millennial">Millennial</option>
                    <option value="GenZ">Gen Z</option>
                    <option value="Boomer">Boomer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Investment Sophistication Level
                  </label>
                  <select
                    defaultValue={user.sophisticationLevel || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
