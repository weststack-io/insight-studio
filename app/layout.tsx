import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/branding/ThemeProvider";
import { getTenantById } from "@/lib/branding/theme";
import { headers } from "next/headers";
import { extractDomainFromHeaders } from "@/lib/branding/theme";
import { getTenantByDomain } from "@/lib/branding/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Insight Studio",
  description: "AI-powered personalized briefings & education hub",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect tenant from domain
  const headersList = await headers();
  const domain = extractDomainFromHeaders(headersList);
  const tenant = domain ? await getTenantByDomain(domain) : null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider tenant={tenant}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
