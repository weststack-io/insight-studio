import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { PrismaClient } from "@prisma/client";
import { generateBriefing } from "../../lib/ai/generators";
import { ingestMarketData } from "../../lib/ingestion/market-data";
import { ingestRSSFeed } from "../../lib/ingestion/content-sources";
import {
  indexMarketData,
  indexContentSources,
} from "../../lib/ingestion/indexing";
import { createMssqlAdapter } from "../../lib/db/adapter";

/**
 * Manual HTTP triggers for demo purposes
 * These endpoints allow triggering the scheduled functions on-demand
 */

// Lazy-initialize Prisma client to avoid connection issues
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: createMssqlAdapter(),
    });
  }
  return prisma;
}

/**
 * HTTP trigger to manually run weekly briefings generation
 * POST /api/trigger/briefings
 * Optional query params:
 *   - userId: Generate briefing for specific user only
 *   - tenantId: Generate briefings for specific tenant only
 */
async function triggerBriefings(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Manual trigger: Starting weekly briefings generation");

  const startTime = Date.now();
  const results: {
    success: boolean;
    message: string;
    details: {
      usersProcessed: number;
      briefingsGenerated: number;
      errors: string[];
      durationMs: number;
    };
  } = {
    success: false,
    message: "",
    details: {
      usersProcessed: 0,
      briefingsGenerated: 0,
      errors: [],
      durationMs: 0,
    },
  };

  try {
    const db = getPrismaClient();

    // Parse optional filters from query params
    const userId = request.query.get("userId");
    const tenantId = request.query.get("tenantId");

    // Build query filter
    const whereClause: any = {};
    if (userId) {
      whereClause.id = userId;
    }
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Get users to process
    const users = await db.user.findMany({
      where: whereClause,
      include: {
        userPreferences: true,
        tenant: true,
      },
    });

    context.log(`Found ${users.length} users to process`);

    // Calculate week start date (Monday of current week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStartDate = new Date(now.setDate(diff));
    weekStartDate.setHours(0, 0, 0, 0);

    // Check existing briefings
    const existingBriefings = await db.briefing.findMany({
      where: { weekStartDate },
      select: { userId: true, type: true },
    });

    const existingKeys = new Set(
      existingBriefings.map((b) => `${b.userId}-${b.type}`)
    );

    let briefingsGenerated = 0;

    // Process users
    for (const user of users) {
      try {
        if (user.tenantId) {
          const marketKey = `${user.id}-market`;
          if (!existingKeys.has(marketKey)) {
            const marketBriefing = await generateBriefing({
              type: "market",
              language: user.language as any,
              generation: user.generation as any,
              sophisticationLevel: user.sophisticationLevel as any,
              userPreferences: user.userPreferences.map((p) => p.topic),
            });

            await db.briefing.create({
              data: {
                userId: user.id,
                tenantId: user.tenantId,
                type: "market",
                content: JSON.stringify(marketBriefing),
                weekStartDate,
              },
            });

            briefingsGenerated++;
            context.log(`Generated market briefing for user ${user.id}`);
          } else {
            context.log(
              `Skipped user ${user.id} - briefing already exists for this week`
            );
          }
        }
        results.details.usersProcessed++;
      } catch (error) {
        const errorMsg = `Failed to process user ${user.id}: ${error instanceof Error ? error.message : String(error)}`;
        context.log(`Error: ${errorMsg}`);
        results.details.errors.push(errorMsg);
      }
    }

    results.details.briefingsGenerated = briefingsGenerated;
    results.details.durationMs = Date.now() - startTime;
    results.success = true;
    results.message = `Briefings generation completed. Generated ${briefingsGenerated} briefings for ${results.details.usersProcessed} users.`;

    context.log(results.message);

    return {
      status: 200,
      jsonBody: results,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    context.log(`Error in manual briefings trigger: ${errorMsg}`);

    results.details.durationMs = Date.now() - startTime;
    results.message = `Briefings generation failed: ${errorMsg}`;
    results.details.errors.push(errorMsg);

    return {
      status: 500,
      jsonBody: results,
    };
  }
}

/**
 * HTTP trigger to manually run data ingestion
 * POST /api/trigger/ingestion
 * Optional query params:
 *   - sourceType: Filter by source type (market_data, rss)
 *   - configId: Run specific ingestion config only
 */
async function triggerDataIngestion(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Manual trigger: Starting data ingestion");

  const startTime = Date.now();
  const results: {
    success: boolean;
    message: string;
    details: {
      configurationsProcessed: number;
      dataPointsIngested: number;
      itemsIndexed: number;
      errors: string[];
      durationMs: number;
    };
  } = {
    success: false,
    message: "",
    details: {
      configurationsProcessed: 0,
      dataPointsIngested: 0,
      itemsIndexed: 0,
      errors: [],
      durationMs: 0,
    },
  };

  try {
    const db = getPrismaClient();

    // Parse optional filters from query params
    const sourceType = request.query.get("sourceType");
    const configId = request.query.get("configId");

    // Build query filter - for manual triggers, we run regardless of nextRun time
    const whereClause: any = {
      status: "active",
    };
    if (sourceType) {
      whereClause.sourceType = sourceType;
    }
    if (configId) {
      whereClause.id = configId;
    }

    // Get ingestion configurations
    const ingestionConfigs = await db.contentIngestion.findMany({
      where: whereClause,
    });

    context.log(
      `Found ${ingestionConfigs.length} active ingestion configurations`
    );

    for (const config of ingestionConfigs) {
      try {
        context.log(
          `Processing ingestion: ${config.sourceType} (ID: ${config.id})`
        );

        const configData = JSON.parse(config.config);

        switch (config.sourceType) {
          case "market_data":
            const marketResult = await ingestMarketData(configData.tenantId);
            results.details.dataPointsIngested += marketResult.dataPoints;

            if (marketResult.dataPoints > 0) {
              const indexResult = await indexMarketData(
                configData.tenantId,
                marketResult.dataPoints
              );
              results.details.itemsIndexed += indexResult.indexed;

              if (indexResult.errors?.length) {
                results.details.errors.push(...indexResult.errors);
              }
            }

            if (marketResult.errors?.length) {
              results.details.errors.push(...marketResult.errors);
            }
            break;

          case "rss":
            const rssResult = await ingestRSSFeed(
              {
                url: configData.url,
                title: configData.title,
                tags: configData.tags,
                reliabilityScore: configData.reliabilityScore,
              },
              configData.tenantId
            );
            results.details.dataPointsIngested += rssResult.itemsCreated;

            if (rssResult.itemsCreated > 0) {
              const indexResult = await indexContentSources(
                configData.tenantId,
                rssResult.itemsCreated
              );
              results.details.itemsIndexed += indexResult.indexed;

              if (indexResult.errors?.length) {
                results.details.errors.push(...indexResult.errors);
              }
            }

            if (rssResult.errors?.length) {
              results.details.errors.push(...rssResult.errors);
            }
            break;

          default:
            context.log(`Unknown source type: ${config.sourceType}`);
            results.details.errors.push(
              `Unknown source type: ${config.sourceType}`
            );
            continue;
        }

        // Update last run time
        await db.contentIngestion.update({
          where: { id: config.id },
          data: {
            lastRun: new Date(),
            status: "active",
          },
        });

        results.details.configurationsProcessed++;
        context.log(
          `Completed ingestion: ${config.sourceType} (ID: ${config.id})`
        );
      } catch (error) {
        const errorMsg = `Failed to process ingestion ${config.id}: ${error instanceof Error ? error.message : String(error)}`;
        context.log(`Error: ${errorMsg}`);
        results.details.errors.push(errorMsg);

        // Mark as error
        await db.contentIngestion.update({
          where: { id: config.id },
          data: { status: "error" },
        });
      }
    }

    results.details.durationMs = Date.now() - startTime;
    results.success = true;
    results.message = `Data ingestion completed. Processed ${results.details.configurationsProcessed} configurations, ingested ${results.details.dataPointsIngested} items, indexed ${results.details.itemsIndexed} items.`;

    context.log(results.message);

    return {
      status: 200,
      jsonBody: results,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    context.log(`Error in manual ingestion trigger: ${errorMsg}`);

    results.details.durationMs = Date.now() - startTime;
    results.message = `Data ingestion failed: ${errorMsg}`;
    results.details.errors.push(errorMsg);

    return {
      status: 500,
      jsonBody: results,
    };
  }
}

/**
 * Health check endpoint
 * GET /api/health
 */
async function healthCheck(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Health check requested");

  try {
    const db = getPrismaClient();

    // Test database connection
    const tenantCount = await db.tenant.count();

    return {
      status: 200,
      jsonBody: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        tenants: tenantCount,
      },
    };
  } catch (error) {
    return {
      status: 503,
      jsonBody: {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// Register HTTP triggers with function-level auth (requires function key)
app.http("triggerBriefings", {
  methods: ["POST"],
  authLevel: "function",
  route: "trigger/briefings",
  handler: triggerBriefings,
});

app.http("triggerDataIngestion", {
  methods: ["POST"],
  authLevel: "function",
  route: "trigger/ingestion",
  handler: triggerDataIngestion,
});

app.http("healthCheck", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: healthCheck,
});

export { triggerBriefings, triggerDataIngestion, healthCheck };
