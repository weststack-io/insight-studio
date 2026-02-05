import { InvocationContext, Timer } from "@azure/functions";

// Create shared mock instances
const mockUser = {
  findMany: jest.fn(),
};

const mockBriefing = {
  findMany: jest.fn(),
  create: jest.fn(),
};

const mockPrismaInstance = {
  user: mockUser,
  briefing: mockBriefing,
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
import { generateBriefing } from "../../lib/ai/generators";

describe("weeklyBriefingsGenerator", () => {
  let mockContext: jest.Mocked<InvocationContext>;
  let mockTimer: Timer;

  beforeAll(() => {
    // Import the module to trigger registration
    require("./weeklyBriefingsGenerator");
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
      expect(capturedConfig.schedule).toBe("0 0 9 * * 1");
    });

    it("should use NCRONTAB 6-field format for Monday 9 AM", () => {
      const scheduleFields = capturedConfig.schedule.split(" ");
      expect(scheduleFields).toHaveLength(6);
      // sec=0, min=0, hour=9, day=*, month=*, dow=1 (Monday)
      expect(scheduleFields[0]).toBe("0"); // seconds
      expect(scheduleFields[1]).toBe("0"); // minutes
      expect(scheduleFields[2]).toBe("9"); // hours
      expect(scheduleFields[5]).toBe("1"); // day of week (Monday)
    });
  });

  describe("handler execution", () => {
    it("should log start message", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(
        "Starting weekly briefings generation"
      );
    });

    it("should handle no users", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith("Found 0 users to process");
      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining("Weekly briefings generation completed")
      );
    });

    it("should generate briefing for user with tenant", async () => {
      const testUser = {
        id: "user-1",
        tenantId: "tenant-1",
        language: "en",
        generation: "millennial",
        sophisticationLevel: "intermediate",
        userPreferences: [{ topic: "tech" }, { topic: "finance" }],
        tenant: { id: "tenant-1", name: "Test Tenant" },
      };

      mockUser.findMany.mockResolvedValue([testUser]);
      mockBriefing.findMany.mockResolvedValue([]);
      (generateBriefing as jest.Mock).mockResolvedValue({
        title: "Weekly Market Update",
        content: "Market content here",
      });

      await capturedHandler(mockTimer, mockContext);

      expect(generateBriefing).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "market",
          language: "en",
          generation: "millennial",
          sophisticationLevel: "intermediate",
          userPreferences: ["tech", "finance"],
        })
      );

      expect(mockBriefing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            tenantId: "tenant-1",
            type: "market",
          }),
        })
      );
    });

    it("should skip users without tenant", async () => {
      const testUser = {
        id: "user-2",
        tenantId: null,
        language: "en",
        generation: "boomer",
        sophisticationLevel: "basic",
        userPreferences: [],
        tenant: null,
      };

      mockUser.findMany.mockResolvedValue([testUser]);
      mockBriefing.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(generateBriefing).not.toHaveBeenCalled();
      expect(mockBriefing.create).not.toHaveBeenCalled();
    });

    it("should skip existing briefings for the week", async () => {
      const testUser = {
        id: "user-3",
        tenantId: "tenant-1",
        language: "en",
        generation: "genx",
        sophisticationLevel: "advanced",
        userPreferences: [],
        tenant: { id: "tenant-1" },
      };

      mockUser.findMany.mockResolvedValue([testUser]);
      mockBriefing.findMany.mockResolvedValue([
        { userId: "user-3", type: "market" },
      ]);

      await capturedHandler(mockTimer, mockContext);

      expect(generateBriefing).not.toHaveBeenCalled();
      expect(mockBriefing.create).not.toHaveBeenCalled();
    });

    it("should handle errors for individual users gracefully", async () => {
      const testUsers = [
        {
          id: "user-4",
          tenantId: "tenant-1",
          language: "en",
          generation: "millennial",
          sophisticationLevel: "intermediate",
          userPreferences: [],
          tenant: { id: "tenant-1" },
        },
        {
          id: "user-5",
          tenantId: "tenant-1",
          language: "es",
          generation: "genz",
          sophisticationLevel: "basic",
          userPreferences: [],
          tenant: { id: "tenant-1" },
        },
      ];

      mockUser.findMany.mockResolvedValue(testUsers);
      mockBriefing.findMany.mockResolvedValue([]);
      (generateBriefing as jest.Mock)
        .mockRejectedValueOnce(new Error("AI error"))
        .mockResolvedValueOnce({ title: "Success", content: "Content" });

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining("Error: Failed to process user user-4"),
        expect.any(Error)
      );
      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining("Success: 1, Errors: 1")
      );
    });

    it("should process users in batches", async () => {
      // Create 15 users to test batching (batch size is 10)
      const testUsers = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i}`,
        tenantId: "tenant-1",
        language: "en",
        generation: "millennial",
        sophisticationLevel: "intermediate",
        userPreferences: [],
        tenant: { id: "tenant-1" },
      }));

      mockUser.findMany.mockResolvedValue(testUsers);
      mockBriefing.findMany.mockResolvedValue([]);
      (generateBriefing as jest.Mock).mockResolvedValue({
        title: "Briefing",
        content: "Content",
      });

      await capturedHandler(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith("Found 15 users to process");
      expect(generateBriefing).toHaveBeenCalledTimes(15);
    });

    it("should disconnect prisma on completion", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
    });

    it("should disconnect prisma even on error", async () => {
      mockUser.findMany.mockRejectedValue(new Error("DB error"));

      await expect(capturedHandler(mockTimer, mockContext)).rejects.toThrow(
        "DB error"
      );

      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
    });
  });

  describe("week start date calculation", () => {
    it("should calculate Monday of current week for briefings", async () => {
      mockUser.findMany.mockResolvedValue([]);
      mockBriefing.findMany.mockResolvedValue([]);

      await capturedHandler(mockTimer, mockContext);

      // The findMany for briefings should be called with a weekStartDate
      expect(mockBriefing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            weekStartDate: expect.any(Date),
          }),
        })
      );
    });
  });
});
