import { HttpRequest, InvocationContext } from "@azure/functions";

// Create shared mock instances
const mockUser = {
  findMany: jest.fn(),
};

const mockBriefing = {
  findMany: jest.fn(),
  create: jest.fn(),
};

const mockTenant = {
  count: jest.fn(),
};

const mockContentIngestion = {
  findMany: jest.fn(),
  update: jest.fn(),
};

const mockPrismaInstance = {
  user: mockUser,
  briefing: mockBriefing,
  tenant: mockTenant,
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

jest.mock("../../lib/ai/generators", () => ({
  generateBriefing: jest.fn(),
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

// Capture registered handlers
const capturedHandlers: Record<string, any> = {};

jest.mock("@azure/functions", () => ({
  app: {
    http: jest.fn((name: string, config: any) => {
      capturedHandlers[name] = config;
    }),
    timer: jest.fn(),
  },
}));

// Import mocked dependencies
import { generateBriefing } from "../../lib/ai/generators";
import { ingestMarketData } from "../../lib/ingestion/market-data";
import { ingestRSSFeed } from "../../lib/ingestion/content-sources";
import { indexMarketData, indexContentSources } from "../../lib/ingestion/indexing";

describe("manualTriggers", () => {
  let mockContext: jest.Mocked<InvocationContext>;

  beforeAll(() => {
    // Import the module to trigger registration
    require("./manualTriggers");
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
  });

  describe("function registration", () => {
    it("should register triggerBriefings with POST method and function auth", () => {
      expect(capturedHandlers.triggerBriefings).toBeDefined();
      expect(capturedHandlers.triggerBriefings.methods).toContain("POST");
      expect(capturedHandlers.triggerBriefings.authLevel).toBe("function");
      expect(capturedHandlers.triggerBriefings.route).toBe("trigger/briefings");
    });

    it("should register triggerDataIngestion with POST method and function auth", () => {
      expect(capturedHandlers.triggerDataIngestion).toBeDefined();
      expect(capturedHandlers.triggerDataIngestion.methods).toContain("POST");
      expect(capturedHandlers.triggerDataIngestion.authLevel).toBe("function");
      expect(capturedHandlers.triggerDataIngestion.route).toBe("trigger/ingestion");
    });

    it("should register healthCheck with GET method and anonymous auth", () => {
      expect(capturedHandlers.healthCheck).toBeDefined();
      expect(capturedHandlers.healthCheck.methods).toContain("GET");
      expect(capturedHandlers.healthCheck.authLevel).toBe("anonymous");
      expect(capturedHandlers.healthCheck.route).toBe("health");
    });
  });

  describe("triggerBriefings", () => {
    const createMockRequest = (queryParams: Record<string, string> = {}) => ({
      query: {
        get: (key: string) => queryParams[key] || null,
      },
    } as unknown as HttpRequest);

    it("should return 200 with success message when no users exist", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      const request = createMockRequest();
      const result = await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.success).toBe(true);
      expect(result.jsonBody.details.usersProcessed).toBe(0);
      expect(result.jsonBody.details.briefingsGenerated).toBe(0);
    });

    it("should generate briefings for users with tenants", async () => {
      const testUser = {
        id: "user-1",
        tenantId: "tenant-1",
        language: "en",
        generation: "millennial",
        sophisticationLevel: "intermediate",
        userPreferences: [{ topic: "tech" }],
        tenant: { id: "tenant-1" },
      };

      mockUser.findMany.mockResolvedValue([testUser]);
      mockBriefing.findMany.mockResolvedValue([]);
      (generateBriefing as jest.Mock).mockResolvedValue({
        title: "Test Briefing",
        content: "Test content",
      });

      const request = createMockRequest();
      const result = await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.success).toBe(true);
      expect(result.jsonBody.details.usersProcessed).toBe(1);
      expect(result.jsonBody.details.briefingsGenerated).toBe(1);
      expect(generateBriefing).toHaveBeenCalled();
      expect(mockBriefing.create).toHaveBeenCalled();
    });

    it("should filter by userId when provided", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      const request = createMockRequest({ userId: "specific-user" });
      await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(mockUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "specific-user" }),
        })
      );
    });

    it("should filter by tenantId when provided", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      const request = createMockRequest({ tenantId: "specific-tenant" });
      await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(mockUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "specific-tenant" }),
        })
      );
    });

    it("should skip existing briefings for the week", async () => {
      const testUser = {
        id: "user-1",
        tenantId: "tenant-1",
        language: "en",
        generation: "millennial",
        sophisticationLevel: "intermediate",
        userPreferences: [],
        tenant: { id: "tenant-1" },
      };

      mockUser.findMany.mockResolvedValue([testUser]);
      mockBriefing.findMany.mockResolvedValue([{ userId: "user-1", type: "market" }]);

      const request = createMockRequest();
      const result = await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.details.briefingsGenerated).toBe(0);
      expect(generateBriefing).not.toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      mockUser.findMany.mockRejectedValue(new Error("Database connection failed"));

      const request = createMockRequest();
      const result = await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(result.status).toBe(500);
      expect(result.jsonBody.success).toBe(false);
      expect(result.jsonBody.message).toContain("Database connection failed");
    });

    it("should include duration in response", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      const request = createMockRequest();
      const result = await capturedHandlers.triggerBriefings.handler(request, mockContext);

      expect(result.jsonBody.details.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("triggerDataIngestion", () => {
    const createMockRequest = (queryParams: Record<string, string> = {}) => ({
      query: {
        get: (key: string) => queryParams[key] || null,
      },
    } as unknown as HttpRequest);

    it("should return 200 with success message when no configs exist", async () => {
      mockContentIngestion.findMany.mockResolvedValue([]);

      const request = createMockRequest();
      const result = await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.success).toBe(true);
      expect(result.jsonBody.details.configurationsProcessed).toBe(0);
    });

    it("should process market_data ingestion config", async () => {
      const config = {
        id: "config-1",
        sourceType: "market_data",
        config: JSON.stringify({ tenantId: "tenant-1" }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([config]);
      (ingestMarketData as jest.Mock).mockResolvedValue({
        dataPoints: 100,
        errors: [],
      });
      (indexMarketData as jest.Mock).mockResolvedValue({
        indexed: 100,
        errors: [],
      });

      const request = createMockRequest();
      const result = await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.success).toBe(true);
      expect(result.jsonBody.details.configurationsProcessed).toBe(1);
      expect(result.jsonBody.details.dataPointsIngested).toBe(100);
      expect(result.jsonBody.details.itemsIndexed).toBe(100);
      expect(ingestMarketData).toHaveBeenCalledWith("tenant-1");
    });

    it("should process rss ingestion config", async () => {
      const config = {
        id: "config-2",
        sourceType: "rss",
        config: JSON.stringify({
          url: "https://example.com/feed.xml",
          title: "Test Feed",
          tags: ["news"],
          reliabilityScore: 0.8,
          tenantId: "tenant-1",
        }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([config]);
      (ingestRSSFeed as jest.Mock).mockResolvedValue({
        itemsCreated: 50,
        errors: [],
      });
      (indexContentSources as jest.Mock).mockResolvedValue({
        indexed: 50,
        errors: [],
      });

      const request = createMockRequest();
      const result = await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.success).toBe(true);
      expect(result.jsonBody.details.dataPointsIngested).toBe(50);
      expect(ingestRSSFeed).toHaveBeenCalled();
    });

    it("should filter by sourceType when provided", async () => {
      mockContentIngestion.findMany.mockResolvedValue([]);

      const request = createMockRequest({ sourceType: "market_data" });
      await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(mockContentIngestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sourceType: "market_data" }),
        })
      );
    });

    it("should filter by configId when provided", async () => {
      mockContentIngestion.findMany.mockResolvedValue([]);

      const request = createMockRequest({ configId: "specific-config" });
      await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(mockContentIngestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "specific-config" }),
        })
      );
    });

    it("should update config status to error on failure", async () => {
      const config = {
        id: "config-1",
        sourceType: "market_data",
        config: JSON.stringify({ tenantId: "tenant-1" }),
        status: "active",
      };

      mockContentIngestion.findMany.mockResolvedValue([config]);
      (ingestMarketData as jest.Mock).mockRejectedValue(new Error("Ingestion failed"));

      const request = createMockRequest();
      await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(mockContentIngestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "config-1" },
          data: { status: "error" },
        })
      );
    });

    it("should return 500 on database error", async () => {
      mockContentIngestion.findMany.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const result = await capturedHandlers.triggerDataIngestion.handler(request, mockContext);

      expect(result.status).toBe(500);
      expect(result.jsonBody.success).toBe(false);
    });
  });

  describe("healthCheck", () => {
    const createMockRequest = () => ({} as HttpRequest);

    it("should return 200 with healthy status when database is connected", async () => {
      mockTenant.count.mockResolvedValue(5);

      const request = createMockRequest();
      const result = await capturedHandlers.healthCheck.handler(request, mockContext);

      expect(result.status).toBe(200);
      expect(result.jsonBody.status).toBe("healthy");
      expect(result.jsonBody.database).toBe("connected");
      expect(result.jsonBody.tenants).toBe(5);
      expect(result.jsonBody.timestamp).toBeDefined();
    });

    it("should return 503 when database connection fails", async () => {
      mockTenant.count.mockRejectedValue(new Error("Connection refused"));

      const request = createMockRequest();
      const result = await capturedHandlers.healthCheck.handler(request, mockContext);

      expect(result.status).toBe(503);
      expect(result.jsonBody.status).toBe("unhealthy");
      expect(result.jsonBody.error).toContain("Connection refused");
    });
  });
});
