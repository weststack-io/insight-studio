/**
 * Quick test script for review workflow
 *
 * Run with: npx tsx scripts/test-review-workflow.ts
 *
 * This script helps verify that:
 * 1. Content generation creates reviews when risk score is high
 * 2. Reviews appear in the reviews API
 * 3. Risk scores are being calculated correctly
 */

import { prisma } from "../lib/db/client";

async function testReviewWorkflow() {
  console.log("🧪 Testing Review Workflow...\n");

  try {
    // 1. Check recent content with risk scores
    console.log("1️⃣ Checking recent briefings with risk scores...");
    const recentBriefings = await prisma.briefing.findMany({
      take: 5,
      orderBy: { generatedAt: "desc" },
      select: {
        id: true,
        type: true,
        riskScore: true,
        requiresReview: true,
        status: true,
        generatedAt: true,
      },
    });

    console.log(`   Found ${recentBriefings.length} recent briefings:`);
    recentBriefings.forEach((b) => {
      console.log(
        `   - ${b.type} briefing: riskScore=${
          b.riskScore ?? "null"
        }, requiresReview=${b.requiresReview}, status=${b.status}`
      );
    });

    // 2. Check pending reviews
    console.log("\n2️⃣ Checking pending reviews...");
    const pendingReviews = await prisma.contentReview.findMany({
      where: { status: "pending_review" },
      include: {
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`   Found ${pendingReviews.length} pending reviews:`);
    pendingReviews.forEach((r) => {
      console.log(
        `   - ${r.contentType} (${r.contentId.substring(0, 8)}...): version=${
          r.version
        }, created=${r.createdAt.toISOString()}`
      );
    });

    // 3. Check citations
    console.log("\n3️⃣ Checking recent citations...");
    const recentCitations = await prisma.citation.findMany({
      take: 5,
      orderBy: { id: "desc" },
      include: {
        source: {
          select: {
            title: true,
            type: true,
          },
        },
      },
    });

    console.log(`   Found ${recentCitations.length} recent citations:`);
    recentCitations.forEach((c) => {
      console.log(
        `   - ${c.contentType}: confidence=${c.confidenceScore.toFixed(
          2
        )}, source=${c.source?.title ?? "none"}`
      );
    });

    // 4. Check content requiring review
    console.log("\n4️⃣ Checking content that requires review...");
    const contentRequiringReview = await prisma.briefing.findMany({
      where: { requiresReview: true },
      take: 5,
      orderBy: { generatedAt: "desc" },
      select: {
        id: true,
        type: true,
        riskScore: true,
        status: true,
      },
    });

    console.log(
      `   Found ${contentRequiringReview.length} briefings requiring review:`
    );
    contentRequiringReview.forEach((b) => {
      console.log(
        `   - ${b.type}: riskScore=${b.riskScore}, status=${b.status}`
      );
    });

    // 5. Verify reviews exist for content requiring review
    console.log("\n5️⃣ Verifying reviews exist for content requiring review...");
    const contentIds = contentRequiringReview.map((b) => b.id);
    const reviewsForContent = await prisma.contentReview.findMany({
      where: {
        contentId: { in: contentIds },
        contentType: "briefing",
      },
    });

    console.log(
      `   Found ${reviewsForContent.length} reviews for ${contentIds.length} content items requiring review`
    );

    const missingReviews = contentIds.filter(
      (id) => !reviewsForContent.some((r) => r.contentId === id)
    );

    if (missingReviews.length > 0) {
      console.log(
        `   ⚠️  WARNING: ${missingReviews.length} content items require review but have no review record!`
      );
      console.log(`   Missing reviews for: ${missingReviews.join(", ")}`);
    } else {
      console.log("   ✅ All content requiring review has review records");
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   - Recent briefings: ${recentBriefings.length}`);
    console.log(`   - Pending reviews: ${pendingReviews.length}`);
    console.log(`   - Recent citations: ${recentCitations.length}`);
    console.log(
      `   - Content requiring review: ${contentRequiringReview.length}`
    );
    console.log(`   - Reviews created: ${reviewsForContent.length}`);

    if (pendingReviews.length === 0) {
      console.log(
        "\n💡 Tip: Generate content with high-risk terms (cryptocurrency, derivatives, leverage) to trigger reviews"
      );
    }

    console.log("\n✅ Test complete!");
  } catch (error) {
    console.error("❌ Error running test:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testReviewWorkflow().catch(console.error);
