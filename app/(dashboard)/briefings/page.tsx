"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Header from "@/components/Header";
import { BriefingCard } from "@/components/content/BriefingCard";
import { Briefing, BriefingType } from "@/types";

export default function BriefingsPage() {
  const { data: session } = useSession();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BriefingType | "all">("all");
  const [generating, setGenerating] = useState<BriefingType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchBriefings();
    }
  }, [session, filter]);

  const fetchBriefings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("type", filter);
      }

      const response = await fetch(`/api/briefings?${params.toString()}`);
      const data = await response.json();
      setBriefings(data.briefings || []);
    } catch (error) {
      console.error("Failed to fetch briefings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBriefing = async (type: BriefingType) => {
    if (generating) {
      return;
    }

    try {
      setGenerating(type);
      setError(null);
      const response = await fetch("/api/briefings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate briefing");
      }

      const data = await response.json();
      if (data.briefing) {
        // Refresh briefings list without showing full page loading
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.append("type", filter);
        }
        const fetchResponse = await fetch(`/api/briefings?${params.toString()}`);
        const fetchData = await fetchResponse.json();
        setBriefings(fetchData.briefings || []);
        
        // If filter doesn't match the generated type, switch to show it
        if (filter !== "all" && filter !== type) {
          setFilter(type);
        }
      }
    } catch (error) {
      console.error("Failed to generate briefing:", error);
      setError(error instanceof Error ? error.message : "Failed to generate briefing");
    } finally {
      setGenerating(null);
    }
  };

  const handleDeleteBriefing = async (briefingId: string) => {
    try {
      const response = await fetch(`/api/briefings?id=${briefingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBriefings();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete briefing");
      }
    } catch (error) {
      console.error("Failed to delete briefing:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center">Loading briefings...</div>
        </div>
      </div>
    );
  }

  const user = session?.user as any;
  const tenant = user?.tenant;
  return (
    <div className="min-h-screen bg-light">
      <Header tenant={tenant} user={user} signOut={signOut} />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Weekly Briefings</h1>
          <div className="flex gap-2">
            <button
              onClick={() => generateBriefing("market")}
              disabled={generating !== null}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating === "market" && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {generating === "market" ? "Generating..." : "Generate Market Briefing"}
            </button>
            <button
              onClick={() => generateBriefing("portfolio")}
              disabled={generating !== null}
              className="px-4 py-2 bg-secondary text-white rounded hover:bg-opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating === "portfolio" && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {generating === "portfolio" ? "Generating..." : "Generate Portfolio Briefing"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            <div className="flex items-center gap-2">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent"></div>
              <span>
                Generating {generating === "market" ? "Market" : "Portfolio"} Briefing... This may take a moment.
              </span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("market")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "market"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setFilter("portfolio")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "portfolio"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Portfolio
            </button>
          </div>
        </div>

        {briefings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No briefings found. Generate your first briefing to get started.
          </div>
        ) : (
          <div>
            {briefings.map((briefing) => (
              <BriefingCard 
                key={briefing.id} 
                briefing={briefing} 
                onDelete={handleDeleteBriefing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
