import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface MarketDataPoint {
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  timestamp: string;
  [key: string]: any; // Allow additional fields
}

export interface AlphaMavenConfig {
  apiKey: string;
  baseUrl?: string;
  symbols?: string[];
  dataTypes?: string[];
}

export interface MarketDataResult {
  success: boolean;
  dataPoints: number;
  errors?: string[];
}

/**
 * Fetch market data from Alpha Maven API
 */
export async function fetchAlphaMavenData(
  config: AlphaMavenConfig
): Promise<MarketDataPoint[]> {
  const baseUrl = config.baseUrl || "https://api.alphamaven.com/v1";
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error("Alpha Maven API key is required");
  }

  const dataPoints: MarketDataPoint[] = [];
  const errors: string[] = [];

  // Default symbols if not provided (major indices and currencies)
  const symbols =
    config.symbols || [
      "SPY",
      "QQQ",
      "DIA",
      "IWM",
      "VIX",
      "EURUSD",
      "GBPUSD",
      "USDJPY",
    ];

  // Default data types if not provided
  const dataTypes = config.dataTypes || ["quote", "price"];

  try {
    // Fetch data for each symbol
    for (const symbol of symbols) {
      try {
        // Alpha Maven API endpoint structure (adjust based on actual API)
        const response = await fetch(
          `${baseUrl}/market/${symbol}?apikey=${apiKey}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          errors.push(
            `Failed to fetch data for ${symbol}: ${response.statusText}`
          );
          continue;
        }

        const data = await response.json();

        // Normalize the response based on Alpha Maven API structure
        // Adjust this based on actual API response format
        const normalizedData: MarketDataPoint = {
          symbol,
          price: data.price || data.close || data.last,
          change: data.change || data.changeAmount,
          changePercent: data.changePercent || data.changePct,
          volume: data.volume || data.tradeVolume,
          timestamp: data.timestamp || data.time || new Date().toISOString(),
          ...data, // Include all additional fields
        };

        dataPoints.push(normalizedData);
      } catch (error) {
        errors.push(
          `Error fetching data for ${symbol}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to fetch Alpha Maven data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (errors.length > 0 && dataPoints.length === 0) {
    throw new Error(`All requests failed: ${errors.join(", ")}`);
  }

  return dataPoints;
}

/**
 * Store market data in the database
 */
export async function storeMarketData(
  dataPoints: MarketDataPoint[],
  source: string = "alpha_maven",
  tenantId?: string
): Promise<MarketDataResult> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    for (const dataPoint of dataPoints) {
      try {
        // Determine data type from symbol or data structure
        let dataType = "equity";
        if (dataPoint.symbol) {
          if (
            dataPoint.symbol.includes("USD") ||
            dataPoint.symbol.includes("EUR") ||
            dataPoint.symbol.includes("GBP") ||
            dataPoint.symbol.includes("JPY")
          ) {
            dataType = "currency";
          } else if (dataPoint.symbol === "VIX") {
            dataType = "volatility";
          } else if (
            dataPoint.symbol.includes("BOND") ||
            dataPoint.symbol.includes("Treasury")
          ) {
            dataType = "bond";
          }
        }

        // Parse timestamp
        const date = dataPoint.timestamp
          ? new Date(dataPoint.timestamp)
          : new Date();

        await prisma.marketData.create({
          data: {
            type: dataType,
            source,
            data: JSON.stringify(dataPoint),
            date,
            tenantId: tenantId || null,
          },
        });

        successCount++;
      } catch (error) {
        errors.push(
          `Failed to store data for ${dataPoint.symbol || "unknown"}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to store market data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return {
    success: errors.length === 0,
    dataPoints: successCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Ingest market data from Alpha Maven and store in database
 */
export async function ingestMarketData(
  tenantId?: string
): Promise<MarketDataResult> {
  const apiKey = process.env.ALPHA_MAVEN_API_KEY;

  if (!apiKey) {
    throw new Error("ALPHA_MAVEN_API_KEY environment variable is not set");
  }

  const config: AlphaMavenConfig = {
    apiKey,
    baseUrl: process.env.ALPHA_MAVEN_BASE_URL,
    symbols: process.env.ALPHA_MAVEN_SYMBOLS
      ? process.env.ALPHA_MAVEN_SYMBOLS.split(",")
      : undefined,
  };

  try {
    // Fetch data from Alpha Maven
    const dataPoints = await fetchAlphaMavenData(config);

    // Store in database
    const result = await storeMarketData(dataPoints, "alpha_maven", tenantId);

    return result;
  } catch (error) {
    throw new Error(
      `Market data ingestion failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get market data for a specific date range
 */
export async function getMarketData(
  options: {
    tenantId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    source?: string;
    limit?: number;
  } = {}
): Promise<any[]> {
  const {
    tenantId,
    type,
    startDate,
    endDate,
    source,
    limit = 100,
  } = options;

  const where: any = {};

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (type) {
    where.type = type;
  }

  if (source) {
    where.source = source;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = startDate;
    }
    if (endDate) {
      where.date.lte = endDate;
    }
  }

  const data = await prisma.marketData.findMany({
    where,
    orderBy: {
      date: "desc",
    },
    take: limit,
  });

  return data.map((item) => ({
    ...item,
    data: JSON.parse(item.data),
  }));
}

/**
 * Get latest market data for a specific type
 */
export async function getLatestMarketData(
  type: string,
  tenantId?: string
): Promise<any | null> {
  const where: any = {
    type,
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  const data = await prisma.marketData.findFirst({
    where,
    orderBy: {
      date: "desc",
    },
  });

  if (!data) {
    return null;
  }

  return {
    ...data,
    data: JSON.parse(data.data),
  };
}

