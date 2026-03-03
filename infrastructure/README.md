# Infrastructure as Code

This directory contains Bicep templates for deploying Azure infrastructure for Insight Studio.

## Files

- `main.bicep` - Main Bicep template that deploys:
  - Azure SQL Database (server and database)
  - Azure Blob Storage (storage account and container)
  - Azure App Service (Next.js front-end) - when full parameters are provided
  - Azure App Service Plan
  - Application Insights
- `azuredeploy.parameters.json` - Parameter file template
- `DEPLOY.md` - Detailed deployment instructions

## Quick Deploy

```bash
# Create resource group
az group create --name rg-insightstudio --location eastus2

# Deploy infrastructure
az deployment group create \
  --resource-group rg-insightstudio \
  --template-file main.bicep \
  --parameters sqlAdminUsername=insightstudioadmin \
               sqlAdminPassword="Welcome2InsightStudio!"
```

## Outputs

The deployment outputs:

- SQL server name
- SQL database name
- SQL connection string (Azure format and Prisma format)
- Storage account name
- Storage connection string
- Blob container name
- App Service name (if deployed)
- App Service URL (if deployed)
- App Service Plan name (if deployed)
- Application Insights name and instrumentation key

Use these values to configure your application's environment variables.

## Deployment Modes

### Basic Deployment

Deploys only SQL Database and Blob Storage. Use this for initial setup or when you don't need the App Service yet.

### Full Deployment

Deploys SQL Database, Blob Storage, and App Service with all required environment variables configured. Requires Azure AD, OpenAI, AI Search, and NextAuth credentials.

See `DEPLOY.md` for detailed instructions on both deployment modes.
