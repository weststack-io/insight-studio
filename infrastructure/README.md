# Infrastructure as Code

This directory contains Bicep templates for deploying Azure infrastructure for Insight Studio.

## Files

- `main.bicep` - Main Bicep template that deploys:
  - Azure SQL Database (server and database)
  - Azure Blob Storage (storage account and container)
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
               sqlAdminPassword="YourSecurePassword123!"
```

## Outputs

The deployment outputs:

- SQL server name
- SQL database name
- SQL connection string
- Storage account name
- Storage connection string
- Blob container name

Use these values to configure your application's environment variables.
