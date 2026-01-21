# Sync shared library files from parent directory to azure-functions/lib
# This ensures the latest code is included in deployments

Write-Host "Syncing library files from parent directory..." -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Define source and destination paths
$parentDir = Split-Path -Parent $PSScriptRoot
$sourceLib = Join-Path $parentDir "lib"
$destLib = Join-Path $PSScriptRoot "lib"

# Create destination directory if it doesn't exist
if (-not (Test-Path $destLib)) {
    New-Item -ItemType Directory -Path $destLib -Force | Out-Null
}

# List of directories and files to sync
$syncPaths = @(
    @{ Source = "db/adapter.ts"; Dest = "db/adapter.ts" },
    @{ Source = "azure/openai.ts"; Dest = "azure/openai.ts" },
    @{ Source = "azure/search.ts"; Dest = "azure/search.ts" },
    @{ Source = "ai/generators.ts"; Dest = "ai/generators.ts" },
    @{ Source = "ai/prompts.ts"; Dest = "ai/prompts.ts" },
    @{ Source = "types/index.ts"; Dest = "types/index.ts" }
)

# Copy each file
foreach ($item in $syncPaths) {
    $sourcePath = Join-Path $sourceLib $item.Source
    $destPath = Join-Path $destLib $item.Dest
    $destDir = Split-Path -Parent $destPath
    
    # Create destination directory if needed
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✓ Synced: $($item.Source)" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠ Warning: Source file not found: $($item.Source)" -ForegroundColor Yellow
    }
}

# Keep stub implementations for ingestion files (not copying from parent)
Write-Host "  ℹ Keeping stub implementations for ingestion files" -ForegroundColor Gray

Write-Host "Library sync complete!" -ForegroundColor Green
