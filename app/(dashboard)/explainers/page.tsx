"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { ExplainerView } from "@/components/content/ExplainerView";
import { Explainer, Language } from "@/types";
import Header from "@/components/Header";

export default function ExplainersPage() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState("");
  const [explainer, setExplainer] = useState<Explainer | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setLanguage(user.language || "en");
    }
  }, [session]);

  const handleSearch = async (searchTopic?: string) => {
    const topicToSearch = searchTopic || topic;
    if (!topicToSearch.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/explainers?topic=${encodeURIComponent(
          topicToSearch
        )}&language=${language}`
      );
      const data = await response.json();
      if (data.explainer) {
        setExplainer(data.explainer);
      } else {
        // Generate if not found
        await handleGenerate(topicToSearch);
      }
    } catch (error) {
      console.error("Failed to fetch explainer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (
    generateTopic?: string,
    generateLanguage?: Language
  ) => {
    const topicToGenerate = generateTopic || topic;
    const langToUse = generateLanguage || language;

    if (!topicToGenerate.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/explainers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topicToGenerate,
          language: langToUse,
        }),
      });

      const data = await response.json();
      if (data.explainer) {
        setExplainer(data.explainer);
        setTopic(topicToGenerate);
      }
    } catch (error) {
      console.error("Failed to generate explainer:", error);
    } finally {
      setLoading(false);
    }
  };

  const popularTopics = [
    "CSBS",
    "Carried Interest",
    "Municipal Bond Ladders",
    "Tax Loss Harvesting",
    "Estate Planning",
    "Trust Structures",
    "Alternative Investments",
    "Private Equity",
  ];

  const user = session?.user as any;
  const tenant = user?.tenant;

  return (
    <div className="min-h-screen bg-light">
      <Header tenant={tenant} user={user} signOut={signOut} />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Topic Explainers
        </h1>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for a topic (e.g., CSBS, Carried Interest)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !topic.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Popular Topics:</p>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((popularTopic) => (
                <button
                  key={popularTopic}
                  onClick={() => handleSearch(popularTopic)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 cursor-pointer"
                >
                  {popularTopic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && !explainer && (
          <div className="text-center py-12 text-gray-500">
            Generating explainer...
          </div>
        )}

        {explainer && (
          <ExplainerView
            explainer={explainer}
            onGenerate={(topic, lang) =>
              handleGenerate(topic, lang as Language)
            }
          />
        )}

        {!loading && !explainer && (
          <div className="text-center py-12 text-gray-500">
            Search for a topic to get started, or click on a popular topic
            above.
          </div>
        )}
      </div>
    </div>
  );
}
