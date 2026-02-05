import { app, InvocationContext, Timer } from "@azure/functions";
import { PrismaClient } from "@prisma/client";
import { ingestMarketData } from "../../lib/ingestion/market-data";
import { ingestRSSFeed } from "../../lib/ingestion/content-sources";
import {
  indexMarketData,
  indexContentSources,
} from "../../lib/ingestion/indexing";
import { createMssqlAdapter } from "../../lib/db/adapter";

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

/**
 * Azure Function to run scheduled data ingestion
 * Runs on a timer trigger (configurable schedule)
 */
async function dataIngestionScheduler(
  myTimer: Timer,
  context: InvocationContext,
): Promise<void> {
  context.log("Starting data ingestion scheduler");

  try {
    // Get all active ingestion configurations
    const ingestionConfigs = await prisma.contentIngestion.findMany({
      where: {
        status: "active",
        OR: [{ nextRun: null }, { nextRun: { lte: new Date() } }],
      },
    });

    context.log(
      `Found ${ingestionConfigs.length} active ingestion configurations`,
    );

    for (const config of ingestionConfigs) {
      try {
        context.log(
          `Processing ingestion: ${config.sourceType} (ID: ${config.id})`,
        );

        const configData = JSON.parse(config.config);

        switch (config.sourceType) {
          case "market_data":
            await processMarketDataIngestion(config, configData, context);
            break;

          case "rss":
            await processRSSIngestion(config, configData, context);
            break;

          default:
            context.log(`Unknown source type: ${config.sourceType}`);
            continue;
        }

        // Update last run and calculate next run
        const nextRun = calculateNextRun(config.sourceType, configData);
        await prisma.contentIngestion.update({
          where: { id: config.id },
          data: {
            lastRun: new Date(),
            nextRun,
            status: "active",
          },
        });

        context.log(
          `Completed ingestion: ${config.sourceType} (ID: ${config.id})`,
        );
      } catch (error) {
        context.log(
          `Error processing ingestion ${config.id}:`,
          error instanceof Error ? error.message : String(error),
        );

        // Update status to error (but don't stop other ingestions)
        await prisma.contentIngestion.update({
          where: { id: config.id },
          data: {
            status: "error",
          },
        });
      }
    }

    context.log("Data ingestion scheduler completed");
  } catch (error) {
    context.log("Error in data ingestion scheduler:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Process market data ingestion
 */
async function processMarketDataIngestion(
  config: any,
  configData: any,
  context: InvocationContext,
): Promise<void> {
  context.log("Processing market data ingestion");

  try {
    // Ingest market data
    const result = await ingestMarketData(configData.tenantId);

    context.log(
      `Market data ingestion completed: ${result.dataPoints} data points ingested`,
    );

    if (result.errors && result.errors.length > 0) {
      context.log(`Errors: ${result.errors.join(", ")}`);
    }

    // Index the ingested data
    if (result.dataPoints > 0) {
      context.log("Indexing market data to search index");
      const indexingResult = await indexMarketData(
        configData.tenantId,
        result.dataPoints,
      );

      context.log(
        `Indexing completed: ${indexingResult.indexed} items indexed`,
      );

      if (indexingResult.errors && indexingResult.errors.length > 0) {
        context.log(`Indexing errors: ${indexingResult.errors.join(", ")}`);
      }
    }
  } catch (error) {
    context.log(
      `Error in market data ingestion: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
}

/**
 * Process RSS feed ingestion
 */
async function processRSSIngestion(
  config: any,
  configData: any,
  context: InvocationContext,
): Promise<void> {
  context.log(`Processing RSS ingestion: ${configData.url}`);

  try {
    const result = await ingestRSSFeed(
      {
        url: configData.url,
        title: configData.title,
        tags: configData.tags,
        reliabilityScore: configData.reliabilityScore,
      },
      configData.tenantId,
    );

    context.log(
      `RSS ingestion completed: ${result.itemsCreated} items created`,
    );

    if (result.errors && result.errors.length > 0) {
      context.log(`Errors: ${result.errors.join(", ")}`);
    }

    // Index the ingested content
    if (result.itemsCreated > 0) {
      context.log("Indexing RSS content to search index");
      const indexingResult = await indexContentSources(
        configData.tenantId,
        result.itemsCreated,
      );

      context.log(
        `Indexing completed: ${indexingResult.indexed} items indexed`,
      );

      if (indexingResult.errors && indexingResult.errors.length > 0) {
        context.log(`Indexing errors: ${indexingResult.errors.join(", ")}`);
      }
    }
  } catch (error) {
    context.log(
      `Error in RSS ingestion: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
}

/**
 * Calculate next run time based on source type and configuration
 */
function calculateNextRun(sourceType: string, configData: any): Date | null {
  const now = new Date();
  const schedule = configData.schedule || "daily";

  switch (schedule) {
    case "hourly":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "custom":
      // For custom schedules, expect a cron expression or interval in configData
      if (configData.intervalMinutes) {
        return new Date(now.getTime() + configData.intervalMinutes * 60 * 1000);
      }
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }
}

// V4 programming model registration
app.timer("dataIngestionScheduler", {
  schedule: "0 0 */6 * * *", // Every 6 hours (NCRONTAB: sec min hour day month dow)
  handler: dataIngestionScheduler,
});

// Export for traditional function.json model (fallback)
export { dataIngestionScheduler };
