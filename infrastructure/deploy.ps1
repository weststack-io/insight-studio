# Insight Studio Infrastructure Deployment Script
# This script deploys Azure SQL Database, Blob Storage, and App Service using Bicep

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName = "rg-insightstudio",
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "eastus2",
    
    [Parameter(Mandatory = $true)]
    [string]$SqlAdminUsername,
    
    [Parameter(Mandatory = $true)]
    [SecureString]$SqlAdminPassword,
    
    # Optional parameters for full deployment (App Service)
    [Parameter(Mandatory = $false)]
    [string]$AzureAdClientId,
    
    [Parameter(Mandatory = $false)]
    [SecureString]$AzureAdClientSecret,
    
    [Parameter(Mandatory = $false)]
    [string]$AzureAdTenantId,
    
    [Parameter(Mandatory = $false)]
    [string]$AzureOpenAiEndpoint,
    
    [Parameter(Mandatory = $false)]
    [SecureString]$AzureOpenAiApiKey,
    
    [Parameter(Mandatory = $false)]
    [string]$AzureOpenAiDeploymentName = "gpt-5-mini",
    
    [Parameter(Mandatory = $false)]
    [string]$AzureSearchEndpoint,
    
    [Parameter(Mandatory = $false)]
    [SecureString]$AzureSearchApiKey,
    
    [Parameter(Mandatory = $false)]
    [string]$AzureSearchIndexName,
    
    [Parameter(Mandatory = $false)]
    [SecureString]$NextAuthSecret,
    
    [Parameter(Mandatory = $false)]
    [string]$AddeparApiUrl = "https://api.addepar.com",
    
    [Parameter(Mandatory = $false)]
    [string]$AddeparClientId = "",
    
    [Parameter(Mandatory = $false)]
    [SecureString]$AddeparClientSecret,
    
    [Parameter(Mandatory = $false)]
    [string]$AddeparFirm = "",
    
    [Parameter(Mandatory = $false)]
    [string]$AppServicePlanSku = "B1",

    [Parameter(Mandatory = $false)]
    [string]$AppServicePlanSkuName = "B1",
    
    [Parameter(Mandatory = $false)]
    [switch]$SaveOutputs
)

# Convert SecureString to plain text for Bicep parameters
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Check if full deployment parameters are provided
$FullDeployment = $AzureAdClientId -and $AzureAdClientSecret -and $AzureAdTenantId -and `
    $AzureOpenAiEndpoint -and $AzureOpenAiApiKey -and `
    $AzureSearchEndpoint -and $AzureSearchApiKey -and $AzureSearchIndexName -and `
    $NextAuthSecret

if ($FullDeployment) {
    Write-Host "Full deployment mode: Will deploy SQL, Storage, and App Service" -ForegroundColor Cyan
    # Convert other SecureStrings
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AzureAdClientSecret)
    $PlainAzureAdClientSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AzureOpenAiApiKey)
    $PlainAzureOpenAiApiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AzureSearchApiKey)
    $PlainAzureSearchApiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($NextAuthSecret)
    $PlainNextAuthSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $PlainAddeparClientSecret = ""
    if ($AddeparClientSecret) {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AddeparClientSecret)
        $PlainAddeparClientSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
}
else {
    Write-Host "Basic deployment mode: Will deploy SQL and Storage only" -ForegroundColor Yellow
    Write-Host "To deploy App Service, provide all required parameters (Azure AD, OpenAI, AI Search, NextAuth)" -ForegroundColor Yellow
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Insight Studio Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Please install Azure CLI from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$null = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Azure. Logging in..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to login to Azure." -ForegroundColor Red
        exit 1
    }
}

# Register required resource providers
Write-Host "Registering required resource providers..." -ForegroundColor Yellow
$providers = @(
    "Microsoft.Sql",
    "Microsoft.Storage",
    "Microsoft.Web",
    "Microsoft.Insights",
    "Microsoft.OperationalInsights"
)

foreach ($provider in $providers) {
    Write-Host "  Checking provider: $provider" -ForegroundColor Gray
    $providerState = az provider show --namespace $provider --query "registrationState" --output tsv 2>$null
    if ($providerState -ne "Registered") {
        Write-Host "  Registering provider: $provider" -ForegroundColor Yellow
        az provider register --namespace $provider --wait
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Warning: Failed to register provider $provider. Continuing anyway..." -ForegroundColor Yellow
        }
        else {
            Write-Host "  Provider $provider registered successfully." -ForegroundColor Green
        }
    }
    else {
        Write-Host "  Provider $provider is already registered." -ForegroundColor Green
    }
}

# Create resource group if it doesn't exist
Write-Host ""
Write-Host "Checking resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create resource group." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Resource group already exists." -ForegroundColor Green
}

# Deploy infrastructure
Write-Host ""
Write-Host "Deploying infrastructure..." -ForegroundColor Yellow
$deploymentName = "insightstudio-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Build parameters array
$parameters = @(
    "sqlAdminUsername=$SqlAdminUsername",
    "sqlAdminPassword=$PlainPassword",
    "location=$Location"
)

if ($FullDeployment) {
    $parameters += @(
        "azureAdClientId=$AzureAdClientId",
        "azureAdClientSecret=$PlainAzureAdClientSecret",
        "azureAdTenantId=$AzureAdTenantId",
        "azureOpenAiEndpoint=$AzureOpenAiEndpoint",
        "azureOpenAiApiKey=$PlainAzureOpenAiApiKey",
        "azureOpenAiDeploymentName=$AzureOpenAiDeploymentName",
        "azureSearchEndpoint=$AzureSearchEndpoint",
        "azureSearchApiKey=$PlainAzureSearchApiKey",
        "azureSearchIndexName=$AzureSearchIndexName",
        "nextAuthSecret=$PlainNextAuthSecret",
        "addeparApiUrl=$AddeparApiUrl",
        "addeparClientId=$AddeparClientId",
        "addeparClientSecret=$PlainAddeparClientSecret",
        "addeparFirm=$AddeparFirm",
        "appServicePlanSku=$AppServicePlanSku",
        "appServicePlanSkuName=$AppServicePlanSkuName"
    )
}

az deployment group create `
    --resource-group $ResourceGroupName `
    --name $deploymentName `
    --template-file "$PSScriptRoot\main.bicep" `
    --parameters $parameters

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Deployment failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""

# Get outputs
Write-Host "Retrieving deployment outputs..." -ForegroundColor Yellow
$outputsJson = az deployment group show `
    --resource-group $ResourceGroupName `
    --name $deploymentName `
    --query properties.outputs `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to retrieve deployment outputs." -ForegroundColor Red
    exit 1
}

$outputs = $outputsJson | ConvertFrom-Json

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Outputs" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SQL Server Name: $($outputs.sqlServerName.value)" -ForegroundColor Green
Write-Host "SQL Database Name: $($outputs.sqlDatabaseName.value)" -ForegroundColor Green
Write-Host "Storage Account Name: $($outputs.storageAccountName.value)" -ForegroundColor Green
Write-Host "Blob Container Name: $($outputs.blobContainerName.value)" -ForegroundColor Green

if ($FullDeployment -and $outputs.appServiceName) {
    Write-Host "App Service Name: $($outputs.appServiceName.value)" -ForegroundColor Green
    Write-Host "App Service URL: $($outputs.appServiceUrl.value)" -ForegroundColor Green
    Write-Host "App Service Plan: $($outputs.appServicePlanName.value)" -ForegroundColor Green
}
Write-Host ""

# Save outputs to file if requested
if ($SaveOutputs) {
    $outputFile = "$PSScriptRoot\deployment-outputs.json"
    $outputs | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile
    Write-Host "Outputs saved to: $outputFile" -ForegroundColor Yellow
    Write-Host ""
}

# Display connection strings
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Connection Strings" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SQL Connection String (Azure format):" -ForegroundColor Yellow
Write-Host $outputs.sqlConnectionString.value -ForegroundColor White
Write-Host ""
Write-Host "SQL Connection String (Prisma format - USE THIS):" -ForegroundColor Yellow
Write-Host $outputs.sqlConnectionStringPrisma.value -ForegroundColor Green
Write-Host ""
Write-Host "Storage Connection String:" -ForegroundColor Yellow
Write-Host $outputs.storageConnectionString.value -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add these connection strings to your .env file" -ForegroundColor White
Write-Host "2. Update SQL firewall rules to allow your IP address" -ForegroundColor White
Write-Host "3. Run 'npm run db:push' to set up the database schema" -ForegroundColor White

if ($FullDeployment -and $outputs.appServiceName) {
    Write-Host "4. Deploy your Next.js application to the App Service:" -ForegroundColor White
    Write-Host "   - Build your Next.js app: npm run build" -ForegroundColor Gray
    Write-Host "   - Deploy using Azure CLI or VS Code Azure extension" -ForegroundColor Gray
    Write-Host "   - Or use: az webapp deployment source config-zip --resource-group $ResourceGroupName --name $($outputs.appServiceName.value) --src <your-zip-file>" -ForegroundColor Gray
    Write-Host "5. Update Azure AD app registration redirect URI to: $($outputs.appServiceUrl.value)/api/auth/callback/azure-ad" -ForegroundColor White
}

Write-Host ""

