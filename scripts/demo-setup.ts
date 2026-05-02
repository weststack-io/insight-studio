/**
 * Demo Setup Script
 *
 * Sets up all demo data for a 15-20 min InsightStudio demo:
 * - Creates advisor user
 * - Updates client profile
 * - Creates compliance policies
 * - Creates pending reviews
 * - Creates house view
 * - Creates content source records
 * - Creates ingestion config
 */
import { prisma } from "../lib/db/client";

const TENANT_ID = "836e7af1-58bf-4f2c-9256-02c26e1a0250"; // Insight Studio tenant
const CLIENT_EMAIL = "adam@weststack.io";
const ADVISOR_EMAIL = "adaum@pathstone.com";

async function setup() {
  console.log("\n========================================");
  console.log("  INSIGHTSTUDIO DEMO SETUP");
  console.log("========================================\n");

  // 1. Create or update advisor user
  console.log("1. Setting up advisor user...");
  const advisor = await prisma.user.upsert({
    where: { email: ADVISOR_EMAIL },
    update: {
      role: "advisor",
      tenantId: TENANT_ID,
      name: "Adam Daum",
    },
    create: {
      email: ADVISOR_EMAIL,
      name: "Adam Daum",
      role: "advisor",
      tenantId: TENANT_ID,
      language: "en",
    },
  });
  console.log(`   ✅ Advisor: ${advisor.email} (role: ${advisor.role}, id: ${advisor.id})`);

  // 2. Update client profile
  console.log("\n2. Updating client profile...");
  const client = await prisma.user.update({
    where: { email: CLIENT_EMAIL },
    data: {
      sophisticationLevel: "intermediate",
      generation: "Millennial",
      language: "en",
      name: "Adam West",
    },
  });
  console.log(`   ✅ Client: ${client.email} (gen: ${client.generation}, soph: ${client.sophisticationLevel})`);

  // 3. Update client preferences
  console.log("\n3. Setting up client preferences...");

  // Delete existing preferences
  await prisma.userPreference.deleteMany({ where: { userId: client.id } });

  const preferences = [
    { topic: "ESG Investing", interestLevel: "high" },
    { topic: "Tax Optimization", interestLevel: "medium" },
    { topic: "Alternative Investments", interestLevel: "high" },
    { topic: "Estate Planning", interestLevel: "medium" },
  ];

  for (const pref of preferences) {
    await prisma.userPreference.create({
      data: {
        userId: client.id,
        topic: pref.topic,
        interestLevel: pref.interestLevel,
      },
    });
    console.log(`   ✅ Preference: "${pref.topic}" = ${pref.interestLevel}`);
  }

  // 4. Create compliance policies
  console.log("\n4. Creating compliance policies...");

  const policies = [
    {
      name: "Prohibited Terms",
      type: "prohibited_terms",
      config: JSON.stringify({
        prohibitedTerms: [
          "guaranteed return",
          "risk-free",
          "guaranteed profit",
          "no risk",
          "sure thing",
          "can't lose",
          "guaranteed income",
          "guaranteed yield",
          "100% safe",
          "zero risk",
          "no downside",
          "surefire",
          "foolproof",
          "promise returns",
        ],
      }),
    },
    {
      name: "Required Disclosures",
      type: "required_disclosures",
      config: JSON.stringify({
        requiredDisclosures: [
          "general",
          "Past performance is not indicative of future results.",
          "Investment involves risk including the possible loss of principal.",
          "This content is for informational purposes only and does not constitute investment advice.",
        ],
      }),
    },
    {
      name: "Content Restrictions",
      type: "content_restrictions",
      config: JSON.stringify({
        contentRestrictions: {
          maxLength: 5000,
          minLength: 100,
          blockedTopics: [
            "cryptocurrency mining",
            "penny stocks",
            "forex day trading",
          ],
        },
      }),
    },
    {
      name: "Risk Thresholds",
      type: "risk_thresholds",
      config: JSON.stringify({
        riskThresholds: {
          autoApprove: 30,
          requireReview: 50,
          blockContent: 80,
        },
      }),
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: {
        tenantId_name: {
          tenantId: TENANT_ID,
          name: policy.name,
        },
      },
      update: {
        type: policy.type,
        config: policy.config,
        enabled: true,
      },
      create: {
        tenantId: TENANT_ID,
        name: policy.name,
        type: policy.type,
        config: policy.config,
        enabled: true,
      },
    });
    console.log(`   ✅ Policy: "${policy.name}" (${policy.type})`);
  }

  // 5. Create house view
  console.log("\n5. Creating house view...");

  const existingHouseView = await prisma.houseView.findFirst({
    where: { tenantId: TENANT_ID, isActive: true },
  });

  if (!existingHouseView) {
    await prisma.houseView.create({
      data: {
        tenantId: TENANT_ID,
        title: "Q4 2025 Investment Outlook",
        content: JSON.stringify({
          title: "Q4 2025 Investment Outlook",
          summary: "We maintain a moderately constructive view on risk assets, with a preference for quality equities and investment-grade fixed income. We are cautious on duration and see opportunities in private credit and infrastructure.",
          sections: [
            {
              heading: "Equities",
              view: "Overweight",
              commentary: "We favor large-cap quality stocks with strong balance sheets and sustainable dividends. U.S. equities remain our preferred region, though we see selective opportunities in European and Japanese markets. We are underweight small-cap given tighter financial conditions.",
            },
            {
              heading: "Fixed Income",
              view: "Neutral",
              commentary: "With rates elevated, we see attractive yields in investment-grade corporate bonds and short-duration Treasuries. We remain cautious on high yield given spread compression and prefer to wait for better entry points.",
            },
            {
              heading: "Alternatives",
              view: "Overweight",
              commentary: "Private credit continues to offer compelling risk-adjusted returns. We are increasing allocations to infrastructure and real assets as inflation hedges. We maintain exposure to hedge fund strategies focused on macro and relative value.",
            },
            {
              heading: "ESG Integration",
              view: "Constructive",
              commentary: "We continue to integrate ESG factors across all asset classes. Climate transition investments represent a multi-decade opportunity. We are actively engaging with portfolio companies on governance improvements and carbon reduction targets.",
            },
          ],
          lastUpdated: "2025-12-15",
          author: "Insight Studio Investment Committee",
        }),
        version: 1,
        isActive: true,
      },
    });
    console.log("   ✅ House view created: Q4 2025 Investment Outlook");
  } else {
    console.log(`   ⏭️ House view already exists: "${existingHouseView.title}"`);
  }

  // 6. Create pending reviews from existing briefings
  console.log("\n6. Creating pending reviews...");

  const briefings = await prisma.briefing.findMany({
    orderBy: { generatedAt: "desc" },
    take: 3,
  });

  let reviewsCreated = 0;
  for (const briefing of briefings) {
    const existingReview = await prisma.contentReview.findFirst({
      where: { contentId: briefing.id, contentType: "briefing" },
    });

    if (!existingReview) {
      // Update briefing status to pending_review with a risk score
      const riskScore = 35 + Math.random() * 30; // 35-65 range
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: {
          status: "pending_review",
          requiresReview: true,
          riskScore: Math.round(riskScore * 10) / 10,
        },
      });

      await prisma.contentReview.create({
        data: {
          contentId: briefing.id,
          contentType: "briefing",
          status: "pending_review",
          version: 1,
        },
      });
      reviewsCreated++;
      console.log(`   ✅ Review created for briefing ${briefing.id.substring(0, 8)}... (risk: ${riskScore.toFixed(1)})`);
    }
  }
  if (reviewsCreated === 0) {
    console.log("   ⏭️ Reviews already exist");
  }

  // 7. Also approve some older briefings so the client can see published content
  console.log("\n7. Publishing some briefings for client view...");

  const olderBriefings = await prisma.briefing.findMany({
    where: { status: "draft" },
    orderBy: { generatedAt: "asc" },
    take: 3,
  });

  for (const briefing of olderBriefings) {
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: {
        status: "published",
        reviewerId: advisor.id,
        reviewedAt: new Date(),
        riskScore: 15 + Math.random() * 15, // Low risk 15-30
      },
    });
    console.log(`   ✅ Published briefing ${briefing.id.substring(0, 8)}... (week: ${briefing.weekStartDate.toISOString().split("T")[0]})`);
  }

  // 8. Create content source records for demo visibility
  console.log("\n8. Creating content source records...");

  const sources = [
    { type: "news", title: "BBC Business News", url: "https://feeds.bbci.co.uk/news/business/rss.xml", reliabilityScore: 0.85, tags: ["finance", "markets", "global"] },
    { type: "news", title: "Reuters Markets", url: "https://www.reuters.com/markets/", reliabilityScore: 0.90, tags: ["finance", "markets"] },
    { type: "news", title: "Financial Times", url: "https://www.ft.com/", reliabilityScore: 0.92, tags: ["finance", "analysis"] },
    { type: "research", title: "Quarterly Manager Letter - Q4 2025", url: null, reliabilityScore: 0.95, tags: ["proprietary", "manager-letter"] },
    { type: "research", title: "Annual Investment Review 2025", url: null, reliabilityScore: 0.95, tags: ["proprietary", "annual-review"] },
    { type: "market_data", title: "Alpha Vantage - US Indices", url: "https://www.alphavantage.co", reliabilityScore: 0.88, tags: ["market-data", "indices"] },
    { type: "market_data", title: "Alpha Vantage - Currencies", url: "https://www.alphavantage.co", reliabilityScore: 0.88, tags: ["market-data", "forex"] },
  ];

  for (const source of sources) {
    const existing = await prisma.contentSource.findFirst({
      where: { title: source.title, tenantId: TENANT_ID },
    });
    if (!existing) {
      await prisma.contentSource.create({
        data: {
          type: source.type,
          title: source.title,
          url: source.url,
          reliabilityScore: source.reliabilityScore,
          tags: JSON.stringify(source.tags),
          tenantId: TENANT_ID,
          date: new Date(),
        },
      });
      console.log(`   ✅ Source: "${source.title}" (${source.type}, score: ${source.reliabilityScore})`);
    } else {
      console.log(`   ⏭️ Source already exists: "${source.title}"`);
    }
  }

  // 9. Create ingestion config
  console.log("\n9. Creating ingestion configs...");

  const ingestionConfigs = [
    {
      sourceType: "rss",
      config: JSON.stringify({
        url: "https://feeds.bbci.co.uk/news/business/rss.xml",
        title: "BBC Business",
        tags: ["finance"],
        reliabilityScore: 0.85,
        tenantId: TENANT_ID,
      }),
      status: "active",
    },
    {
      sourceType: "market_data",
      config: JSON.stringify({
        provider: "alpha_vantage",
        symbols: ["SPY", "QQQ", "DIA", "IWM"],
        currencies: ["EUR/USD", "GBP/USD", "USD/JPY"],
        tenantId: TENANT_ID,
      }),
      status: "active",
    },
  ];

  for (const ingestion of ingestionConfigs) {
    const existing = await prisma.contentIngestion.findFirst({
      where: { sourceType: ingestion.sourceType, status: "active" },
    });
    if (!existing) {
      await prisma.contentIngestion.create({
        data: {
          sourceType: ingestion.sourceType,
          config: ingestion.config,
          status: ingestion.status,
        },
      });
      console.log(`   ✅ Ingestion: ${ingestion.sourceType} (${ingestion.status})`);
    } else {
      console.log(`   ⏭️ Ingestion config already exists for: ${ingestion.sourceType}`);
    }
  }

  // Final summary
  console.log("\n========================================");
  console.log("  SETUP COMPLETE!");
  console.log("========================================");
  console.log(`\n  Advisor: ${ADVISOR_EMAIL} (role: advisor)`);
  console.log(`  Client:  ${CLIENT_EMAIL} (role: family_member, gen: Millennial, soph: intermediate)`);
  console.log(`  Tenant:  Insight Studio (${TENANT_ID})`);
  console.log("\n  Next steps:");
  console.log("  1. Sign in as advisor (adaum@pathstone.com) to create Azure AD link");
  console.log("  2. Generate fresh briefings: curl -X POST 'https://func-insightstudio-bfnfaxmvsmmgc.azurewebsites.net/api/trigger/briefings?code=<key>&force=true'");
  console.log("  3. Start Next.js dev server: npm run dev");
  console.log("  4. Test explainer generation live during demo");
  console.log("========================================\n");

  await prisma.$disconnect();
}

setup().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
