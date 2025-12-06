"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Header from "@/components/Header";
import { IconCheck, IconX, IconEdit, IconEye } from "@tabler/icons-react";

type ContentType = "briefing" | "explainer" | "lesson";
type ReviewStatus = "pending_review" | "approved" | "rejected" | "changes_requested";

interface Review {
  id: string;
  contentId: string;
  contentType: ContentType;
  status: ReviewStatus;
  comments: string | null;
  version: number;
  createdAt: string;
  reviewedAt: string | null;
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: string;
  content: any;
}

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [contentItems, setContentItems] = useState<Record<string, ContentItem>>({});
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (session) {
      fetchReviews();
    }
  }, [session, filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();
      const reviewsData = data.reviews || [];
      setReviews(reviewsData);

      // Extract content from reviews (now included in API response)
      const contentMap: Record<string, ContentItem> = {};
      for (const review of reviewsData) {
        if (review.content && !contentMap[review.contentId]) {
          contentMap[review.contentId] = {
            id: review.content.id,
            title: review.content.title,
            type: review.contentType,
            status: review.content.status,
            content: review.content.content,
          };
        }
      }
      setContentItems(contentMap);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async (contentId: string, contentType: ContentType): Promise<ContentItem | null> => {
    try {
      // Fetch content directly from API - we'll need to get all and filter
      // For now, we'll create a simple API endpoint or fetch from reviews API
      // Since the existing APIs don't support fetching by ID, we'll handle it in the reviews API
      const response = await fetch(`/api/reviews?contentId=${contentId}&contentType=${contentType}`);
      const data = await response.json();
      
      // If we have reviews, we can infer the content structure
      // For a better implementation, we should add a content endpoint
      // For now, return a placeholder
      return {
        id: contentId,
        title: `${contentType} Content`,
        type: contentType,
        status: "draft",
        content: {},
      };
    } catch (error) {
      console.error("Failed to fetch content:", error);
    }
    return null;
  };

  const handleReviewAction = async (
    reviewId: string,
    status: ReviewStatus
  ) => {
    try {
      setActionLoading(reviewId);
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          status,
          comments: comments || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update review");
      }

      await fetchReviews();
      setSelectedReview(null);
      setComments("");
    } catch (error) {
      console.error("Failed to update review:", error);
      alert(error instanceof Error ? error.message : "Failed to update review");
    } finally {
      setActionLoading(null);
    }
  };

  const user = session?.user as any;
  const isAdvisor = user?.role === "advisor";

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Header tenant={user?.tenant} user={user} signOut={signOut} />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center">Loading reviews...</div>
        </div>
      </div>
    );
  }

  const pendingReviews = reviews.filter((r) => r.status === "pending_review");
  const filteredReviews = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-light">
      <Header tenant={user?.tenant} user={user} signOut={signOut} />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Content Reviews</h1>
          {pendingReviews.length > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {pendingReviews.length} Pending
            </span>
          )}
        </div>

        {/* Filter buttons */}
        <div className="mb-6">
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
              onClick={() => setFilter("pending_review")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "pending_review"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "approved"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "rejected"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setFilter("changes_requested")}
              className={`px-4 py-2 rounded cursor-pointer ${
                filter === "changes_requested"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Changes Requested
            </button>
          </div>
        </div>

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No reviews found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const content = contentItems[review.contentId];
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {content?.title || `${review.contentType} Review`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500 capitalize">
                          {review.contentType}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          Version {review.version}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            review.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : review.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : review.status === "changes_requested"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {review.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowComparison(false);
                        }}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded"
                        title="View details"
                      >
                        <IconEye size={20} />
                      </button>
                      {isAdvisor && review.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => handleReviewAction(review.id, "approved")}
                            disabled={actionLoading === review.id}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Approve"
                          >
                            <IconCheck size={20} />
                          </button>
                          <button
                            onClick={() => handleReviewAction(review.id, "rejected")}
                            disabled={actionLoading === review.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Reject"
                          >
                            <IconX size={20} />
                          </button>
                          <button
                            onClick={() => handleReviewAction(review.id, "changes_requested")}
                            disabled={actionLoading === review.id}
                            className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded disabled:opacity-50"
                            title="Request changes"
                          >
                            <IconEdit size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {review.comments && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                      <strong>Comments:</strong> {review.comments}
                    </div>
                  )}

                  {review.reviewer && (
                    <div className="mt-2 text-sm text-gray-500">
                      Reviewed by {review.reviewer.name || review.reviewer.email} on{" "}
                      {review.reviewedAt
                        ? new Date(review.reviewedAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Review detail modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    {contentItems[selectedReview.contentId]?.title || "Review Details"}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedReview(null);
                      setComments("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <IconX size={24} />
                  </button>
                </div>

                {isAdvisor && selectedReview.status === "pending_review" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (optional)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Add comments about this review..."
                    />
                  </div>
                )}

                {selectedReview.comments && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <strong>Previous Comments:</strong> {selectedReview.comments}
                  </div>
                )}

                {contentItems[selectedReview.contentId] && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Content Preview</h3>
                    <div className="p-4 bg-gray-50 rounded border border-gray-200">
                      {selectedReview.contentType === "briefing" && (
                        <div>
                          <h4 className="font-semibold mb-2">
                            {contentItems[selectedReview.contentId].content.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {contentItems[selectedReview.contentId].content.summary}
                          </p>
                          {contentItems[selectedReview.contentId].content.sections?.map(
                            (section: any, idx: number) => (
                              <div key={idx} className="mb-3">
                                <h5 className="font-medium">{section.heading}</h5>
                                <p className="text-sm text-gray-700">{section.content}</p>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {selectedReview.contentType === "explainer" && (
                        <div>
                          <h4 className="font-semibold mb-2">
                            {contentItems[selectedReview.contentId].content.title}
                          </h4>
                          <p className="text-sm text-gray-700">
                            {contentItems[selectedReview.contentId].content.content}
                          </p>
                        </div>
                      )}
                      {selectedReview.contentType === "lesson" && (
                        <div>
                          <h4 className="font-semibold mb-2">
                            {contentItems[selectedReview.contentId].content.title}
                          </h4>
                          <p className="text-sm text-gray-700">
                            {contentItems[selectedReview.contentId].content.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isAdvisor && selectedReview.status === "pending_review" && (
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => handleReviewAction(selectedReview.id, "approved")}
                      disabled={actionLoading === selectedReview.id}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewAction(selectedReview.id, "changes_requested")}
                      disabled={actionLoading === selectedReview.id}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleReviewAction(selectedReview.id, "rejected")}
                      disabled={actionLoading === selectedReview.id}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

