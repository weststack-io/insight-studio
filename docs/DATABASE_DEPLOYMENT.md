# Database Schema Deployment Guide

This guide explains how to deploy Prisma schema migrations to multiple databases.

## Overview

The deployment system allows you to:
- Deploy schema migrations to multiple databases (one per tenant)
- Track deployment status and rollback information
- Run dry-run deployments to preview changes
- Rollback deployments when needed

## Configuration

### Database Configuration File

The database configuration is stored in `prisma/databases.json`. This file defines which databases to deploy to.

**Example configuration:**

```json
{
  "databases": [
    {
      "name": "tenant-1",
      "connectionString": "sqlserver://server:1433;database=tenant1;user=admin;password=pass;encrypt=true",
      "description": "Tenant 1 production database"
    },
    {
      "name": "tenant-2",
      "connectionString": "${AZURE_SQL_CONNECTION_STRING_TENANT_2}",
      "description": "Tenant 2 production database"
    },
    {
      "name": "default",
      "connectionString": "${AZURE_SQL_CONNECTION_STRING}",
      "description": "Default database from environment variable"
    }
  ],
  "defaultDatabase": "default"
}
```

**Configuration Fields:**
- `name`: Unique identifier for the database (used in commands)
- `connectionString`: Prisma-compatible connection string. Can use `${ENV_VAR}` syntax for environment variables
- `description`: Optional description for the database
- `defaultDatabase`: Optional default database name

### Environment Variables

Connection strings can reference environment variables using `${VARIABLE_NAME}` syntax. Make sure these variables are set before running deployments.

**Example:**
```bash
export AZURE_SQL_CONNECTION_STRING="sqlserver://server:1433;database=db1;user=admin;password=pass;encrypt=true"
export AZURE_SQL_CONNECTION_STRING_TENANT_2="sqlserver://server:1433;database=db2;user=admin;password=pass;encrypt=true"
```

## Usage

### Deploy to All Databases

Deploy migrations to all databases configured in `prisma/databases.json`:

```bash
npm run db:deploy:all
```

Or use the default command:

```bash
npm run db:deploy
```

### Deploy to a Single Database

Deploy migrations to a specific database:

```bash
npm run db:deploy:single <database-name>
```

**Example:**
```bash
npm run db:deploy:single tenant-1
```

### Dry Run

Preview what would be deployed without making changes:

```bash
npm run db:deploy:dry-run
```

Or with a specific database:

```bash
npm run db:deploy single tenant-1 --dry-run
```

### Rollback

Rollback a database to a previous migration state:

```bash
npm run db:rollback <database-name> [target-migration]
```

**Examples:**
```bash
# Rollback to the last known good migration (from rollback info)
npm run db:rollback tenant-1

# Rollback to a specific migration
npm run db:rollback tenant-1 20240101000000_initial_migration
```

**Note:** Prisma Migrate doesn't support automatic rollback. The rollback command provides guidance on how to manually rollback:
1. Create a new migration that reverses the changes
2. Or restore from a backup taken before deployment

## Workflow

### 1. Create a Migration

First, create your migration locally:

```bash
npm run db:migrate
```

This creates a new migration file in `prisma/migrations/`.

### 2. Test Locally

Test the migration on your local database:

```bash
npm run db:push
# or
npm run db:migrate
```

### 3. Review Changes

Review the migration files in `prisma/migrations/` to ensure they're correct.

### 4. Deploy to All Databases

Deploy to all tenant databases:

```bash
npm run db:deploy:all
```

The script will:
- Read the database configuration
- Deploy migrations to each database sequentially
- Track rollback information for each database
- Report success/failure for each deployment

### 5. Verify Deployment

Check the deployment summary at the end of the output. All databases should show as successful.

## Rollback Information

The deployment script automatically tracks rollback information in `prisma/.rollback-info.json`. This file stores:
- The last migration applied to each database
- Timestamp of the deployment

This information is used when rolling back without specifying a target migration.

**Example rollback info:**
```json
{
  "tenant-1": {
    "database": "tenant-1",
    "lastMigration": "20240101000000_initial_migration",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Handling

If a deployment fails for one database:
- The script continues with other databases
- Failed databases are reported in the summary
- The script exits with code 1 if any failures occurred

**Common Issues:**

1. **Connection String Not Set**
   ```
   Error: Environment variable AZURE_SQL_CONNECTION_STRING is not set
   ```
   **Solution:** Set the required environment variables before running the deployment.

2. **Database Not Found**
   ```
   Error: Database "tenant-1" not found in configuration
   ```
   **Solution:** Check that the database name exists in `prisma/databases.json`.

3. **Migration Conflicts**
   ```
   Error: Migration conflicts detected
   ```
   **Solution:** Resolve migration conflicts manually or restore from backup.

## Best Practices

1. **Always Test Locally First**
   - Test migrations on a local database before deploying to production
   - Use `npm run db:deploy:dry-run` to preview changes

2. **Backup Before Deployment**
   - Take database backups before deploying to production
   - Store backups in a safe location for rollback purposes

3. **Deploy During Maintenance Windows**
   - Schedule deployments during low-traffic periods
   - Notify stakeholders before major schema changes

4. **Monitor After Deployment**
   - Verify application functionality after deployment
   - Check application logs for any issues
   - Monitor database performance

5. **Version Control**
   - Commit migration files to version control
   - Tag releases after successful deployments
   - Keep `databases.json` in version control (without sensitive connection strings)

6. **Security**
   - Never commit connection strings with passwords to version control
   - Use environment variables or secret management systems
   - Rotate database credentials regularly

## Adding a New Database

To add a new database to the deployment:

1. Add the database configuration to `prisma/databases.json`:
   ```json
   {
     "name": "new-tenant",
     "connectionString": "${AZURE_SQL_CONNECTION_STRING_NEW_TENANT}",
     "description": "New tenant database"
   }
   ```

2. Set the environment variable:
   ```bash
   export AZURE_SQL_CONNECTION_STRING_NEW_TENANT="sqlserver://..."
   ```

3. Deploy to the new database:
   ```bash
   npm run db:deploy:single new-tenant
   ```

## Troubleshooting

### Migration Status Check

Check the migration status of a specific database:

```bash
# Set the connection string temporarily
export AZURE_SQL_CONNECTION_STRING="sqlserver://..."
npx prisma migrate status --schema=./prisma/schema.prisma
```

### Manual Migration

If automatic deployment fails, you can manually apply migrations:

```bash
# Set connection string
export AZURE_SQL_CONNECTION_STRING="sqlserver://..."

# Deploy migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Reset Database (Development Only)

⚠️ **Warning:** This will delete all data. Only use in development!

```bash
npx prisma migrate reset --schema=./prisma/schema.prisma
```

## Integration with CI/CD

You can integrate this into your CI/CD pipeline:

**GitHub Actions Example:**
```yaml
- name: Deploy Database Schema
  run: |
    export AZURE_SQL_CONNECTION_STRING="${{ secrets.AZURE_SQL_CONNECTION_STRING }}"
    npm run db:deploy:all
  env:
    AZURE_SQL_CONNECTION_STRING: ${{ secrets.AZURE_SQL_CONNECTION_STRING }}
```

**Azure DevOps Example:**
```yaml
- task: Npm@1
  displayName: 'Deploy Database Schema'
  inputs:
    command: 'custom'
    customCommand: 'run db:deploy:all'
  env:
    AZURE_SQL_CONNECTION_STRING: $(AzureSqlConnectionString)
```

## Support

For issues or questions:
1. Check the error messages and troubleshooting section
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check application logs for detailed error information

