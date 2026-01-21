"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationName = getApplicationName;
exports.getApplicationNameInitial = getApplicationNameInitial;
exports.generatePageMetadata = generatePageMetadata;
/**
 * Get the application name with fallback logic:
 * 1. applicationName (if set)
 * 2. tenant.name (if tenant exists)
 * 3. "Insight Studio" (default)
 */
function getApplicationName(tenant) {
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
function getApplicationNameInitial(tenant) {
    const appName = getApplicationName(tenant);
    return appName[0]?.toUpperCase() || "I";
}
/**
 * Generate metadata with application name for Next.js pages
 * Usage: export const metadata = generatePageMetadata(tenant);
 */
function generatePageMetadata(tenant, additionalMetadata) {
    const appName = getApplicationName(tenant);
    return {
        title: appName,
        ...additionalMetadata,
        ...(additionalMetadata?.title
            ? { title: `${additionalMetadata.title} | ${appName}` }
            : {}),
    };
}
//# sourceMappingURL=application-name.js.map