# Insight Studio Infrastructure Deployment Script
# This script deploys Azure SQL Database and Blob Storage using Bicep

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName = "rg-insightstudio",
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "eastus2",
    
    [Parameter(Mandatory = $true)]
    [string]$SqlAdminUsername,
    
    [Parameter(Mandatory = $true)]
    [SecureString]$SqlAdminPassword,
    
    [Parameter(Mandatory = $false)]
    [switch]$SaveOutputs
)

# Convert SecureString to plain text for Bicep parameter
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

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

# Create resource group if it doesn't exist
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

az deployment group create `
    --resource-group $ResourceGroupName `
    --name $deploymentName `
    --template-file "$PSScriptRoot\main.bicep" `
    --parameters sqlAdminUsername=$SqlAdminUsername sqlAdminPassword=$PlainPassword location=$Location

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
Write-Host ""

