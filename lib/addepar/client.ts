import axios, { AxiosInstance } from 'axios';
import { PortfolioData } from '@/types';

interface AddeparTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AddeparHolding {
  id: string;
  attributes: {
    name?: string;
    ticker?: string;
    asset_class?: string;
    market_value?: number;
    cost_basis?: number;
    quantity?: number;
  };
}

interface AddeparPortfolioResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      name?: string;
      market_value?: number;
      holdings?: AddeparHolding[];
    };
  }>;
}

class AddeparClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const apiUrl = process.env.ADDEPAR_API_URL || 'https://api.addepar.com';
    
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private async getAccessToken(): Promise<string | null> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    try {
      const clientId = process.env.ADDEPAR_CLIENT_ID;
      const clientSecret = process.env.ADDEPAR_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Addepar credentials are not configured');
      }

      // Addepar uses OAuth 2.0 client credentials flow
      const response = await axios.post<AddeparTokenResponse>(
        `${process.env.ADDEPAR_API_URL || 'https://api.addepar.com'}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Addepar access token:', error);
      return null;
    }
  }

  /**
   * Get portfolio data for a specific entity (client)
   */
  async getPortfolioData(entityId: string): Promise<PortfolioData> {
    try {
      // Addepar API endpoint for portfolio holdings
      // Note: Actual endpoint may vary based on Addepar API version
      const response = await this.client.get<AddeparPortfolioResponse>(
        `/v1/entities/${entityId}/portfolio`,
        {
          params: {
            include: 'holdings',
            format: 'json',
          },
        }
      );

      const portfolio = response.data.data[0];
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const holdings = portfolio.attributes.holdings || [];
      const totalValue = portfolio.attributes.market_value || 0;

      // Transform Addepar holdings to our format
      const transformedHoldings = holdings.map((holding) => {
        const marketValue = holding.attributes.market_value || 0;
        return {
          symbol: holding.attributes.ticker,
          name: holding.attributes.name || holding.id,
          value: marketValue,
          percentage: totalValue > 0 ? (marketValue / totalValue) * 100 : 0,
          assetClass: holding.attributes.asset_class,
        };
      });

      return {
        holdings: transformedHoldings,
        totalValue,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch portfolio data from Addepar:', error);
      throw new Error('Failed to fetch portfolio data');
    }
  }

  /**
   * Get entity (client) information
   */
  async getEntity(entityId: string): Promise<any> {
    try {
      const response = await this.client.get(`/v1/entities/${entityId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch entity from Addepar:', error);
      throw new Error('Failed to fetch entity');
    }
  }

  /**
   * Search for entities (clients) by name or other criteria
   */
  async searchEntities(query: string): Promise<any[]> {
    try {
      const response = await this.client.get('/v1/entities', {
        params: {
          filter: `name:${query}`,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to search entities in Addepar:', error);
      return [];
    }
  }
}

// Singleton instance
let addeparClient: AddeparClient | null = null;

export function getAddeparClient(): AddeparClient {
  if (!addeparClient) {
    addeparClient = new AddeparClient();
  }
  return addeparClient;
}

export { AddeparClient };

