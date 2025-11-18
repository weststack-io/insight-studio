"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantByDomain = getTenantByDomain;
exports.getTenantById = getTenantById;
exports.extractDomainFromHeaders = extractDomainFromHeaders;
exports.getBrandingCSSVariables = getBrandingCSSVariables;
const client_1 = require("@/lib/db/client");
/**
 * Get tenant by domain from request headers
 */
async function getTenantByDomain(domain) {
    if (!domain) {
        return null;
    }
    try {
        const tenant = await client_1.prisma.tenant.findUnique({
            where: { domain },
        });
        return tenant;
    }
    catch (error) {
        console.error('Failed to get tenant by domain:', error);
        return null;
    }
}
/**
 * Get tenant by ID
 */
async function getTenantById(tenantId) {
    try {
        const tenant = await client_1.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        return tenant;
    }
    catch (error) {
        console.error('Failed to get tenant by ID:', error);
        return null;
    }
}
/**
 * Extract domain from request headers
 */
function extractDomainFromHeaders(headers) {
    const host = headers.get('host') || headers.get('x-forwarded-host');
    if (!host) {
        return null;
    }
    // Remove port if present
    const domain = host.split(':')[0];
    // For subdomain routing, extract subdomain
    // For MVP, we'll use the full hostname or check for tenant-specific domains
    return domain;
}
/**
 * Get CSS variables for tenant branding
 */
function getBrandingCSSVariables(tenant) {
    if (!tenant) {
        return {
            '--color-primary': '#000000',
            '--color-secondary': '#666666',
            '--font-family': 'system-ui, sans-serif',
        };
    }
    return {
        '--color-primary': tenant.primaryColor,
        '--color-secondary': tenant.secondaryColor,
        '--font-family': tenant.fontFamily || 'system-ui, sans-serif',
    };
}
//# sourceMappingURL=theme.js.map