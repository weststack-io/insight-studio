# Azure Functions Deployment Script
# This script prepares and deploys the Azure Functions with compiled lib dependencies

param(
    [Parameter(Mandatory = $true)]
    [string]$FunctionAppName
)

$ErrorActionPreference = "Stop"

Write-Host "Building Azure Functions..." -ForegroundColor Cyan
cd $PSScriptRoot
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Copy compiled files to match Azure Functions expected structure
# Azure Functions expects: azure-functions/weekly-briefings/index.js and lib/ at root
Write-Host "Preparing deployment structure..." -ForegroundColor Cyan

$projectRoot = Join-Path $PSScriptRoot ".."

# Copy compiled lib files to root lib directory
# This ensures imports like ../../lib/ai/generators resolve correctly at runtime
$distLibPath = Join-Path $PSScriptRoot "dist" "lib"
$targetLibPath = Join-Path $projectRoot "lib"

if (Test-Path $distLibPath) {
    Write-Host "Copying compiled lib files to root lib/ directory..." -ForegroundColor Cyan
    # Copy only .js files to avoid overwriting .ts source files unnecessarily
    Get-ChildItem -Path $distLibPath -Recurse -Filter "*.js" | ForEach-Object {
        $relativePath = $_.FullName.Substring($distLibPath.Length + 1)
        $targetFile = Join-Path $targetLibPath $relativePath
        $targetDir = Split-Path $targetFile -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $targetFile -Force
    }
}

# Copy compiled types
$distTypesPath = Join-Path $PSScriptRoot "dist" "types"
$targetTypesPath = Join-Path $projectRoot "types"

if (Test-Path $distTypesPath) {
    Write-Host "Copying compiled types..." -ForegroundColor Cyan
    Get-ChildItem -Path $distTypesPath -Recurse -Filter "*.js" | ForEach-Object {
        $relativePath = $_.FullName.Substring($distTypesPath.Length + 1)
        $targetFile = Join-Path $targetTypesPath $relativePath
        $targetDir = Split-Path $targetFile -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $targetFile -Force
    }
}

# Copy compiled function files to azure-functions directory structure
$distFunctionPath = Join-Path $PSScriptRoot "dist" "azure-functions" "weekly-briefings"
$targetFunctionPath = Join-Path $PSScriptRoot "weekly-briefings"

if (Test-Path $distFunctionPath) {
    Write-Host "Copying compiled function files..." -ForegroundColor Cyan
    Copy-Item -Path "$distFunctionPath\*.js" -Destination $targetFunctionPath -Force
}

# Deploy from project root
Write-Host "Deploying to Azure Function App: $FunctionAppName" -ForegroundColor Cyan
cd (Join-Path $PSScriptRoot "..")

func azure functionapp publish $FunctionAppName --typescript

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment successful!" -ForegroundColor Green

