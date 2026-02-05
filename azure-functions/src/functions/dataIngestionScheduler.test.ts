import { InvocationContext, Timer } from "@azure/functions";

// Create shared mock instances
const mockContentIngestion = {
  findMany: jest.fn(),
  update: jest.fn(),
};

const mockPrismaInstance = {
  contentIngestion: mockContentIngestion,
  $disconnect: jest.fn(),
};

// Mock external dependencies before importing the module
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance),
}));

jest.mock("../../lib/db/adapter", () => ({
  createMssqlAdapter: jest.fn().mockReturnValue(null),
}));

jest.mock("../../lib/ingestion/market-data", () => ({
  ingestMarketData: jest.fn(),
}));

jest.mock("../../lib/ingestion/content-sources", () => ({
  ingestRSSFeed: jest.fn(),
}));

jest.mock("../../lib/ingestion/indexing", () => ({
  indexMarketData: jest.fn(),
  indexContentSources: jest.fn(),
}));

// Mock the app.timer registration to capture the handler
let capturedHandler: (timer: Timer, context: InvocationContext) => Promise<void>;
let capturedConfig: { schedule: string; handler: any };

jest.mock("@azure/functions", () => ({
  app: {
    timer: jest.fn((name: string, config: any) => {
      capturedConfig = config;
      capturedHandler = config.handler;
    }),
  },
}));

// Import the mocked dependencies
import { ingestMarketData } from "../../lib/ingestion/market-data";
import { ingestRSSFeed } from "../../lib/ingestion/content-sources";
import {
  indexMarketData,
  indexContentSources,
} from "../../lib/ingestion/indexing";

describe("dataIngestionScheduler", () => {
  let mockContext: jest.Mocked<InvocationContext>;
  let mockTimer: Timer;

  beforeAll(() => {
    // Import the module to trigger registration
    require("./dataIngestionScheduler");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    } as unknown as jest.Mocked<InvocationContext>;

    mockTimer = {
      isPastDue: false,
      schedule: {
        adjustForDST: false,
      },
      scheduleStatus: {
        last: new Date().toISOString(),
        next: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    };
  });

  describe("function registration", () => {
    it("should register with correct name and schedule", () => {
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.schedule).toBe("0 0 */6 * * *");
    });

    it("should use NCRONTAB 6-field format for schedule", () => {
      const scheduleFields = capturedConfig.schedule.split(" ");
      expect(scheduleFields).toHaveLength(6);
    });
  });

  describe("handler execution", () => {
    it("should log start message", async () => {
      mockContentIngestion.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(
        "Starting data ingestion scheduler"
      );
    });

    it("should handle empty ingestion configs", async () => {
      mockContentIngestion.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(
        "Found 0 active ingestion configurations"
      );
      expect(mockContext.log).toHaveBeenCalledWith(
        "Data ingestion scheduler completed"
      );
    });

    it("should process market_data ingestion type", async () => {
      const mockConfig = {
        id: "config-1",
        sourceType: "market_data",
        config: JSON.stringify({ tenantId: "tenant-1", schedule: "daily" }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([mockConfig]);
      (ingestMarketData as jest.Mock).mockResolvedValue({
        dataPoints: 10,
        errors: [],
      });
      (indexMarketData as jest.Mock).mockResolvedValue({
        indexed: 10,
        errors: [],
      });

      await capturedHandler(mockTimer, mockContext);

      expect(ingestMarketData).toHaveBeenCalledWith("tenant-1");
      expect(indexMarketData).toHaveBeenCalledWith("tenant-1", 10);
    });

    it("should process rss ingestion type", async () => {
      const mockConfig = {
        id: "config-2",
        sourceType: "rss",
        config: JSON.stringify({
          tenantId: "tenant-1",
          url: "https://example.com/feed",
          title: "Test Feed",
          tags: ["news"],
          reliabilityScore: 0.9,
          schedule: "hourly",
        }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([mockConfig]);
      (ingestRSSFeed as jest.Mock).mockResolvedValue({
        itemsCreated: 5,
        errors: [],
      });
      (indexContentSources as jest.Mock).mockResolvedValue({
        indexed: 5,
        errors: [],
      });

      await capturedHandler(mockTimer, mockContext);

      expect(ingestRSSFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com/feed",
          title: "Test Feed",
        }),
        "tenant-1"
      );
    });

    it("should skip unknown source types", async () => {
      const mockConfig = {
        id: "config-3",
        sourceType: "unknown_type",
        config: JSON.stringify({ tenantId: "tenant-1" }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([mockConfig]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(
        "Unknown source type: unknown_type"
      );
    });

    it("should update config status on error", async () => {
      const mockConfig = {
        id: "config-4",
        sourceType: "market_data",
        config: JSON.stringify({ tenantId: "tenant-1" }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([mockConfig]);
      (ingestMarketData as jest.Mock).mockRejectedValue(
        new Error("Ingestion failed")
      );

      await capturedHandler(mockTimer, mockContext);

      expect(mockContentIngestion.update).toHaveBeenCalledWith({
        where: { id: "config-4" },
        data: { status: "error" },
      });
    });

    it("should disconnect prisma on completion", async () => {
      mockContentIngestion.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
    });

    it("should disconnect prisma even on error", async () => {
      mockContentIngestion.findMany.mockRejectedValue(new Error("DB error"));

      await expect(capturedHandler(mockTimer, mockContext)).rejects.toThrow(
        "DB error"
      );

      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
    });

    it("should not index if no data points ingested", async () => {
      const mockConfig = {
        id: "config-5",
        sourceType: "market_data",
        config: JSON.stringify({ tenantId: "tenant-1", schedule: "daily" }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([mockConfig]);
      (ingestMarketData as jest.Mock).mockResolvedValue({
        dataPoints: 0,
        errors: [],
      });

      await capturedHandler(mockTimer, mockContext);

      expect(indexMarketData).not.toHaveBeenCalled();
    });
  });
});
