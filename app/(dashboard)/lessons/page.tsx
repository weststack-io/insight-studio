"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { LessonView } from "@/components/content/LessonView";
import { Lesson, Language, Generation, SophisticationLevel } from "@/types";
import Header from "@/components/Header";

export default function LessonsPage() {
  const { data: session } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [generation, setGeneration] = useState<Generation | "all">("all");
  const [sophisticationLevel, setSophisticationLevel] = useState<
    SophisticationLevel | "all"
  >("all");
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    if (session) {
      const user = session.user as any;
      setLanguage(user.language || "en");
      setGeneration(user.generation || "all");
      setSophisticationLevel(user.sophisticationLevel || "all");
      fetchLessons();
    }
  }, [session, topic, language, generation, sophisticationLevel]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (topic) {
        params.append("topic", topic);
      }
      if (generation !== "all") {
        params.append("generation", generation);
      }
      if (sophisticationLevel !== "all") {
        params.append("sophisticationLevel", sophisticationLevel);
      }
      params.append("language", language);

      const response = await fetch(`/api/lessons?${params.toString()}`);
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLesson = async () => {
    if (!newTopic.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: newTopic,
          generation: generation !== "all" ? generation : undefined,
          language,
          sophisticationLevel:
            sophisticationLevel !== "all" ? sophisticationLevel : undefined,
        }),
      });

      const data = await response.json();
      if (data.lesson) {
        await fetchLessons();
        setNewTopic("");
      }
    } catch (error) {
      console.error("Failed to generate lesson:", error);
    }
  };

  const popularTopics = [
    "Understanding Risk",
    "Diversification Basics",
    "Tax-Efficient Investing",
    "Retirement Planning",
    "Estate Planning Basics",
    "Investment Strategies",
    "Market Volatility",
    "Long-Term Wealth Building",
  ];

  const user = session?.user as any;
  const tenant = user?.tenant;

  return (
    <div className="min-h-screen bg-light">
      <Header tenant={tenant} user={user} signOut={signOut} />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-primary mb-6">Micro-Lessons</h1>

        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Generate New Lesson</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleGenerateLesson()}
              placeholder="Enter lesson topic"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleGenerateLesson}
              disabled={!newTopic.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Filter by topic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
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
                value={generation}
                onChange={(e) =>
                  setGeneration(e.target.value as Generation | "all")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All</option>
                <option value="GenX">Gen X</option>
                <option value="Millennial">Millennial</option>
                <option value="GenZ">Gen Z</option>
                <option value="Boomer">Boomer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={sophisticationLevel}
                onChange={(e) =>
                  setSophisticationLevel(
                    e.target.value as SophisticationLevel | "all"
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Popular Topics:</p>
          <div className="flex flex-wrap gap-2">
            {popularTopics.map((popularTopic) => (
              <button
                key={popularTopic}
                onClick={() => setTopic(popularTopic)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 cursor-pointer"
              >
                {popularTopic}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading lessons...
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No lessons found. Generate a new lesson to get started.
          </div>
        ) : (
          <div>
            {lessons.map((lesson) => (
              <LessonView key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
