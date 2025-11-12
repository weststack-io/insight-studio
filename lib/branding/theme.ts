import { Tenant } from '@/types';
import { prisma } from '@/lib/db/client';

/**
 * Get tenant by domain from request headers
 */
export async function getTenantByDomain(domain?: string): Promise<Tenant | null> {
  if (!domain) {
    return null;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { domain },
    });

    return tenant as Tenant | null;
  } catch (error) {
    console.error('Failed to get tenant by domain:', error);
    return null;
  }
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return tenant as Tenant | null;
  } catch (error) {
    console.error('Failed to get tenant by ID:', error);
    return null;
  }
}

/**
 * Extract domain from request headers
 */
export function extractDomainFromHeaders(headers: Headers): string | null {
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
export function getBrandingCSSVariables(tenant: Tenant | null): Record<string, string> {
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

