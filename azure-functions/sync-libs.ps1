# Sync shared library files from parent directory to azure-functions/lib
# This ensures the latest code is included in deployments

Write-Host "Syncing library files from parent directory..." -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Define source and destination paths
$parentDir = Split-Path -Parent $PSScriptRoot
$sourceLib = Join-Path $parentDir "lib"
$sourceTypes = Join-Path $parentDir "types"
$destLib = Join-Path $PSScriptRoot "lib"

# Create destination directory if it doesn't exist
if (-not (Test-Path $destLib)) {
    New-Item -ItemType Directory -Path $destLib -Force | Out-Null
}

# List of library files to sync from lib/ directory
$libSyncPaths = @(
    @{ Source = "db/adapter.ts"; Dest = "db/adapter.ts" },
    @{ Source = "azure/openai.ts"; Dest = "azure/openai.ts" },
    @{ Source = "azure/search.ts"; Dest = "azure/search.ts" },
    @{ Source = "ai/generators.ts"; Dest = "ai/generators.ts" },
    @{ Source = "ai/prompts.ts"; Dest = "ai/prompts.ts" }
)

# Copy library files with import transformations
foreach ($item in $libSyncPaths) {
    $sourcePath = Join-Path $sourceLib $item.Source
    $destPath = Join-Path $destLib $item.Dest
    $destDir = Split-Path -Parent $destPath
    
    # Create destination directory if needed
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    if (Test-Path $sourcePath) {
        # Read the file content
        $content = Get-Content -Path $sourcePath -Raw
        
        # Transform imports from @/ aliases to relative paths
        $content = $content -replace 'from "@/lib/', 'from "../'
        $content = $content -replace 'from "@/types"', 'from "../types"'
        
        # Write transformed content
        Set-Content -Path $destPath -Value $content -NoNewline
        Write-Host "  ✓ Synced: $($item.Source)" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠ Warning: Source file not found: $($item.Source)" -ForegroundColor Yellow
    }
}

# Copy types file from types/ directory (not lib/types/)
$typesSource = Join-Path $sourceTypes "index.ts"
$typesDest = Join-Path $destLib "types/index.ts"
$typesDestDir = Split-Path -Parent $typesDest

if (-not (Test-Path $typesDestDir)) {
    New-Item -ItemType Directory -Path $typesDestDir -Force | Out-Null
}

if (Test-Path $typesSource) {
    Copy-Item -Path $typesSource -Destination $typesDest -Force
    Write-Host "  ✓ Synced: types/index.ts" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ Warning: Source file not found: types/index.ts" -ForegroundColor Yellow
}

# Keep stub implementations for ingestion files (not copying from parent)
Write-Host "  ℹ Keeping stub implementations for ingestion files" -ForegroundColor Gray

Write-Host "Library sync complete!" -ForegroundColor Green
