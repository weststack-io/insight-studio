"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { BriefingCard } from "@/components/content/BriefingCard";
import { LessonView } from "@/components/content/LessonView";
import { PreferenceSelector } from "@/components/personalization/PreferenceSelector";
import {
  Briefing,
  Lesson,
  Explainer,
  Language,
  Generation,
  SophisticationLevel,
} from "@/types";
import Header from "@/components/Header";

interface PersonalizedContent {
  briefings: Briefing[];
  explainers: Explainer[];
  lessons: Lesson[];
  recommendedTopics: string[];
}

export default function DashboardPage() {
  const { data: session, update } = useSession();
  const [content, setContent] = useState<PersonalizedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "feed" | "preferences" | "profile"
  >("feed");

  // Profile form state
  const [profileData, setProfileData] = useState({
    language: "en" as Language,
    generation: "" as Generation | "",
    sophisticationLevel: "" as SophisticationLevel | "",
    addeparPortfolioId: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showAddeparPortfolioId, setShowAddeparPortfolioId] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPersonalizedContent();
      // Initialize profile form data from session
      const user = session.user as any;

      // Parse preferences to get addeparPortfolioId
      let addeparPortfolioId = "";
      if (user.preferences) {
        try {
          const preferences = JSON.parse(user.preferences);
          addeparPortfolioId = preferences.addeparPortfolioId || "";
        } catch (e) {
          // If parsing fails, leave empty
        }
      }

      setProfileData({
        language: (user.language as Language) || "en",
        generation: (user.generation as Generation | "") || "",
        sophisticationLevel:
          (user.sophisticationLevel as SophisticationLevel | "") || "",
        addeparPortfolioId,
      });
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

  const handleDeleteBriefing = async (briefingId: string) => {
    try {
      const response = await fetch(`/api/briefings?id=${briefingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPersonalizedContent();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete briefing");
      }
    } catch (error) {
      console.error("Failed to delete briefing:", error);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user) return;

    try {
      setSavingProfile(true);
      setProfileSaveMessage(null);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: profileData.language,
          generation: profileData.generation || null,
          sophisticationLevel: profileData.sophisticationLevel || null,
          addeparPortfolioId: profileData.addeparPortfolioId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      const data = await response.json();

      // Update session to reflect changes
      await update();

      setProfileSaveMessage({
        type: "success",
        text: "Profile settings saved successfully!",
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setProfileSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setProfileSaveMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save profile settings",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <p className="text-gray-600 mb-6 text-lg">
              Please sign in to continue
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105"
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
    <div className="min-h-screen bg-light w-screen flex flex-col">
      <Header tenant={tenant} user={user} signOut={signOut} />
      {/* Main Content Container */}
      <main className="flex-1 flex flex-col pt-16">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col">
          {/* Tabs */}
          <div className="mb-8 lg:mb-12 border-b border-gray-200/60 shrink-0">
            <div className="flex items-center gap-4 sm:gap-2 overflow-x-auto -mb-px justify-center">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap transition-all border-b-2 ${
                  activeTab === "feed"
                    ? "text-accent border-accent"
                    : "text-gray-500 border-transparent hover:text-accent hover:border-gray-300"
                }`}
              >
                Personalized Feed
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap transition-all border-b-2 ${
                  activeTab === "preferences"
                    ? "text-accent border-accent"
                    : "text-gray-500 border-transparent hover:text-accent hover:border-gray-300"
                }`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base whitespace-nowrap transition-all border-b-2 ${
                  activeTab === "profile"
                    ? "text-accent border-accent"
                    : "text-gray-500 border-transparent hover:text-accent hover:border-gray-300"
                }`}
              >
                Profile
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === "feed" && (
            <div className="flex-1 flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center py-24">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
                    <p className="text-gray-600 text-lg">
                      Loading personalized content...
                    </p>
                  </div>
                </div>
              ) : content ? (
                <div className="flex-1 flex flex-col gap-8 lg:gap-12 max-w-5xl mx-auto w-full">
                  {/* Recommended Topics */}
                  {content.recommendedTopics.length > 0 && (
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-10 shrink-0">
                      <div className="flex flex-col items-center">
                        <h2 className="text-xl lg:text-2xl font-semibold text-dark mb-6 lg:mb-8">
                          Recommended Topics
                        </h2>
                        <div className="flex flex-wrap gap-3 justify-center items-center w-full">
                          {content.recommendedTopics.map((topic, index) => (
                            <Link
                              key={index}
                              href={`/explainers?topic=${encodeURIComponent(
                                topic
                              )}`}
                              className="px-4 py-2 bg-accent text-white rounded-full hover:opacity-90 hover:scale-105 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                            >
                              {topic}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Recent Briefings */}
                  {content.briefings.length > 0 && (
                    <section className="flex-1 flex flex-col">
                      <div className="flex items-center justify-center mb-6 lg:mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-dark">
                          Recent Briefings
                        </h2>
                      </div>
                      <div className="flex flex-col gap-4 lg:gap-6">
                        {content.briefings.map((briefing) => (
                          <BriefingCard
                            key={briefing.id}
                            briefing={briefing}
                            onDelete={handleDeleteBriefing}
                          />
                        ))}
                      </div>
                      <div className="mt-6 lg:mt-8 flex justify-center">
                        <Link
                          href="/briefings"
                          className="inline-flex items-center gap-2 text-accent hover:opacity-80 font-medium transition-all group"
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
                    <section className="flex-1 flex flex-col">
                      <div className="flex items-center justify-center mb-6 lg:mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-dark">
                          Recommended Lessons
                        </h2>
                      </div>
                      <div className="flex flex-col gap-4 lg:gap-6">
                        {content.lessons.map((lesson) => (
                          <LessonView key={lesson.id} lesson={lesson} />
                        ))}
                      </div>
                      <div className="mt-6 lg:mt-8 flex justify-center">
                        <Link
                          href="/lessons"
                          className="inline-flex items-center gap-2 text-accent hover:opacity-80 font-medium transition-all group"
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
                      <div className="flex-1 flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 lg:p-16 w-full max-w-md">
                          <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                              <svg
                                className="w-8 h-8 text-accent"
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
                            <h3 className="text-lg font-semibold text-dark mb-2">
                              No personalized content yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                              Set your preferences and generate some content to
                              get started.
                            </p>
                            <button
                              onClick={() => setActiveTab("preferences")}
                              className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 hover:scale-105 transition-all font-medium shadow-lg hover:shadow-xl"
                            >
                              Set Preferences
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-white rounded-xl shadow-sm border border-red-100 p-12 w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
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
                      <h3 className="text-lg font-semibold text-dark mb-2">
                        Failed to load content
                      </h3>
                      <p className="text-gray-600 mb-6">
                        There was an error loading your personalized content.
                        Please try refreshing the page.
                      </p>
                      <button
                        onClick={() => fetchPersonalizedContent()}
                        className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 hover:scale-105 transition-all font-medium shadow-lg hover:shadow-xl"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-10">
                  <PreferenceSelector
                    onPreferencesChange={() => fetchPersonalizedContent()}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-10">
                  <div className="flex flex-col items-center mb-8 lg:mb-10">
                    <h2 className="text-2xl lg:text-3xl font-bold text-dark">
                      Profile Settings
                    </h2>
                  </div>
                  <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                    {/* Success/Error Message */}
                    {profileSaveMessage && (
                      <div
                        className={`p-4 rounded-lg ${
                          profileSaveMessage.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {profileSaveMessage.type === "success" ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                          <span className="font-medium">
                            {profileSaveMessage.text}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col">
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

                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={profileData.language}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            language: e.target.value as Language,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Generation
                      </label>
                      <select
                        value={profileData.generation}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            generation: e.target.value as Generation | "",
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-white"
                      >
                        <option value="">Not specified</option>
                        <option value="GenX">Gen X</option>
                        <option value="Millennial">Millennial</option>
                        <option value="GenZ">Gen Z</option>
                        <option value="Boomer">Boomer</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Investment Sophistication Level
                      </label>
                      <select
                        value={profileData.sophisticationLevel}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            sophisticationLevel: e.target.value as
                              | SophisticationLevel
                              | "",
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-white"
                      >
                        <option value="">Not specified</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
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

                    <div className="flex flex-col">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Addepar Portfolio ID
                      </label>
                      <div className="relative">
                        <input
                          type={showAddeparPortfolioId ? "text" : "password"}
                          value={profileData.addeparPortfolioId}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              addeparPortfolioId: e.target.value,
                            })
                          }
                          placeholder="Enter your Addepar Portfolio ID"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowAddeparPortfolioId(!showAddeparPortfolioId)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                          aria-label={
                            showAddeparPortfolioId
                              ? "Hide Portfolio ID"
                              : "Show Portfolio ID"
                          }
                        >
                          {showAddeparPortfolioId ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Your Addepar Portfolio ID is used to fetch portfolio
                        data for portfolio briefings.
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                      >
                        {savingProfile ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Save Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
