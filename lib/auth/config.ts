import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import OktaProvider from "next-auth/providers/okta";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";

const providers: NextAuthOptions["providers"] = [
  AzureADProvider({
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    tenantId: process.env.AZURE_AD_TENANT_ID!,
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
        OktaProvider({
          clientId: process.env.OKTA_CLIENT_ID,
          clientSecret: process.env.OKTA_CLIENT_SECRET,
          issuer: process.env.OKTA_ISSUER,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
];

// E2E testing: add a credentials provider that allows login by email
// against existing database users — no OAuth redirect needed.
if (process.env.E2E_TESTING === "true") {
  providers.push(
    CredentialsProvider({
      id: "e2e-credentials",
      name: "E2E Test Login",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        });

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  // The Prisma adapter is skipped for credentials provider (JWT-only),
  // but kept for OAuth providers that need Account/Session persistence.
  adapter: PrismaAdapter(prisma),
  providers,
  events: {
    async createUser({ user }) {
      // After the adapter creates the user, set our custom fields
      if (user.email) {
        const emailDomain = user.email.split("@")[1];

        // Find or create tenant based on domain
        let tenant = await prisma.tenant.findFirst({
          where: { domain: emailDomain },
        });

        if (!tenant) {
          // For MVP, create a default tenant or use a configured default
          tenant =
            (await prisma.tenant.findFirst()) ||
            (await prisma.tenant.create({
              data: {
                name: "Default Tenant",
                applicationName: "Insight Studio",
                domain: emailDomain,
              },
            }));
        }

        // Update the user with our custom fields
        // Note: azureAdId is set in the signIn callback where account is available
        await prisma.user.update({
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
        await prisma.user.updateMany({
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
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { tenant: true },
        });

        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).tenantId = dbUser.tenantId;
          (session.user as any).role = dbUser.role;
          (session.user as any).language = dbUser.language;
          (session.user as any).generation = dbUser.generation;
          (session.user as any).sophisticationLevel =
            dbUser.sophisticationLevel;
          (session.user as any).preferences = dbUser.preferences;
          (session.user as any).tenant = dbUser.tenant;
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
