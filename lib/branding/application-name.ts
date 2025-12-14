import { Tenant } from "@/types";
import type { Metadata } from "next";

/**
 * Partial tenant type for components that may not have full tenant data
 */
type PartialTenant = Partial<Tenant> | null | undefined;

/**
 * Get the application name with fallback logic:
 * 1. applicationName (if set)
 * 2. tenant.name (if tenant exists)
 * 3. "Insight Studio" (default)
 */
export function getApplicationName(tenant?: PartialTenant): string {
  if (!tenant) {
    return "Insight Studio";
  }

  if (tenant.applicationName) {
    return tenant.applicationName;
  }

  if (tenant.name) {
    return tenant.name;
  }

  return "Insight Studio";
}

/**
 * Get the first letter of the application name for avatar/logo
 */
export function getApplicationNameInitial(tenant?: PartialTenant): string {
  const appName = getApplicationName(tenant);
  return appName[0]?.toUpperCase() || "I";
}

/**
 * Generate metadata with application name for Next.js pages
 * Usage: export const metadata = generatePageMetadata(tenant);
 */
export function generatePageMetadata(
  tenant?: PartialTenant,
  additionalMetadata?: Partial<Metadata>
): Metadata {
  const appName = getApplicationName(tenant);
  return {
    title: appName,
    ...additionalMetadata,
    ...(additionalMetadata?.title
      ? { title: `${additionalMetadata.title} | ${appName}` }
      : {}),
  };
}
