/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: "standalone",
  env: {
    AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
    AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
  },
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/.prisma/**/*'],
  },
};

module.exports = nextConfig;
