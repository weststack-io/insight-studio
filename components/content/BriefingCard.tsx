"use client";

import { Briefing } from "@/types";
import { format } from "date-fns";
import { useState } from "react";

interface BriefingCardProps {
  briefing: Briefing;
  onDelete?: (briefingId: string) => Promise<void>;
}

export function BriefingCard({ briefing, onDelete }: BriefingCardProps) {
  const content = JSON.parse(briefing.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(briefing.id);
    } catch (error) {
      console.error("Failed to delete briefing:", error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            {content.title || `${briefing.type} Briefing`}
          </h3>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Week of {format(new Date(briefing.weekStartDate), "MMMM d, yyyy")}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Created{" "}
              {format(
                new Date(briefing.generatedAt),
                "MMMM d, yyyy 'at' h:mm a"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-secondary text-white shadow-sm">
            {briefing.type}
          </span>
          {onDelete && (
            <div className="relative">
              {showConfirm ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-red-700 font-medium">
                    Delete?
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Yes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isDeleting}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Delete briefing"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {content.summary && (
        <p className="text-gray-700 mb-6 leading-relaxed">{content.summary}</p>
      )}

      {content.sections && content.sections.length > 0 && (
        <div className="space-y-5 mb-6">
          {content.sections.map((section: any, index: number) => (
            <div
              key={index}
              className="pb-5 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                {section.heading}
              </h4>
              <p className="text-gray-600 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {content.keyTakeaways && content.keyTakeaways.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Key Takeaways
          </h4>
          <ul className="space-y-2">
            {content.keyTakeaways.map((takeaway: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="text-primary mt-1.5 flex-shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="flex-1">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.nextSteps && content.nextSteps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            Next Steps
          </h4>
          <ul className="space-y-2">
            {content.nextSteps.map((step: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="text-primary mt-1.5 flex-shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
