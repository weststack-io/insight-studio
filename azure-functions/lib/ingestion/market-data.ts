import { PrismaClient } from "@prisma/client";
import { createMssqlAdapter } from "../db/adapter";

// Lazy-initialize Prisma client
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: createMssqlAdapter(),
    });
  }
  return prisma;
}

export interface MarketDataPoint {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  previousClose?: number;
  timestamp: string;
  type: "index" | "currency" | "volatility";
}

export interface MarketDataResult {
  success: boolean;
  dataPoints: number;
  data?: MarketDataPoint[];
  errors?: string[];
}

export interface AlphaVantageConfig {
  apiKey: string;
  baseUrl: string;
}

// Default symbols to fetch
const INDEX_SYMBOLS = [
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "NASDAQ 100 ETF" },
  { symbol: "DIA", name: "Dow Jones ETF" },
  { symbol: "IWM", name: "Russell 2000 ETF" },
];

const CURRENCY_PAIRS = [
  { from: "EUR", to: "USD", name: "EUR/USD" },
  { from: "GBP", to: "USD", name: "GBP/USD" },
  { from: "USD", to: "JPY", name: "USD/JPY" },
];

/**
 * Fetch stock quote from Alpha Vantage
 */
async function fetchStockQuote(
  symbol: string,
  config: AlphaVantageConfig
): Promise<any> {
  const url = `${config.baseUrl}/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.apiKey}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Check for API errors
  if (data["Error Message"]) {
    throw new Error(data["Error Message"]);
  }

  if (data["Note"]) {
    // Rate limit warning
    console.warn(`Alpha Vantage rate limit warning: ${data["Note"]}`);
  }

  return data["Global Quote"];
}

/**
 * Fetch currency exchange rate from Alpha Vantage
 */
async function fetchCurrencyRate(
  fromCurrency: string,
  toCurrency: string,
  config: AlphaVantageConfig
): Promise<any> {
  const url = `${config.baseUrl}/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${config.apiKey}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Check for API errors
  if (data["Error Message"]) {
    throw new Error(data["Error Message"]);
  }

  if (data["Note"]) {
    console.warn(`Alpha Vantage rate limit warning: ${data["Note"]}`);
  }

  return data["Realtime Currency Exchange Rate"];
}

/**
 * Fetch all market data from Alpha Vantage
 */
export async function fetchAlphaVantageData(
  config: AlphaVantageConfig
): Promise<MarketDataPoint[]> {
  const dataPoints: MarketDataPoint[] = [];
  const errors: string[] = [];

  // Fetch index ETFs
  for (const index of INDEX_SYMBOLS) {
    try {
      const quote = await fetchStockQuote(index.symbol, config);

      if (quote) {
        dataPoints.push({
          symbol: index.symbol,
          name: index.name,
          price: parseFloat(quote["05. price"]) || 0,
          change: parseFloat(quote["09. change"]) || 0,
          changePercent: parseFloat(quote["10. change percent"]?.replace("%", "")) || 0,
          volume: parseInt(quote["06. volume"]) || undefined,
          previousClose: parseFloat(quote["08. previous close"]) || undefined,
          timestamp: quote["07. latest trading day"] || new Date().toISOString(),
          type: "index",
        });
      }

      // Add delay to avoid rate limiting (5 calls/minute on free tier)
      await delay(1500);
    } catch (error) {
      const msg = `Failed to fetch ${index.symbol}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  // Fetch currency pairs
  for (const pair of CURRENCY_PAIRS) {
    try {
      const rate = await fetchCurrencyRate(pair.from, pair.to, config);

      if (rate) {
        const currentRate = parseFloat(rate["5. Exchange Rate"]) || 0;
        // Alpha Vantage doesn't provide change for currencies directly, so we'll set to 0
        dataPoints.push({
          symbol: `${pair.from}${pair.to}`,
          name: pair.name,
          price: currentRate,
          change: 0,
          changePercent: 0,
          timestamp: rate["6. Last Refreshed"] || new Date().toISOString(),
          type: "currency",
        });
      }

      await delay(1500);
    } catch (error) {
      const msg = `Failed to fetch ${pair.name}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  if (errors.length > 0 && dataPoints.length === 0) {
    throw new Error(`All market data requests failed: ${errors.join("; ")}`);
  }

  return dataPoints;
}

/**
 * Store market data in the database
 */
export async function storeMarketData(
  dataPoints: MarketDataPoint[],
  tenantId?: string
): Promise<MarketDataResult> {
  const db = getPrismaClient();
  const errors: string[] = [];
  let successCount = 0;

  for (const dataPoint of dataPoints) {
    try {
      await db.marketData.create({
        data: {
          type: dataPoint.type,
          source: "alpha_vantage",
          data: JSON.stringify(dataPoint),
          date: new Date(dataPoint.timestamp),
          tenantId: tenantId || null,
        },
      });
      successCount++;
    } catch (error) {
      const msg = `Failed to store ${dataPoint.symbol}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return {
    success: errors.length === 0,
    dataPoints: successCount,
    data: dataPoints,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Ingest market data from Alpha Vantage and store in database
 */
export async function ingestMarketData(
  tenantId?: string
): Promise<MarketDataResult> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const baseUrl = process.env.ALPHA_VANTAGE_BASE_URL || "https://www.alphavantage.co";

  if (!apiKey) {
    return {
      success: false,
      dataPoints: 0,
      errors: ["ALPHA_VANTAGE_API_KEY environment variable is not set"],
    };
  }

  const config: AlphaVantageConfig = {
    apiKey,
    baseUrl,
  };

  console.log(`Starting market data ingestion for tenant: ${tenantId || "all"}`);

  try {
    // Fetch data from Alpha Vantage
    const dataPoints = await fetchAlphaVantageData(config);
    console.log(`Fetched ${dataPoints.length} market data points from Alpha Vantage`);

    // Store in database
    const result = await storeMarketData(dataPoints, tenantId);
    console.log(`Stored ${result.dataPoints} market data points in database`);

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Market data ingestion failed: ${errorMsg}`);

    return {
      success: false,
      dataPoints: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Get latest market data from database
 */
export async function getLatestMarketData(
  tenantId?: string,
  type?: "index" | "currency" | "volatility"
): Promise<MarketDataPoint[]> {
  const db = getPrismaClient();

  const where: any = {
    source: "alpha_vantage",
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (type) {
    where.type = type;
  }

  // Get most recent data for each symbol (within last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const data = await db.marketData.findMany({
    where: {
      ...where,
      date: {
        gte: oneDayAgo,
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 20,
  });

  // Parse and deduplicate by symbol (keep most recent)
  const seenSymbols = new Set<string>();
  const results: MarketDataPoint[] = [];

  for (const item of data) {
    const parsed = JSON.parse(item.data) as MarketDataPoint;
    if (!seenSymbols.has(parsed.symbol)) {
      seenSymbols.add(parsed.symbol);
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Format market data for use in briefing prompts
 */
export function formatMarketDataForPrompt(data: MarketDataPoint[]): string {
  if (data.length === 0) {
    return "Current market data is unavailable.";
  }

  const lines: string[] = ["Current Market Data:"];

  // Group by type
  const indices = data.filter((d) => d.type === "index");
  const currencies = data.filter((d) => d.type === "currency");

  if (indices.length > 0) {
    lines.push("\nMajor Indices:");
    for (const index of indices) {
      const changeSign = index.change >= 0 ? "+" : "";
      lines.push(
        `- ${index.name} (${index.symbol}): $${index.price.toFixed(2)} (${changeSign}${index.changePercent.toFixed(2)}%)`
      );
    }
  }

  if (currencies.length > 0) {
    lines.push("\nCurrency Rates:");
    for (const currency of currencies) {
      lines.push(`- ${currency.name}: ${currency.price.toFixed(4)}`);
    }
  }

  return lines.join("\n");
}

/**
 * Helper function to add delay between API calls
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
