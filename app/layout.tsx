import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Default metadata - individual pages can override with tenant-specific values
export const metadata: Metadata = {
  title: "Insight Studio",
  description: "AI-powered personalized briefings & education hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
