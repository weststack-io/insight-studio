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
    try {
      const response = await fetch("/api/briefings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        await fetchBriefings();
      }
    } catch (error) {
      console.error("Failed to generate briefing:", error);
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
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 cursor-pointer"
            >
              Generate Market Briefing
            </button>
            <button
              onClick={() => generateBriefing("portfolio")}
              className="px-4 py-2 bg-secondary text-white rounded hover:bg-opacity-90 cursor-pointer"
            >
              Generate Portfolio Briefing
            </button>
          </div>
        </div>

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
              <BriefingCard key={briefing.id} briefing={briefing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
