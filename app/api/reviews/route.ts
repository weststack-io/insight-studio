import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

type ContentType = "briefing" | "explainer" | "lesson";
type ReviewStatus = "pending_review" | "approved" | "rejected" | "changes_requested";

// GET - List reviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as ReviewStatus | null;
    const contentType = searchParams.get("contentType") as ContentType | null;
    const contentId = searchParams.get("contentId");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (contentType) {
      where.contentType = contentType;
    }

    if (contentId) {
      where.contentId = contentId;
    }

    // If user is not an advisor, only show their own content reviews
    if (user.role !== "advisor") {
      // Get content IDs for this user
      const userContentIds: string[] = [];
      
      if (!contentType || contentType === "briefing") {
        const briefings = await prisma.briefing.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        userContentIds.push(...briefings.map((b) => b.id));
      }

      if (!contentType || contentType === "explainer") {
        // Explainers are tenant-level, so check tenant
        const explainers = await prisma.explainer.findMany({
          where: { tenantId: user.tenantId },
          select: { id: true },
        });
        userContentIds.push(...explainers.map((e) => e.id));
      }

      if (!contentType || contentType === "lesson") {
        const lessons = await prisma.lesson.findMany({
          where: { tenantId: user.tenantId },
          select: { id: true },
        });
        userContentIds.push(...lessons.map((l) => l.id));
      }

      where.contentId = { in: userContentIds };
    }

    const reviews = await prisma.contentReview.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Fetch content for each review
    const reviewsWithContent = await Promise.all(
      reviews.map(async (review) => {
        let content = null;
        try {
          if (review.contentType === "briefing") {
            const briefing = await prisma.briefing.findUnique({
              where: { id: review.contentId },
            });
            if (briefing) {
              content = {
                id: briefing.id,
                title: JSON.parse(briefing.content)?.title || "Briefing",
                content: JSON.parse(briefing.content),
                status: briefing.status,
              };
            }
          } else if (review.contentType === "explainer") {
            const explainer = await prisma.explainer.findUnique({
              where: { id: review.contentId },
            });
            if (explainer) {
              content = {
                id: explainer.id,
                title: JSON.parse(explainer.content)?.title || explainer.topic,
                content: JSON.parse(explainer.content),
                status: "draft",
              };
            }
          } else if (review.contentType === "lesson") {
            const lesson = await prisma.lesson.findUnique({
              where: { id: review.contentId },
            });
            if (lesson) {
              content = {
                id: lesson.id,
                title: JSON.parse(lesson.content)?.title || lesson.topic,
                content: JSON.parse(lesson.content),
                status: "draft",
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch content for ${review.contentType} ${review.contentId}:`, error);
        }

        return {
          ...review,
          content,
        };
      })
    );

    return NextResponse.json({ reviews: reviewsWithContent });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST - Create or update review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();
    const {
      contentId,
      contentType,
      status,
      comments,
      version,
    }: {
      contentId: string;
      contentType: ContentType;
      status?: ReviewStatus;
      comments?: string;
      version?: number;
    } = body;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: "contentId and contentType are required" },
        { status: 400 }
      );
    }

    // Verify content exists
    let contentExists = false;
    if (contentType === "briefing") {
      const briefing = await prisma.briefing.findUnique({
        where: { id: contentId },
      });
      contentExists = !!briefing;
    } else if (contentType === "explainer") {
      const explainer = await prisma.explainer.findUnique({
        where: { id: contentId },
      });
      contentExists = !!explainer;
    } else if (contentType === "lesson") {
      const lesson = await prisma.lesson.findUnique({
        where: { id: contentId },
      });
      contentExists = !!lesson;
    }

    if (!contentExists) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Find existing review or create new one
    const existingReview = await prisma.contentReview.findFirst({
      where: {
        contentId,
        contentType,
        version: version || 1,
      },
    });

    const reviewData: any = {
      contentId,
      contentType,
      status: status || "pending_review",
      comments: comments || null,
      version: version || 1,
    };

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.contentReview.update({
        where: { id: existingReview.id },
        data: reviewData,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Create new review
      review = await prisma.contentReview.create({
        data: reviewData,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    // Update content status if review is approved/rejected
    if (status === "approved" || status === "rejected" || status === "changes_requested") {
      await updateContentStatus(contentId, contentType, status, user.id);
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Failed to create/update review:", error);
    return NextResponse.json(
      { error: "Failed to create/update review" },
      { status: 500 }
    );
  }
}

// PATCH - Update review status (for approve/reject/request-changes)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    
    // Only advisors can approve/reject
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can approve or reject reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      reviewId,
      status,
      comments,
    }: {
      reviewId: string;
      status: ReviewStatus;
      comments?: string;
    } = body;

    if (!reviewId || !status) {
      return NextResponse.json(
        { error: "reviewId and status are required" },
        { status: 400 }
      );
    }

    const review = await prisma.contentReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await prisma.contentReview.update({
      where: { id: reviewId },
      data: {
        status,
        comments: comments || review.comments,
        reviewerId: user.id,
        reviewedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update content status
    await updateContentStatus(
      review.contentId,
      review.contentType as ContentType,
      status,
      user.id
    );

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE - Delete review
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    await prisma.contentReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}

/**
 * Update content status based on review status
 */
async function updateContentStatus(
  contentId: string,
  contentType: ContentType,
  reviewStatus: ReviewStatus,
  reviewerId: string
): Promise<void> {
  let contentStatus: string;
  if (reviewStatus === "approved") {
    contentStatus = "approved";
  } else if (reviewStatus === "rejected") {
    contentStatus = "draft";
  } else if (reviewStatus === "changes_requested") {
    contentStatus = "draft";
  } else {
    contentStatus = "pending_review";
  }

  if (contentType === "briefing") {
    await prisma.briefing.update({
      where: { id: contentId },
      data: {
        status: contentStatus,
        reviewerId,
        reviewedAt: new Date(),
      },
    });
  } else if (contentType === "explainer") {
    // Explainers don't have status field in the same way, but we can track via reviews
    // For now, we'll just update the review
  } else if (contentType === "lesson") {
    // Lessons don't have status field in the same way, but we can track via reviews
    // For now, we'll just update the review
  }
}

