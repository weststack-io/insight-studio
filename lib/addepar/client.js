"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddeparClient = exports.getAddeparClient = void 0;
const axios_1 = require("axios");
class AddeparClient {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = 0;
        const apiUrl = process.env.ADDEPAR_API_URL || 'https://api.addepar.com';
        this.client = axios_1.default.create({
            baseURL: apiUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Add request interceptor to include auth token and Addepar-Firm header
        this.client.interceptors.request.use((config) => __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Add Addepar-Firm header if configured
            const addeparFirm = process.env.ADDEPAR_FIRM;
            if (addeparFirm) {
                config.headers['Addepar-Firm'] = addeparFirm;
            }
            return config;
        }));
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield axios_1.default.post(`${process.env.ADDEPAR_API_URL || 'https://api.addepar.com'}/oauth/token`, {
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                this.accessToken = response.data.access_token;
                this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
                return this.accessToken;
            }
            catch (error) {
                console.error('Failed to get Addepar access token:', error);
                return null;
            }
        });
    }
    /**
     * Get portfolio data for a specific entity (client)
     */
    getPortfolioData(entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[Addepar] Requesting portfolio data for entity: ${entityId}`);
                // Addepar API endpoint for portfolio holdings
                // Note: Actual endpoint may vary based on Addepar API version
                const response = yield this.client.get(`/v1/entities/${entityId}/portfolio`, {
                    params: {
                        include: 'holdings',
                        format: 'json',
                    },
                });
                console.log(`[Addepar] Received response from Addepar API for entity ${entityId}`);
                const portfolio = response.data.data[0];
                if (!portfolio) {
                    throw new Error('Portfolio not found');
                }
                const holdings = portfolio.attributes.holdings || [];
                const totalValue = portfolio.attributes.market_value || 0;
                console.log(`[Addepar] Retrieved portfolio data for entity ${entityId}:`, {
                    totalValue,
                    holdingsCount: holdings.length,
                    rawHoldings: holdings.slice(0, 3).map(h => ({
                        id: h.id,
                        name: h.attributes.name,
                        ticker: h.attributes.ticker,
                        marketValue: h.attributes.market_value,
                        assetClass: h.attributes.asset_class,
                    })),
                });
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
                const portfolioData = {
                    holdings: transformedHoldings,
                    totalValue,
                    lastUpdated: new Date(),
                };
                console.log(`[Addepar] Transformed portfolio data:`, {
                    totalValue: portfolioData.totalValue,
                    holdingsCount: portfolioData.holdings.length,
                    topHoldings: portfolioData.holdings
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map(h => ({
                        symbol: h.symbol,
                        name: h.name,
                        value: h.value,
                        percentage: h.percentage.toFixed(2) + '%',
                        assetClass: h.assetClass,
                    })),
                    assetClasses: [...new Set(portfolioData.holdings.map(h => h.assetClass).filter(Boolean))],
                });
                return portfolioData;
            }
            catch (error) {
                console.error('Failed to fetch portfolio data from Addepar:', error);
                throw new Error('Failed to fetch portfolio data');
            }
        });
    }
    /**
     * Get entity (client) information
     */
    getEntity(entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get(`/v1/entities/${entityId}`);
                return response.data;
            }
            catch (error) {
                console.error('Failed to fetch entity from Addepar:', error);
                throw new Error('Failed to fetch entity');
            }
        });
    }
    /**
     * Search for entities (clients) by name or other criteria
     */
    searchEntities(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get('/v1/entities', {
                    params: {
                        filter: `name:${query}`,
                    },
                });
                return response.data.data || [];
            }
            catch (error) {
                console.error('Failed to search entities in Addepar:', error);
                return [];
            }
        });
    }
}
exports.AddeparClient = AddeparClient;
// Singleton instance
let addeparClient = null;
function getAddeparClient() {
    if (!addeparClient) {
        addeparClient = new AddeparClient();
    }
    return addeparClient;
}
exports.getAddeparClient = getAddeparClient;
//# sourceMappingURL=client.js.map