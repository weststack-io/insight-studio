# Azure Functions - Library Synchronization

## Overview

The Azure Functions deployment requires self-contained code. Since the functions use shared libraries from the parent `lib/` directory, we automatically sync those files before building and deploying.

## Automatic Sync

The library files are **automatically synced** in the following scenarios:

### 1. Before Every Build

```bash
npm run build
```

The `prebuild` script automatically runs `npm run sync` first.

### 2. Before Deployment

```bash
# PowerShell
.\deploy.ps1 -FunctionAppName func-insightstudio-ubzrwzzhjlqa6

# Bash
./deploy.sh func-insightstudio-ubzrwzzhjlqa6
```

Both deployment scripts automatically sync libraries before building.

### 3. Manual Sync

You can manually sync at any time:

```bash
npm run sync
```

## What Gets Synced

The sync copies these files from the parent `../lib/` directory:

- ✅ `db/adapter.ts` - Database adapter for Prisma with MSSQL
- ✅ `azure/openai.ts` - Azure OpenAI client
- ✅ `azure/search.ts` - Azure AI Search client
- ✅ `ai/generators.ts` - AI content generation
- ✅ `ai/prompts.ts` - Prompt templates
- ✅ `types/index.ts` - TypeScript type definitions

**Note:** The ingestion stub files (`lib/ingestion/*`) are NOT synced. They use simplified implementations specific to the Azure Functions deployment.

## Workflow

1. **Edit files in parent directory**: `c:\repos\weststack\demos\google-doc-demos\InsightStudio\lib\`
2. **Build/Deploy**: Just run `npm run build` or the deploy script
3. **Files auto-sync**: The latest versions are automatically copied before build

## Manual Deployment

If you're using `func` CLI directly:

```bash
# Sync libraries first
npm run sync

# Then deploy
func azure functionapp publish func-insightstudio-ubzrwzzhjlqa6 --javascript -b remote
```

## Scripts

- `sync-libs.ps1` - PowerShell sync script (Windows)
- `sync-libs.sh` - Bash sync script (Linux/Mac)
- `deploy.ps1` - Full deployment script (Windows)
- `deploy.sh` - Full deployment script (Linux/Mac)

## Troubleshooting

**Problem:** Build fails with module not found errors

**Solution:** Run `npm run sync` to ensure all library files are up to date.

**Problem:** Changes to parent lib files not reflected in deployment

**Solution:** The sync happens automatically during build. If you see old code, ensure you're running `npm run build` (not just `tsc` directly).
