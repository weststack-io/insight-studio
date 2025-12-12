# Azure Infrastructure Deployment Guide

This guide explains how to deploy the Azure infrastructure for Insight Studio using Bicep templates, including:

- Azure SQL Database
- Azure Blob Storage
- Azure App Service (for Next.js front-end)
- Azure Function App (for weekly briefings)
- Application Insights

## Prerequisites

- Azure CLI installed and configured
- Azure subscription with appropriate permissions
- PowerShell or Bash terminal
- Azure resources already created:
  - Azure OpenAI service
  - Azure AI Search service (with index)
  - Azure AD / Microsoft Entra ID app registration

## Required Parameters

The Bicep template requires the following parameters:

### Required for all deployments:

- `sqlAdminUsername` - SQL Server administrator username
- `sqlAdminPassword` - SQL Server administrator password (secure parameter)
- `azureAdClientId` - Azure AD application client ID
- `azureAdClientSecret` - Azure AD application client secret (secure parameter)
- `azureAdTenantId` - Azure AD tenant ID
- `azureOpenAiEndpoint` - Azure OpenAI service endpoint URL
- `azureOpenAiApiKey` - Azure OpenAI API key (secure parameter)
- `azureSearchEndpoint` - Azure AI Search service endpoint URL
- `azureSearchApiKey` - Azure AI Search API key (secure parameter)
- `azureSearchIndexName` - Azure AI Search index name
- `nextAuthSecret` - NextAuth secret for session encryption (secure parameter)

### Optional parameters (with defaults):

- `location` - Azure region (defaults to resource group location)
- `sqlServerName` - SQL Server name (auto-generated if not provided)
- `sqlDatabaseName` - SQL Database name (default: `sqldb-insightstudio`)
- `storageAccountName` - Blob storage account name (auto-generated if not provided)
- `functionAppName` - Function App name (auto-generated if not provided)
- `azureOpenAiDeploymentName` - OpenAI deployment name (default: `gpt-4`)
- `addeparApiUrl` - Addepar API URL (default: `https://api.addepar.com`)
- `addeparClientId` - Addepar client ID (optional, default: empty)
- `addeparClientSecret` - Addepar client secret (optional, default: empty)
- `addeparFirm` - Addepar Firm (optional, default: empty)
- `nextAuthUrl` - NextAuth URL (default: `http://localhost:3000`)
- `nodeVersion` - Node.js version for Function App (default: `~20`)

## Deployment Options

### Option 1: Deploy Everything (Full Infrastructure)

Deploy all resources including SQL Database, Blob Storage, and Function App.

### Option 2: Deploy Function App Only

If you've already deployed the SQL Database and Blob Storage, you can deploy just the Function App infrastructure using the separate template.

**See [Deploy Function App Only](#deploy-function-app-only) section below.**

## Quick Start

### 1. Login to Azure

```bash
az login
```

### 2. Set your subscription (if you have multiple)

```bash
az account list --output table
az account set --subscription "Your Subscription Name or ID"
```

### 3. Create a Resource Group

```bash
az group create \
  --name rg-insightstudio \
  --location eastus2
```

### 4. Deploy Infrastructure

#### Option A: Using PowerShell Script (Simplest - Recommended for Basic Deployment)

The `deploy.ps1` script provides the easiest way to deploy SQL Database and Blob Storage. It handles Azure login, resource group creation, and deployment automatically.

**Basic deployment (SQL and Storage only):**

```powershell
cd infrastructure

.\deploy.ps1 `
  -ResourceGroupName "rg-insightstudio" `
  -Location "eastus2" `
  -SqlAdminUsername "insightstudioadmin" `
  -SqlAdminPassword (ConvertTo-SecureString "YourSecurePassword123!" -AsPlainText -Force) `
  -SaveOutputs
```

**Full deployment (including App Service with all parameters):**

```powershell
cd infrastructure

.\deploy.ps1 `
  -ResourceGroupName "rg-insightstudio-prod" `
  -Location "eastus2" `
  -SqlAdminUsername "sqladmin" `
  -SqlAdminPassword (ConvertTo-SecureString -String "YourSecureSqlPassword123!" -AsPlainText -Force) `
  -AzureAdClientId "12345678-1234-1234-1234-123456789012" `
  -AzureAdClientSecret (ConvertTo-SecureString -String "YourAzureAdClientSecret" -AsPlainText -Force) `
  -AzureAdTenantId "87654321-4321-4321-4321-210987654321" `
  -AzureOpenAiEndpoint "https://your-openai-resource.openai.azure.com/" `
  -AzureOpenAiApiKey (ConvertTo-SecureString -String "YourOpenAiApiKey" -AsPlainText -Force) `
  -AzureOpenAiDeploymentName "gpt-4" `
  -AzureSearchEndpoint "https://your-search-service.search.windows.net" `
  -AzureSearchApiKey (ConvertTo-SecureString -String "YourSearchApiKey" -AsPlainText -Force) `
  -AzureSearchIndexName "insightstudio-index" `
  -NextAuthSecret (ConvertTo-SecureString -String "YourNextAuthSecretKeyHere" -AsPlainText -Force) `
  -AddeparApiUrl "https://api.addepar.com" `
  -AddeparClientId "your-addepar-client-id" `
  -AddeparClientSecret (ConvertTo-SecureString -String "YourAddeparClientSecret" -AsPlainText -Force) `
  -AddeparFirm "your-firm-name" `
  -AppServicePlanSku "S1" `
  -AppServicePlanSkuName "S1" `
  -SaveOutputs
```

**Note:** Replace all placeholder values with your actual values. For production deployments, consider using the interactive version (see below) or Azure Key Vault to avoid exposing secrets in command history.

**Interactive version (prompts for secrets securely):**

If you prefer not to have secrets in your command history, you can use this interactive approach:

```powershell
cd infrastructure

# Prompt for secrets securely
$sqlPassword = Read-Host "Enter SQL Admin Password" -AsSecureString
$azureAdSecret = Read-Host "Enter Azure AD Client Secret" -AsSecureString
$openAiKey = Read-Host "Enter Azure OpenAI API Key" -AsSecureString
$searchKey = Read-Host "Enter Azure Search API Key" -AsSecureString
$nextAuthSecret = Read-Host "Enter NextAuth Secret" -AsSecureString
$addeparSecret = Read-Host "Enter Addepar Client Secret" -AsSecureString

.\deploy.ps1 `
  -ResourceGroupName "rg-insightstudio-prod" `
  -Location "eastus2" `
  -SqlAdminUsername "sqladmin" `
  -SqlAdminPassword $sqlPassword `
  -AzureAdClientId "12345678-1234-1234-1234-123456789012" `
  -AzureAdClientSecret $azureAdSecret `
  -AzureAdTenantId "87654321-4321-4321-4321-210987654321" `
  -AzureOpenAiEndpoint "https://your-openai-resource.openai.azure.com/" `
  -AzureOpenAiApiKey $openAiKey `
  -AzureOpenAiDeploymentName "gpt-4" `
  -AzureSearchEndpoint "https://your-search-service.search.windows.net" `
  -AzureSearchApiKey $searchKey `
  -AzureSearchIndexName "insightstudio-index" `
  -NextAuthSecret $nextAuthSecret `
  -AddeparApiUrl "https://api.addepar.com" `
  -AddeparClientId "your-addepar-client-id" `
  -AddeparClientSecret $addeparSecret `
  -AddeparFirm "your-firm-name" `
  -AppServicePlanSku "S1" `
  -AppServicePlanSkuName "S1" `
  -SaveOutputs
```

**What the script does:**

- Checks if Azure CLI is installed
- Logs you in to Azure (if not already logged in)
- Creates the resource group if it doesn't exist
- Deploys SQL Database and Blob Storage (basic mode)
- Deploys App Service, App Service Plan, and Application Insights (full mode with all parameters)
- Displays connection strings (both Azure format and Prisma format)
- Displays App Service URL (if deployed)
- Optionally saves outputs to `deployment-outputs.json` (with `-SaveOutputs` flag)

**Parameters:**

**Required for all deployments:**

- `-ResourceGroupName` - Name of the resource group (default: `rg-insightstudio`)
- `-Location` - Azure region (default: `eastus2`)
- `-SqlAdminUsername` - SQL Server administrator username (required)
- `-SqlAdminPassword` - SQL Server administrator password as SecureString (required)

**Required for full deployment (App Service):**

- `-AzureAdClientId` - Azure AD application client ID
- `-AzureAdClientSecret` - Azure AD application client secret as SecureString
- `-AzureAdTenantId` - Azure AD tenant ID
- `-AzureOpenAiEndpoint` - Azure OpenAI service endpoint URL
- `-AzureOpenAiApiKey` - Azure OpenAI API key as SecureString
- `-AzureSearchEndpoint` - Azure AI Search service endpoint URL
- `-AzureSearchApiKey` - Azure AI Search API key as SecureString
- `-AzureSearchIndexName` - Azure AI Search index name
- `-NextAuthSecret` - NextAuth secret for session encryption as SecureString

**Optional parameters:**

- `-AzureOpenAiDeploymentName` - OpenAI deployment name (default: `gpt-4`)
- `-AddeparApiUrl` - Addepar API URL (default: `https://api.addepar.com`)
- `-AddeparClientId` - Addepar client ID (optional)
- `-AddeparClientSecret` - Addepar client secret as SecureString (optional)
- `-AddeparFirm` - Addepar Firm (optional)
- `-AppServicePlanSku` - App Service Plan SKU tier (default: `B1`). Options: `B1`, `B2`, `B3`, `S1`, `S2`, `S3`, `P1V2`, `P2V2`, `P3V2`
- `-SaveOutputs` - Optional flag to save deployment outputs to JSON file

**Example with custom resource group and location (basic):**

```powershell
.\deploy.ps1 `
  -ResourceGroupName "rg-insightstudio-dev" `
  -Location "westus2" `
  -SqlAdminUsername "admin" `
  -SqlAdminPassword (ConvertTo-SecureString "MySecurePass123!" -AsPlainText -Force)
```

**Note:**

- If you provide only SQL/Storage parameters, only those resources will be deployed (basic mode)
- If you provide all required parameters (Azure AD, OpenAI, AI Search, NextAuth), the App Service will also be deployed (full mode)
- To deploy the Function App, see the [Deploy Function App Only](#deploy-function-app-only) section below

#### Option B: Using Azure CLI with Bicep file

**Basic deployment (SQL and Storage only):**

```bash
az deployment group create \
  --resource-group rg-insightstudio \
  --template-file infrastructure/main.bicep \
  --parameters sqlAdminUsername=insightstudioadmin \
               sqlAdminPassword="YourSecurePassword123!" \
               location=eastus2 \
               azureAdClientId="your-client-id" \
               azureAdClientSecret="your-client-secret" \
               azureAdTenantId="your-tenant-id" \
               azureOpenAiEndpoint="https://your-resource.openai.azure.com" \
               azureOpenAiApiKey="your-api-key" \
               azureSearchEndpoint="https://your-search-service.search.windows.net" \
               azureSearchApiKey="your-search-api-key" \
               azureSearchIndexName="your-index-name" \
               nextAuthSecret="generate-a-random-secret-here"
```

**Note:** For production deployments, consider using Azure Key Vault references for sensitive parameters instead of passing them directly.

#### Option C: Using parameters file

1. Edit `infrastructure/azuredeploy.parameters.json` and set your SQL admin password:

```json
{
  "sqlAdminPassword": {
    "value": "YourSecurePassword123!"
  }
}
```

2. Deploy using the parameters file:

```bash
az deployment group create \
  --resource-group rg-insightstudio \
  --template-file infrastructure/main.bicep \
  --parameters @infrastructure/azuredeploy.parameters.json
```

### 5. Get Output Values

After deployment, retrieve the connection strings:

```bash
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs \
  --output json
```

Or get individual outputs:

```bash
# SQL Connection String
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.sqlConnectionString.value \
  --output tsv

# Storage Connection String
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.storageConnectionString.value \
  --output tsv

# Function App Name
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.functionAppName.value \
  --output tsv

# App Service Name
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.appServiceName.value \
  --output tsv

# App Service URL
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.appServiceUrl.value \
  --output tsv

# Function App URL
az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.functionAppUrl.value \
  --output tsv
```

## What Gets Deployed

### Basic Deployment (SQL Database and Blob Storage Only)

When using `deploy.ps1` with only SQL/Storage parameters, the following resources are created:

#### Azure SQL Database

- **SQL Server**: A logical server that hosts the database
- **SQL Database**: A Basic tier database (2 GB, suitable for MVP)
- **Firewall Rules**:
  - Allow Azure Services (for Azure Functions, App Services, etc.)
  - Allow Client IP (placeholder - configure this for your development environment)

#### Azure Blob Storage

- **Storage Account**: Standard LRS storage account
- **Blob Container**: A private container named `insightstudio-content` for storing generated content

### Full Deployment (Including App Service and Function App)

When deploying with all parameters (including Azure AD, OpenAI, AI Search, etc.), the following additional resources are created:

#### Azure App Service (Next.js Front-End)

- **App Service**: Linux-based App Service running Node.js 20 for hosting the Next.js front-end
- **App Service Plan**: Standard B1 tier (1 core, 1.75 GB RAM) - can be upgraded to higher tiers
- **Application Insights**: Monitoring and logging for the App Service
- **Configuration**: All environment variables pre-configured for:
  - Database connectivity
  - Azure OpenAI integration
  - Azure AI Search integration
  - Azure AD authentication
  - Addepar API (optional)
  - NextAuth configuration with automatic URL detection

The App Service is configured to:

- Run on port 8080 (Azure App Service default)
- Enable HTTPS only
- Support Node.js 20
- Enable Application Insights monitoring
- Automatically set `NEXTAUTH_URL` to the App Service URL

**Note:** After deployment, you need to:

1. Build your Next.js application (`npm run build`)
2. Deploy the built application to the App Service
3. Update your Azure AD app registration redirect URI to include the App Service URL

### Full Deployment (Including Function App)

When deploying with all parameters (including Azure AD, OpenAI, AI Search, etc.), the following additional resources are created:

#### Azure Function App

- **Function App**: Linux-based Function App running Node.js 20
- **App Service Plan**: Consumption plan (Y1) - pay-per-execution model
- **Storage Account**: Separate storage account for Function App runtime (required for triggers and logging)
- **Application Insights**: Monitoring and logging for the Function App
- **Configuration**: All environment variables pre-configured for:
  - Database connectivity
  - Azure OpenAI integration
  - Azure AI Search integration
  - Azure AD authentication
  - Addepar API (optional)
  - NextAuth configuration

The Function App is configured to run the weekly briefings generator on a timer trigger (every Monday at 9 AM).

**Note:** The `deploy.ps1` script only deploys SQL Database and Blob Storage. To deploy the Function App, use the [Deploy Function App Only](#deploy-function-app-only) section or deploy with all parameters using Option B or C above.

## Configuration

### SQL Database Tier

The default deployment uses **Basic tier** (2 GB, ~$5/month). To change the tier, modify the `sku` section in `main.bicep`:

```bicep
sku: {
  name: 'S0'  // Standard tier
  tier: 'Standard'
  capacity: 10
}
```

Available tiers:

- **Basic**: 2 GB, ~$5/month
- **S0**: 250 GB, ~$15/month
- **S1**: 250 GB, ~$30/month
- **S2**: 250 GB, ~$75/month

### Storage Account Type

The default uses **Standard LRS**. To change, modify the `sku` section:

```bicep
sku: {
  name: 'Standard_GRS'  // Geo-redundant storage
}
```

### App Service Plan Tier

The default App Service Plan uses **B1 tier** (1 core, 1.75 GB RAM, ~$13/month). To change the tier, modify the `appServicePlanSku` and `appServicePlanSkuName` parameters:

**Basic Tier (B1, B2, B3):**

- B1: 1 core, 1.75 GB RAM, ~$13/month
- B2: 2 cores, 3.5 GB RAM, ~$26/month
- B3: 4 cores, 7 GB RAM, ~$52/month

**Standard Tier (S1, S2, S3):**

- S1: 1 core, 1.75 GB RAM, ~$75/month (includes auto-scaling, staging slots)
- S2: 2 cores, 3.5 GB RAM, ~$150/month
- S3: 4 cores, 7 GB RAM, ~$300/month

**Premium V2 Tier (P1V2, P2V2, P3V2):**

- P1V2: 1 core, 3.5 GB RAM, ~$146/month (includes auto-scaling, staging slots, better performance)
- P2V2: 2 cores, 7 GB RAM, ~$292/month
- P3V2: 4 cores, 14 GB RAM, ~$584/month

**Example with Standard S1 tier:**

```powershell
.\deploy.ps1 `
  -ResourceGroupName "rg-insightstudio" `
  -Location "eastus2" `
  -SqlAdminUsername "insightstudioadmin" `
  -SqlAdminPassword (ConvertTo-SecureString "YourSecurePassword123!" -AsPlainText -Force) `
  -AppServicePlanSku "S1" `
  -AppServicePlanSkuName "S1" `
  # ... other parameters
```

Or modify the Bicep template directly:

```bicep
@description('App Service Plan SKU tier')
param appServicePlanSku string = 'S1'

@description('App Service Plan SKU name')
param appServicePlanSkuName string = 'S1'
```

## Security Considerations

### SQL Server

1. **Firewall Rules**: The template includes a placeholder rule that allows all IPs. **You should update this** to only allow your specific IP addresses:

```bash
az sql server firewall-rule create \
  --resource-group rg-insightstudio \
  --server sql-insightstudio-xxxxx \
  --name AllowMyIP \
  --start-ip-address YOUR_IP_ADDRESS \
  --end-ip-address YOUR_IP_ADDRESS
```

2. **Password**: Use a strong password for the SQL admin account. Consider using Azure Key Vault for password management.

3. **TLS**: The template enforces TLS 1.2 minimum.

### Storage Account

1. **Public Access**: Blob public access is disabled by default.
2. **HTTPS Only**: Only HTTPS traffic is allowed.
3. **TLS**: Minimum TLS version is set to 1.2.

## Updating Firewall Rules

### Add Your Development IP

```bash
# Get your current IP
MY_IP=$(curl -s https://api.ipify.org)

# Add firewall rule
az sql server firewall-rule create \
  --resource-group rg-insightstudio \
  --server sql-insightstudio-xxxxx \
  --name AllowMyDevIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Allow Azure Services

The template already includes a rule to allow Azure services. This is required for:

- Azure Functions
- Azure App Services
- Azure Logic Apps
- Other Azure services

## Environment Variables

After deployment, update your `.env` file with the connection strings:

**Important:** Prisma requires the connection string in URL format (`sqlserver://`), not the Azure-style format.

### Option 1: Use Prisma Connection String (Recommended)

The Bicep template now outputs a Prisma-compatible connection string:

```bash
# Get Prisma SQL connection string
SQL_CONN=$(az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.sqlConnectionStringPrisma.value \
  --output tsv)

# Get Storage connection string
STORAGE_CONN=$(az deployment group show \
  --resource-group rg-insightstudio \
  --name main \
  --query properties.outputs.storageConnectionString.value \
  --output tsv)

# Add to .env file
echo "AZURE_SQL_CONNECTION_STRING=$SQL_CONN" >> .env
echo "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONN" >> .env
```

### Option 2: Convert Azure Connection String

If you have the Azure-style connection string, use the conversion script:

**PowerShell:**

```powershell
.\infrastructure\convert-connection-string.ps1 "Server=tcp:..."
```

**Bash:**

```bash
./infrastructure/convert-connection-string.sh "Server=tcp:..."
```

The Prisma connection string format (using semicolon-separated parameters):

```
sqlserver://server:1433;database=dbname;user=username;password=password;encrypt=true;trustServerCertificate=false
```

**Note:** If your password contains special characters (`:\=;/[]{}`), wrap the password value in curly braces: `password={Your:Password;Here}`

## Troubleshooting

### Deployment Fails

1. **Check resource name availability**: SQL server names must be globally unique. The template uses `uniqueString()` to ensure uniqueness, but you can customize the name.

2. **Check permissions**: Ensure you have Contributor or Owner role on the resource group.

3. **Check quota**: Verify you haven't exceeded subscription quotas for SQL databases or storage accounts.

### Connection Issues

1. **Firewall**: Ensure your IP is allowed in the SQL firewall rules.

2. **Connection String**: Verify the connection string format and credentials.

3. **Network**: If using Azure services, ensure "Allow Azure Services" firewall rule is enabled.

## Cleanup

To remove all resources:

```bash
az group delete --name rg-insightstudio --yes --no-wait
```

## Deploy Function App Only

If you've already deployed the SQL Database and Blob Storage infrastructure, you can deploy just the Function App using the separate template and deployment scripts.

### Prerequisites

Before deploying the Function App, you need:

- Existing SQL Database and Blob Storage (from the main deployment)
- SQL connection string
- Storage connection string
- All the Azure service credentials (OpenAI, AI Search, Azure AD, etc.)

### Get Connection Strings from Existing Deployment

First, retrieve the connection strings from your existing deployment:

```bash
# Get SQL connection string
SQL_CONN=$(az deployment group show \
  --resource-group rg-insightstudio \
  --name <your-deployment-name> \
  --query properties.outputs.sqlConnectionString.value \
  --output tsv)

# Get Storage connection string
STORAGE_CONN=$(az deployment group show \
  --resource-group rg-insightstudio \
  --name <your-deployment-name> \
  --query properties.outputs.storageConnectionString.value \
  --output tsv)
```

### Deploy Using PowerShell

```powershell
cd infrastructure

.\deploy-function-app.ps1 `
  -ResourceGroupName "rg-insightstudio" `
  -AzureSqlConnectionString $SQL_CONN `
  -AzureStorageConnectionString $STORAGE_CONN `
  -AzureAdClientId "your-client-id" `
  -AzureAdClientSecret (ConvertTo-SecureString "your-client-secret" -AsPlainText -Force) `
  -AzureAdTenantId "your-tenant-id" `
  -AzureOpenAiEndpoint "https://your-resource.openai.azure.com" `
  -AzureOpenAiApiKey (ConvertTo-SecureString "your-api-key" -AsPlainText -Force) `
  -AzureSearchEndpoint "https://your-search-service.search.windows.net" `
  -AzureSearchApiKey (ConvertTo-SecureString "your-search-api-key" -AsPlainText -Force) `
  -AzureSearchIndexName "your-index-name" `
  -NextAuthSecret (ConvertTo-SecureString "your-nextauth-secret" -AsPlainText -Force)
```

### Deploy Using Bash

```bash
cd infrastructure
chmod +x deploy-function-app.sh

./deploy-function-app.sh \
  --resource-group rg-insightstudio \
  --sql-connection-string "$SQL_CONN" \
  --storage-connection-string "$STORAGE_CONN" \
  --azure-ad-client-id "your-client-id" \
  --azure-ad-client-secret "your-client-secret" \
  --azure-ad-tenant-id "your-tenant-id" \
  --azure-openai-endpoint "https://your-resource.openai.azure.com" \
  --azure-openai-api-key "your-api-key" \
  --azure-search-endpoint "https://your-search-service.search.windows.net" \
  --azure-search-api-key "your-search-api-key" \
  --azure-search-index-name "your-index-name" \
  --next-auth-secret "your-nextauth-secret"
```

### Deploy Using Azure CLI Directly

```bash
az deployment group create \
  --resource-group rg-insightstudio \
  --template-file infrastructure/function-app.bicep \
  --parameters \
    azureSqlConnectionString="Server=tcp:..." \
    azureStorageConnectionString="DefaultEndpointsProtocol=https;..." \
    azureAdClientId="your-client-id" \
    azureAdClientSecret="your-client-secret" \
    azureAdTenantId="your-tenant-id" \
    azureOpenAiEndpoint="https://your-resource.openai.azure.com" \
    azureOpenAiApiKey="your-api-key" \
    azureSearchEndpoint="https://your-search-service.search.windows.net" \
    azureSearchApiKey="your-search-api-key" \
    azureSearchIndexName="your-index-name" \
    nextAuthSecret="your-nextauth-secret"
```

## Deploying the Function Code

After the infrastructure is deployed, you need to deploy the Function App code:

1. **Install Azure Functions Core Tools** (if not already installed):

   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. **Build the function code**:

   ```bash
   # Build TypeScript for Azure Functions
   cd azure-functions
   npm install
   npm run build
   cd ..
   ```

3. **Deploy the function**:

   **Option A: Use deployment script (Recommended - Easiest)**

   The deployment scripts automatically handle copying compiled files to the correct locations:

   **PowerShell (Windows):**

   ```powershell
   cd azure-functions
   .\deploy.ps1 -FunctionAppName <function-app-name>
   ```

   **Bash (Linux/Mac):**

   ```bash
   cd azure-functions
   chmod +x deploy.sh
   ./deploy.sh <function-app-name>
   ```

   **Option B: Manual deployment with pre-compiled JavaScript**

   ```bash
   # From project root where host.json is located
   func azure functionapp publish <function-app-name> --javascript
   ```

   **Note:** With Option B, you need to ensure the compiled `lib/` files are accessible. The compiled files are in `azure-functions/dist/lib/`, but Azure Functions expects them relative to the function code. You may need to copy them manually or use the deployment script.

   **Option C: Deploy TypeScript for remote build**

   ```bash
   # From project root where host.json is located
   func azure functionapp publish <function-app-name> --typescript --build remote
   ```

   Replace `<function-app-name>` with the value from the deployment output (`functionAppName`).

   **Important Notes:**

   - **Option A (Recommended)**: The deployment scripts automatically build the code, copy compiled `lib/` and `types/` files to the correct locations, and deploy everything. This ensures all dependencies are included.
   - **Option B**: Manual deployment. You must ensure compiled `lib/` files are accessible. The compiled output structure is `dist/azure-functions/weekly-briefings/index.js` with imports like `../../lib/ai/generators` that resolve to `dist/lib/ai/generators.js`.
   - **Option C**: Azure will compile TypeScript remotely. All TypeScript source files (including `lib/**/*.ts`) must be included in the deployment package. The root-level `.funcignore` has been configured to allow TypeScript files. Azure will need a `tsconfig.json` that can compile the entire project structure.
   - The function code imports from `../../lib/ai/generators`, so the compiled `lib/` files must be available at runtime for the relative imports to resolve correctly.

## Deploying the Next.js Application to App Service

After the App Service infrastructure is deployed, you need to deploy your Next.js application code:

### Option 1: Deploy using Azure CLI (Recommended)

1. **Build your Next.js application:**

   ```bash
   npm install
   npm run build
   ```

2. **Create a deployment package:**

   ```bash
   # Create a zip file with the necessary files
   # Include: .next, public, package.json, node_modules, and other required files
   zip -r deploy.zip .next public package.json package-lock.json node_modules
   ```

   Or on Windows PowerShell:

   ```powershell
   Compress-Archive -Path .next,public,package.json,package-lock.json,node_modules -DestinationPath deploy.zip
   ```

3. **Deploy to App Service:**

   ```bash
   az webapp deployment source config-zip \
     --resource-group rg-insightstudio \
     --name <app-service-name> \
     --src deploy.zip
   ```

   Replace `<app-service-name>` with the value from the deployment output (`appServiceName`).

### Option 2: Deploy using VS Code Azure Extension

1. Install the "Azure App Service" extension in VS Code
2. Right-click on your project folder
3. Select "Deploy to Web App..."
4. Choose your subscription, resource group, and App Service
5. Follow the prompts to deploy

### Option 3: Deploy using GitHub Actions or Azure DevOps

Set up CI/CD pipelines to automatically deploy on push to your repository.

### Important Notes

- The App Service is configured to run on port 8080 (Azure default)
- Make sure your `next.config.js` or `package.json` scripts are configured correctly
- The `NEXTAUTH_URL` environment variable is automatically set to the App Service URL
- Update your Azure AD app registration to include the App Service URL as a redirect URI:
  - Go to Azure Portal → Azure AD → App registrations → Your app
  - Add redirect URI: `https://<your-app-service-url>/api/auth/callback/azure-ad`

## Next Steps

1. Run Prisma migrations:

   ```bash
   npm run db:push
   ```

2. Create a default tenant in the database (see SETUP.md)

3. Configure your application with the connection strings

4. Test the connection to both SQL Database and Blob Storage

5. Deploy the Next.js application to App Service (see above)

6. Update Azure AD app registration redirect URIs

7. Deploy the Function App code (see above)

8. Verify the App Service is running by visiting the App Service URL

9. Verify the Function App is running by checking Application Insights or the Function App logs in Azure Portal

## Additional Resources

- [Azure SQL Database Documentation](https://docs.microsoft.com/azure/azure-sql/)
- [Azure Blob Storage Documentation](https://docs.microsoft.com/azure/storage/blobs/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
