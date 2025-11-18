# Insight Studio Function App Deployment Script
# This script deploys only the Azure Function App infrastructure

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName = "rg-insightstudio",
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "eastus2",
    
    [Parameter(Mandatory = $true)]
    [string]$AzureSqlConnectionString,
    
    [Parameter(Mandatory = $true)]
    [string]$AzureStorageConnectionString,
    
    [Parameter(Mandatory = $true)]
    [string]$AzureAdClientId,
    
    [Parameter(Mandatory = $true)]
    [SecureString]$AzureAdClientSecret,
    
    [Parameter(Mandatory = $true)]
    [string]$AzureAdTenantId,
    
    [Parameter(Mandatory = $true)]
    [string]$AzureOpenAiEndpoint,
    
    [Parameter(Mandatory = $true)]
    [SecureString]$AzureOpenAiApiKey,
    
    [Parameter(Mandatory = $false)]
    [string]$AzureOpenAiDeploymentName = "gpt-4",
    
    [Parameter(Mandatory = $true)]
    [string]$AzureSearchEndpoint,
    
    [Parameter(Mandatory = $true)]
    [SecureString]$AzureSearchApiKey,
    
    [Parameter(Mandatory = $true)]
    [string]$AzureSearchIndexName,
    
    [Parameter(Mandatory = $false)]
    [string]$AddeparApiUrl = "https://api.addepar.com",
    
    [Parameter(Mandatory = $false)]
    [string]$AddeparClientId = "",
    
    [Parameter(Mandatory = $false)]
    [SecureString]$AddeparClientSecret,
    
    [Parameter(Mandatory = $false)]
    [string]$AddeparFirm = "",
    
    [Parameter(Mandatory = $true)]
    [SecureString]$NextAuthSecret,
    
    [Parameter(Mandatory = $false)]
    [string]$NextAuthUrl = "http://localhost:3000",
    
    [Parameter(Mandatory = $false)]
    [string]$FunctionAppName,
    
    [Parameter(Mandatory = $false)]
    [switch]$SaveOutputs
)

# Convert SecureString to plain text for Bicep parameters
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AzureAdClientSecret)
$AzureAdClientSecretPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AzureOpenAiApiKey)
$AzureOpenAiApiKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AzureSearchApiKey)
$AzureSearchApiKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ($AddeparClientSecret) {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AddeparClientSecret)
    $AddeparClientSecretPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}
else {
    $AddeparClientSecretPlain = ""
}

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($NextAuthSecret)
$NextAuthSecretPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Insight Studio Function App Deployment" -ForegroundColor Cyan
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

# Check if resource group exists
Write-Host "Checking resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "Error: Resource group '$ResourceGroupName' does not exist." -ForegroundColor Red
    Write-Host "Please create the resource group first or deploy the main infrastructure." -ForegroundColor Yellow
    exit 1
}
Write-Host "Resource group exists." -ForegroundColor Green

# Build parameters
$params = @(
    "azureSqlConnectionString=`"$AzureSqlConnectionString`"",
    "azureStorageConnectionString=`"$AzureStorageConnectionString`"",
    "azureAdClientId=$AzureAdClientId",
    "azureAdClientSecret=$AzureAdClientSecretPlain",
    "azureAdTenantId=$AzureAdTenantId",
    "azureOpenAiEndpoint=$AzureOpenAiEndpoint",
    "azureOpenAiApiKey=$AzureOpenAiApiKeyPlain",
    "azureOpenAiDeploymentName=$AzureOpenAiDeploymentName",
    "azureSearchEndpoint=$AzureSearchEndpoint",
    "azureSearchApiKey=$AzureSearchApiKeyPlain",
    "azureSearchIndexName=$AzureSearchIndexName",
    "addeparApiUrl=$AddeparApiUrl",
    "addeparClientId=$AddeparClientId",
    "addeparClientSecret=$AddeparClientSecretPlain",
    "addeparFirm=$AddeparFirm",
    "nextAuthSecret=$NextAuthSecretPlain",
    "nextAuthUrl=$NextAuthUrl",
    "location=$Location"
)

if ($FunctionAppName) {
    $params += "functionAppName=$FunctionAppName"
}

# Deploy infrastructure
Write-Host ""
Write-Host "Deploying Function App infrastructure..." -ForegroundColor Yellow
$deploymentName = "functionapp-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

$deployCommand = "az deployment group create " +
"--resource-group $ResourceGroupName " +
"--name $deploymentName " +
"--template-file `"$PSScriptRoot\function-app.bicep`" " +
"--parameters $($params -join ' ')"

Invoke-Expression $deployCommand

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
Write-Host "Function App Name: $($outputs.functionAppName.value)" -ForegroundColor Green
Write-Host "Function App URL: $($outputs.functionAppUrl.value)" -ForegroundColor Green
Write-Host "Application Insights Name: $($outputs.appInsightsName.value)" -ForegroundColor Green
Write-Host "Function Storage Account: $($outputs.functionStorageAccountName.value)" -ForegroundColor Green
Write-Host ""

# Save outputs to file if requested
if ($SaveOutputs) {
    $outputFile = "$PSScriptRoot\function-app-outputs.json"
    $outputs | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile
    Write-Host "Outputs saved to: $outputFile" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Deploy the function code using: func azure functionapp publish $($outputs.functionAppName.value)" -ForegroundColor White
Write-Host "2. Verify the function is running in the Azure Portal" -ForegroundColor White
Write-Host ""

