# Prisma 7 Migration Guide

This project has been upgraded from Prisma 6.19.0 to Prisma 7.1.0 with the new configuration format.

## Changes Made

### 1. Package Updates

- **@prisma/client**: Updated from `^6.19.0` to `^7.1.0`
- **@prisma/adapter-mssql**: Added `^7.1.0` (required for Prisma 7 SQL Server adapter)
- **prisma**: Updated from `^6.19.0` to `^7.1.0`
- **mssql**: Added `^11.0.1` (node-mssql driver for SQL Server)
- **@types/mssql**: Added `^9.1.4` (TypeScript types for mssql)
- **dotenv**: Added as a dependency (required for `prisma/config.ts`)

### 2. Schema Changes

**Before (Prisma 6):**
```prisma
datasource db {
  provider = "sqlserver"
  url      = env("AZURE_SQL_CONNECTION_STRING")
}
```

**After (Prisma 7):**
```prisma
datasource db {
  provider = "sqlserver"
}
```

The `url` field has been moved to `prisma/config.ts`.

### 3. New Configuration File

Created `prisma/config.ts` following the [Prisma 7 documentation](https://www.prisma.io/docs/orm/overview/databases/sql-server):

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('AZURE_SQL_CONNECTION_STRING'),
  },
})
```

### 4. PrismaClient Instantiation Changes

**Before (Prisma 6):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

**After (Prisma 7):**
```typescript
import { PrismaClient } from '@prisma/client';
import { createMssqlAdapter } from '@/lib/db/adapter';

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});
```

All PrismaClient instantiations have been updated to use the `@prisma/adapter-mssql` adapter. A helper function `createMssqlAdapter()` has been created in `lib/db/adapter.ts` to simplify adapter creation.

### 5. Deployment Updates

- Updated `webdeploy.ps1` to copy `prisma/config.ts` during deployment
- Updated `webdeploy/package.json` to use Prisma 7 and include adapter dependencies
- Updated startup command documentation

## Migration Steps

### 1. Install Dependencies

```bash
npm install
```

This will install Prisma 7.1.0 and dotenv.

### 2. Regenerate Prisma Client

```bash
npm run db:generate
```

This will generate the Prisma client with the new configuration.

### 3. Test Locally

```bash
npm run dev
```

Verify that your application connects to the database correctly.

### 4. Update Azure App Service Startup Command

The startup command should now work with Prisma 7:

```bash
npx prisma generate && node server.js
```

Or using the local binary:

```bash
./node_modules/.bin/prisma generate && node server.js
```

### 5. Deploy

```bash
.\webdeploy.ps1
```

The deployment script will now include `prisma/config.ts` in the deployment package.

## Key Differences in Prisma 7

1. **Configuration Location**: Connection URLs are now in `prisma/config.ts` instead of `schema.prisma`
2. **Environment Variables**: Must use `dotenv` to load environment variables when using Prisma CLI commands
3. **Driver Adapters**: Prisma 7 requires driver adapters for relational databases. For SQL Server, we use `@prisma/adapter-mssql` with the `mssql` (node-mssql) driver
4. **PrismaClient Constructor**: Must pass an `adapter` to the PrismaClient constructor (or use `accelerateUrl` for Prisma Accelerate)

## Troubleshooting

### Error: "The datasource property `url` is no longer supported"

This means you're using Prisma 7 CLI but still have the old schema format. Make sure:
- `prisma/schema.prisma` doesn't have `url` in the datasource block
- `prisma/config.ts` exists and has the correct configuration

### Error: "Cannot find module 'prisma/config'"

Make sure you've installed Prisma 7:
```bash
npm install prisma@^7.1.0
```

### Environment Variables Not Loading

The `prisma/config.ts` file uses `dotenv/config` to load environment variables. Make sure:
- `.env` file exists with `AZURE_SQL_CONNECTION_STRING`
- Or environment variables are set in your deployment environment

## References

- [Prisma 7 SQL Server Documentation](https://www.prisma.io/docs/orm/overview/databases/sql-server)
- [Prisma 7 Configuration Guide](https://pris.ly/d/config-datasource)

