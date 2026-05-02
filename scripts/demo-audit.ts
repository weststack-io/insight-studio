import { prisma } from "../lib/db/client";

async function auditDemoData() {
  console.log("\n========================================");
  console.log("  INSIGHTSTUDIO DEMO DATA AUDIT");
  console.log("========================================\n");

  // 1. Tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, applicationName: true, domain: true },
  });
  console.log("--- TENANTS ---");
  tenants.forEach((t) =>
    console.log(`  ${t.name} (${t.applicationName || "no app name"}) | domain: ${t.domain || "none"} | id: ${t.id}`)
  );
  console.log(`  Total: ${tenants.length}\n`);

  // 2. Users
  const users = await prisma.user.findMany({
    include: { tenant: { select: { name: true } }, userPreferences: true },
  });
  console.log("--- USERS ---");
  users.forEach((u) =>
    console.log(
      `  ${u.email} | role: ${u.role || "none"} | tenant: ${u.tenant?.name || "none"} | gen: ${u.generation || "none"} | soph: ${u.sophisticationLevel || "none"} | lang: ${u.language || "none"} | prefs: ${u.userPreferences.length}`
    )
  );
  console.log(`  Total: ${users.length}\n`);

  // 3. Briefings
  const briefings = await prisma.briefing.findMany({
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      weekStartDate: true,
      generatedAt: true,
      riskScore: true,
      requiresReview: true,
      version: true,
    },
  });
  console.log("--- BRIEFINGS ---");
  const statusCounts: Record<string, number> = {};
  briefings.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    console.log(
      `  ${b.weekStartDate.toISOString().split("T")[0]} | type: ${b.type} | status: ${b.status} | risk: ${b.riskScore?.toFixed(1) ?? "n/a"} | review: ${b.requiresReview} | v${b.version}`
    );
  });
  console.log(`  Total: ${briefings.length} | By status: ${JSON.stringify(statusCounts)}\n`);

  // 4. Content Reviews
  const reviews = await prisma.contentReview.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      contentType: true,
      status: true,
      comments: true,
      createdAt: true,
    },
  });
  console.log("--- CONTENT REVIEWS ---");
  const reviewStatusCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    reviewStatusCounts[r.status] = (reviewStatusCounts[r.status] || 0) + 1;
    console.log(
      `  ${r.createdAt.toISOString().split("T")[0]} | type: ${r.contentType} | status: ${r.status} | comments: ${r.comments ? "yes" : "no"}`
    );
  });
  console.log(`  Total: ${reviews.length} | By status: ${JSON.stringify(reviewStatusCounts)}\n`);

  // 5. Policies
  const policies = await prisma.policy.findMany({
    select: { id: true, name: true, type: true, enabled: true, tenantId: true, config: true },
  });
  console.log("--- COMPLIANCE POLICIES ---");
  policies.forEach((p) => {
    const configPreview = p.config.substring(0, 80) + (p.config.length > 80 ? "..." : "");
    console.log(`  ${p.name} | type: ${p.type} | enabled: ${p.enabled} | config: ${configPreview}`);
  });
  console.log(`  Total: ${policies.length}\n`);

  // 6. Content Sources
  const sourceCount = await prisma.contentSource.count();
  const sourcesByType = await prisma.contentSource.groupBy({
    by: ["type"],
    _count: true,
  });
  console.log("--- CONTENT SOURCES ---");
  sourcesByType.forEach((s) => console.log(`  type: ${s.type} | count: ${s._count}`));
  console.log(`  Total: ${sourceCount}\n`);

  // 7. Lessons
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      topic: true,
      generation: true,
      sophisticationLevel: true,
      language: true,
      riskScore: true,
    },
  });
  console.log("--- LESSONS ---");
  lessons.forEach((l) =>
    console.log(
      `  "${l.topic}" | gen: ${l.generation || "none"} | soph: ${l.sophisticationLevel || "none"} | lang: ${l.language} | risk: ${l.riskScore?.toFixed(1) ?? "n/a"}`
    )
  );
  console.log(`  Total: ${lessons.length}\n`);

  // 8. Explainers
  const explainers = await prisma.explainer.findMany({
    select: { id: true, topic: true, language: true, riskScore: true },
  });
  console.log("--- EXPLAINERS ---");
  explainers.forEach((e) =>
    console.log(`  "${e.topic}" | lang: ${e.language} | risk: ${e.riskScore?.toFixed(1) ?? "n/a"}`)
  );
  console.log(`  Total: ${explainers.length}\n`);

  // 9. Market Data
  const marketDataCount = await prisma.marketData.count();
  const latestMarket = await prisma.marketData.findFirst({
    orderBy: { date: "desc" },
    select: { date: true, type: true, source: true },
  });
  console.log("--- MARKET DATA ---");
  console.log(`  Total records: ${marketDataCount}`);
  if (latestMarket) {
    console.log(`  Latest: ${latestMarket.date.toISOString().split("T")[0]} | type: ${latestMarket.type} | source: ${latestMarket.source}`);
  }
  console.log("");

  // 10. House Views
  const houseViews = await prisma.houseView.findMany({
    select: { id: true, title: true, isActive: true, tenantId: true, version: true },
  });
  console.log("--- HOUSE VIEWS ---");
  houseViews.forEach((h) =>
    console.log(`  "${h.title}" | active: ${h.isActive} | v${h.version} | tenant: ${h.tenantId}`)
  );
  console.log(`  Total: ${houseViews.length}\n`);

  // 11. User Preferences
  const prefs = await prisma.userPreference.findMany({
    include: { user: { select: { email: true } } },
  });
  console.log("--- USER PREFERENCES ---");
  prefs.forEach((p) =>
    console.log(`  ${p.user.email} | topic: "${p.topic}" | level: ${p.interestLevel}`)
  );
  console.log(`  Total: ${prefs.length}\n`);

  // 12. Content Ingestion Configs
  const ingestions = await prisma.contentIngestion.findMany({
    select: { id: true, sourceType: true, status: true, lastRun: true },
  });
  console.log("--- INGESTION CONFIGS ---");
  ingestions.forEach((i) =>
    console.log(`  type: ${i.sourceType} | status: ${i.status} | lastRun: ${i.lastRun?.toISOString() ?? "never"} | id: ${i.id}`)
  );
  console.log(`  Total: ${ingestions.length}\n`);

  // Summary
  console.log("========================================");
  console.log("  SETUP NEEDED:");
  console.log("========================================");
  if (briefings.length === 0) console.log("  ❌ No briefings — need to generate");
  else console.log(`  ✅ ${briefings.length} briefings exist`);

  const pendingReviews = reviews.filter((r) => r.status === "pending_review");
  if (pendingReviews.length === 0) console.log("  ❌ No pending reviews — need at least 1");
  else console.log(`  ✅ ${pendingReviews.length} pending review(s)`);

  if (policies.length === 0) console.log("  ❌ No policies — need to configure");
  else console.log(`  ✅ ${policies.length} policies configured`);

  if (sourceCount === 0) console.log("  ❌ No content sources — need to ingest");
  else console.log(`  ✅ ${sourceCount} content sources`);

  if (lessons.length === 0) console.log("  ❌ No lessons — need to generate");
  else console.log(`  ✅ ${lessons.length} lessons exist`);

  const clientUsers = users.filter((u) => u.role === "family_member");
  const configuredClients = clientUsers.filter((u) => u.generation && u.sophisticationLevel);
  if (configuredClients.length === 0) console.log("  ❌ No client profiles configured (gen + soph level)");
  else console.log(`  ✅ ${configuredClients.length} configured client profile(s)`);

  const usersWithPrefs = users.filter((u) => u.userPreferences.length > 0);
  if (usersWithPrefs.length === 0) console.log("  ❌ No user preferences set");
  else console.log(`  ✅ ${usersWithPrefs.length} user(s) with preferences`);

  console.log("\n========================================\n");

  await prisma.$disconnect();
}

auditDemoData().catch((e) => {
  console.error("Audit failed:", e);
  process.exit(1);
});
