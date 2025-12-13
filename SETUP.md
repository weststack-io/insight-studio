# Insight Studio Setup Guide

## Prerequisites

- Node.js 18+ installed
- Azure account with:
  - Azure SQL Database
  - Azure OpenAI service
  - Azure AI Search (with existing index)
  - Azure Blob Storage
  - Azure AD / Microsoft Entra ID app registration
- Addepar API credentials (optional, for portfolio data)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following variables:

```
# Azure AD / Microsoft Entra ID
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Okta (optional - for Okta sign-in)
OKTA_CLIENT_ID=your-okta-client-id
OKTA_CLIENT_SECRET=your-okta-client-secret
OKTA_ISSUER=https://your-domain.okta.com/oauth2/default

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-search-api-key
AZURE_SEARCH_INDEX_NAME=your-index-name

# Azure SQL Database
AZURE_SQL_CONNECTION_STRING=Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-db;Persist Security Info=False;User ID=your-user;Password=your-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net

# Addepar API
ADDEPAR_API_URL=https://api.addepar.com
ADDEPAR_CLIENT_ID=your-client-id
ADDEPAR_CLIENT_SECRET=your-client-secret
ADDEPAR_FIRM=your-firm-id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here
```

3. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

4. Create a default tenant (optional):
You can create a default tenant via Prisma Studio or directly in the database:
```sql
INSERT INTO tenants (id, name, primary_color, secondary_color, created_at, updated_at)
VALUES (NEWID(), 'Pathstone', '#000000', '#666666', GETDATE(), GETDATE());
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Sign in with Azure AD credentials

## Azure Function Setup

The weekly briefings Azure Function is located in `azure-functions/weekly-briefings/`.

To deploy:
1. Install Azure Functions Core Tools
2. Navigate to the function directory
3. Deploy using `func azure functionapp publish <your-function-app-name>`

The function is configured to run every Monday at 9 AM (cron: `0 0 9 * * 1`).

## Features

- **Authentication**: Azure AD / Microsoft Entra ID integration
- **Weekly Briefings**: Automated market and portfolio briefings
- **Topic Explainers**: On-demand explanations of complex topics with enhanced markdown rendering
- **Micro-Lessons**: Short educational content tailored by generation and language with enhanced markdown rendering
- **Personalization**: Content tailored based on portfolio, preferences, and demographics
- **White-Label Branding**: Configurable branding per tenant
- **Content Rendering**: Enhanced markdown rendering using react-markdown with GitHub Flavored Markdown support

## Project Structure

```
InsightStudio/
├── app/                    # Next.js App Router pages
├── lib/                    # Core libraries and utilities
├── components/            # React components
├── azure-functions/       # Azure Functions for scheduled jobs
├── prisma/                # Database schema
└── types/                 # TypeScript type definitions
```

## Next Steps

1. Configure Azure AD app registration with proper redirect URIs
2. Set up Azure SQL Database and run migrations
3. Configure Azure AI Search index with your knowledge base
4. Set up Addepar API integration (if using portfolio data)
5. Deploy Azure Function for weekly briefing generation
6. Customize branding for your tenant

