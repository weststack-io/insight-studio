"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const azure_ad_1 = __importDefault(require("next-auth/providers/azure-ad"));
const okta_1 = __importDefault(require("next-auth/providers/okta"));
const prisma_adapter_1 = require("@auth/prisma-adapter");
const client_1 = require("@/lib/db/client");
exports.authOptions = {
    adapter: (0, prisma_adapter_1.PrismaAdapter)(client_1.prisma),
    providers: [
        (0, azure_ad_1.default)({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
                params: {
                    scope: "openid profile email User.Read",
                },
            },
            allowDangerousEmailAccountLinking: true,
        }),
        ...(process.env.OKTA_CLIENT_ID &&
            process.env.OKTA_CLIENT_SECRET &&
            process.env.OKTA_ISSUER
            ? [
                (0, okta_1.default)({
                    clientId: process.env.OKTA_CLIENT_ID,
                    clientSecret: process.env.OKTA_CLIENT_SECRET,
                    issuer: process.env.OKTA_ISSUER,
                    allowDangerousEmailAccountLinking: true,
                }),
            ]
            : []),
    ],
    events: {
        async createUser({ user }) {
            // After the adapter creates the user, set our custom fields
            if (user.email) {
                const emailDomain = user.email.split("@")[1];
                // Find or create tenant based on domain
                let tenant = await client_1.prisma.tenant.findFirst({
                    where: { domain: emailDomain },
                });
                if (!tenant) {
                    // For MVP, create a default tenant or use a configured default
                    tenant =
                        (await client_1.prisma.tenant.findFirst()) ||
                            (await client_1.prisma.tenant.create({
                                data: {
                                    name: "Default Tenant",
                                    applicationName: "Insight Studio",
                                    domain: emailDomain,
                                },
                            }));
                }
                // Update the user with our custom fields
                // Note: azureAdId is set in the signIn callback where account is available
                await client_1.prisma.user.update({
                    where: { email: user.email },
                    data: {
                        tenantId: tenant.id,
                        role: "family_member", // Default role
                        language: "en",
                    },
                });
            }
        },
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) {
                return false;
            }
            // Update azureAdId only for Azure AD accounts
            if (account && account.provider === "azure-ad") {
                await client_1.prisma.user.updateMany({
                    where: { email: user.email },
                    data: {
                        azureAdId: account.providerAccountId,
                    },
                });
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user?.email) {
                // Fetch user from database to get full user data
                const dbUser = await client_1.prisma.user.findUnique({
                    where: { email: session.user.email },
                    include: { tenant: true },
                });
                if (dbUser) {
                    session.user.id = dbUser.id;
                    session.user.tenantId = dbUser.tenantId;
                    session.user.role = dbUser.role;
                    session.user.language = dbUser.language;
                    session.user.generation = dbUser.generation;
                    session.user.sophisticationLevel =
                        dbUser.sophisticationLevel;
                    session.user.preferences = dbUser.preferences;
                    session.user.tenant = dbUser.tenant;
                }
            }
            return session;
        },
        async jwt({ token, account, user }) {
            if (account && user) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
//# sourceMappingURL=config.js.map