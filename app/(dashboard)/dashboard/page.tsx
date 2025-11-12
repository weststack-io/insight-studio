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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to continue</p>
          <Link
            href="/login"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const user = session.user as any;
  const tenant = user.tenant;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-2xl font-bold text-primary cursor-pointer"
              >
                {tenant?.name || "Insight Studio"}
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary cursor-pointer"
                >
                  Dashboard
                </Link>
                <Link
                  href="/briefings"
                  className="text-gray-700 hover:text-primary cursor-pointer"
                >
                  Briefings
                </Link>
                <Link
                  href="/explainers"
                  className="text-gray-700 hover:text-primary cursor-pointer"
                >
                  Explainers
                </Link>
                <Link
                  href="/lessons"
                  className="text-gray-700 hover:text-primary cursor-pointer"
                >
                  Lessons
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-gray-700 hover:text-primary cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 py-2 font-medium cursor-pointer ${
                activeTab === "feed"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Personalized Feed
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-4 py-2 font-medium cursor-pointer ${
                activeTab === "preferences"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium cursor-pointer ${
                activeTab === "profile"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-primary"
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
              <div className="text-center py-12 text-gray-500">
                Loading personalized content...
              </div>
            ) : content ? (
              <div className="space-y-8">
                {/* Recommended Topics */}
                {content.recommendedTopics.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-primary mb-4">
                      Recommended Topics
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {content.recommendedTopics.map((topic, index) => (
                        <Link
                          key={index}
                          href={`/explainers?topic=${encodeURIComponent(
                            topic
                          )}`}
                          className="px-4 py-2 bg-secondary text-white rounded-full hover:bg-opacity-80 cursor-pointer"
                        >
                          {topic}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Briefings */}
                {content.briefings.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-4">
                      Recent Briefings
                    </h2>
                    {content.briefings.map((briefing) => (
                      <BriefingCard key={briefing.id} briefing={briefing} />
                    ))}
                    <div className="mt-4">
                      <Link
                        href="/briefings"
                        className="text-primary hover:underline cursor-pointer"
                      >
                        View all briefings →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Recommended Lessons */}
                {content.lessons.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-4">
                      Recommended Lessons
                    </h2>
                    {content.lessons.map((lesson) => (
                      <LessonView key={lesson.id} lesson={lesson} />
                    ))}
                    <div className="mt-4">
                      <Link
                        href="/lessons"
                        className="text-primary hover:underline cursor-pointer"
                      >
                        View all lessons →
                      </Link>
                    </div>
                  </div>
                )}

                {content.briefings.length === 0 &&
                  content.lessons.length === 0 &&
                  content.recommendedTopics.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="mb-4">No personalized content yet.</p>
                      <p>
                        Set your preferences and generate some content to get
                        started.
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Failed to load personalized content.
              </div>
            )}
          </div>
        )}

        {activeTab === "preferences" && (
          <div>
            <PreferenceSelector
              onPreferencesChange={() => fetchPersonalizedContent()}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Profile Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  defaultValue={user.language || "en"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generation
                </label>
                <select
                  defaultValue={user.generation || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Not specified</option>
                  <option value="GenX">Gen X</option>
                  <option value="Millennial">Millennial</option>
                  <option value="GenZ">Gen Z</option>
                  <option value="Boomer">Boomer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Sophistication Level
                </label>
                <select
                  defaultValue={user.sophisticationLevel || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Not specified</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={user.role || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
