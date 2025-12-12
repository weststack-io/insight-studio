import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables (optional - dotenv may not be installed)
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch (error) {
  // dotenv not available, environment variables should be set externally
}

interface DatabaseConfig {
  name: string;
  connectionString: string;
  description?: string;
}

interface DatabasesConfig {
  databases: DatabaseConfig[];
  defaultDatabase?: string;
}

interface DeploymentResult {
  database: string;
  success: boolean;
  error?: string;
  migrationsApplied?: number;
}

interface RollbackInfo {
  database: string;
  lastMigration: string;
  timestamp: Date;
}

class SchemaDeployer {
  private configPath: string;
  private rollbackInfoPath: string;
  private schemaPath: string;
  private results: DeploymentResult[] = [];
  private rollbackInfo: Map<string, RollbackInfo> = new Map();

  constructor() {
    this.configPath = join(process.cwd(), 'prisma', 'databases.json');
    this.rollbackInfoPath = join(process.cwd(), 'prisma', '.rollback-info.json');
    this.schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
    this.loadRollbackInfo();
  }

  private loadRollbackInfo(): void {
    if (existsSync(this.rollbackInfoPath)) {
      try {
        const data = JSON.parse(readFileSync(this.rollbackInfoPath, 'utf-8'));
        Object.entries(data).forEach(([db, info]) => {
          this.rollbackInfo.set(db, info as RollbackInfo);
        });
      } catch (error) {
        console.warn('⚠️  Could not load rollback info:', error);
      }
    }
  }

  private saveRollbackInfo(): void {
    const data = Object.fromEntries(this.rollbackInfo);
    writeFileSync(this.rollbackInfoPath, JSON.stringify(data, null, 2));
  }

  private resolveConnectionString(connectionString: string): string {
    // Replace environment variable placeholders
    return connectionString.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const value = process.env[varName];
      if (!value) {
        throw new Error(`Environment variable ${varName} is not set`);
      }
      return value;
    });
  }

  private async getLastMigration(databaseName: string, connectionString: string): Promise<string | null> {
    try {
      // Set connection string as environment variable for Prisma
      const env = { ...process.env, AZURE_SQL_CONNECTION_STRING: connectionString };
      
      // Use Prisma to get migration status
      const output = execSync(
        'npx prisma migrate status --schema=./prisma/schema.prisma',
        { 
          encoding: 'utf-8',
          env,
          stdio: 'pipe'
        }
      );
      
      // Parse the output to find the last migration
      // This is a simplified parser - you may need to adjust based on actual output
      const match = output.match(/Database is at migration\s+([^\s]+)/i);
      return match ? match[1] : null;
    } catch (error) {
      // If database doesn't exist or has no migrations, return null
      return null;
    }
  }

  private async deployToDatabase(config: DatabaseConfig, dryRun: boolean): Promise<DeploymentResult> {
    console.log(`\n📦 Deploying to database: ${config.name}`);
    if (config.description) {
      console.log(`   ${config.description}`);
    }

    try {
      const connectionString = this.resolveConnectionString(config.connectionString);
      
      // Get last migration before deployment for rollback info
      const lastMigration = await this.getLastMigration(config.name, connectionString);
      
      // Set connection string as environment variable
      const env = { ...process.env, AZURE_SQL_CONNECTION_STRING: connectionString };

      if (dryRun) {
        console.log(`   [DRY RUN] Would deploy migrations to ${config.name}`);
        return {
          database: config.name,
          success: true,
          migrationsApplied: 0
        };
      }

      // Run Prisma migrate deploy
      const output = execSync(
        'npx prisma migrate deploy --schema=./prisma/schema.prisma',
        { 
          encoding: 'utf-8',
          env,
          stdio: 'pipe'
        }
      );

      // Parse output to count migrations applied
      const migrationsMatch = output.match(/(\d+)\s+migration/i);
      const migrationsApplied = migrationsMatch ? parseInt(migrationsMatch[1], 10) : 0;

      // Save rollback info
      if (lastMigration) {
        this.rollbackInfo.set(config.name, {
          database: config.name,
          lastMigration,
          timestamp: new Date()
        });
        this.saveRollbackInfo();
      }

      console.log(`   ✅ Successfully deployed to ${config.name}`);
      if (migrationsApplied > 0) {
        console.log(`   📊 Applied ${migrationsApplied} migration(s)`);
      } else {
        console.log(`   ℹ️  Database is up to date`);
      }

      return {
        database: config.name,
        success: true,
        migrationsApplied
      };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      console.error(`   ❌ Failed to deploy to ${config.name}:`, errorMessage);
      
      return {
        database: config.name,
        success: false,
        error: errorMessage
      };
    }
  }

  async deployAll(dryRun: boolean = false): Promise<void> {
    console.log('🚀 Starting schema deployment...\n');

    if (!existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    if (!existsSync(this.schemaPath)) {
      throw new Error(`Schema file not found: ${this.schemaPath}`);
    }

    const config: DatabasesConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));

    if (!config.databases || config.databases.length === 0) {
      throw new Error('No databases configured in databases.json');
    }

    console.log(`📋 Found ${config.databases.length} database(s) to deploy:\n`);
    config.databases.forEach((db, index) => {
      console.log(`   ${index + 1}. ${db.name}${db.description ? ` - ${db.description}` : ''}`);
    });

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Deploy to each database
    for (const dbConfig of config.databases) {
      const result = await this.deployToDatabase(dbConfig, dryRun);
      this.results.push(result);
    }

    // Print summary
    this.printSummary();
  }

  async deploySingle(databaseName: string, dryRun: boolean = false): Promise<void> {
    console.log(`🚀 Deploying schema to database: ${databaseName}\n`);

    if (!existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    const config: DatabasesConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));
    const dbConfig = config.databases.find(db => db.name === databaseName);

    if (!dbConfig) {
      throw new Error(`Database "${databaseName}" not found in configuration`);
    }

    const result = await this.deployToDatabase(dbConfig, dryRun);
    this.results.push(result);
    this.printSummary();
  }

  async rollback(databaseName: string, targetMigration?: string): Promise<void> {
    console.log(`🔄 Rolling back database: ${databaseName}\n`);

    if (!existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    const config: DatabasesConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));
    const dbConfig = config.databases.find(db => db.name === databaseName);

    if (!dbConfig) {
      throw new Error(`Database "${databaseName}" not found in configuration`);
    }

    const connectionString = this.resolveConnectionString(dbConfig.connectionString);
    const env = { ...process.env, AZURE_SQL_CONNECTION_STRING: connectionString };

    try {
      // Get current migration status
      const statusOutput = execSync(
        'npx prisma migrate status --schema=./prisma/schema.prisma',
        { encoding: 'utf-8', env, stdio: 'pipe' }
      );

      console.log('Current migration status:');
      console.log(statusOutput);

      // Determine target migration
      const target = targetMigration || this.rollbackInfo.get(databaseName)?.lastMigration;

      if (!target) {
        throw new Error('No target migration specified and no rollback info available. Use: npm run db:rollback <database> <migration-name>');
      }

      console.log(`\n⚠️  WARNING: Rolling back to migration: ${target}`);
      console.log('This will undo all migrations applied after this point.\n');

      // Prisma doesn't have built-in rollback, so we need to use migrate resolve
      // This is a simplified approach - for production, you'd want more sophisticated rollback
      console.log('ℹ️  Prisma Migrate does not support automatic rollback.');
      console.log('ℹ️  You need to manually create a new migration that reverses the changes.');
      console.log('ℹ️  Alternatively, you can use: npx prisma migrate resolve --rolled-back <migration-name>');
      console.log(`\n💡 To rollback to "${target}", you should:`);
      console.log(`   1. Create a new migration that reverses changes after ${target}`);
      console.log(`   2. Or manually restore from a backup taken before deployment`);

    } catch (error: any) {
      console.error(`❌ Rollback failed:`, error.message);
      throw error;
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Deployment Summary');
    console.log('='.repeat(60));

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    console.log(`\n✅ Successful: ${successful.length}`);
    successful.forEach(result => {
      console.log(`   • ${result.database}${result.migrationsApplied !== undefined ? ` (${result.migrationsApplied} migration(s))` : ''}`);
    });

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length}`);
      failed.forEach(result => {
        console.log(`   • ${result.database}: ${result.error}`);
      });
    }

    console.log(`\n📈 Total: ${this.results.length} database(s)\n`);

    if (failed.length > 0) {
      process.exit(1);
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  const deployer = new SchemaDeployer();

  try {
    switch (command) {
      case 'all':
      case undefined:
        await deployer.deployAll(dryRun);
        break;

      case 'single':
        const dbName = args[1];
        if (!dbName) {
          console.error('❌ Error: Database name required for single deployment');
          console.error('Usage: npm run db:deploy single <database-name>');
          process.exit(1);
        }
        await deployer.deploySingle(dbName, dryRun);
        break;

      case 'rollback':
        const rollbackDbName = args[1];
        const targetMigration = args[2];
        if (!rollbackDbName) {
          console.error('❌ Error: Database name required for rollback');
          console.error('Usage: npm run db:rollback <database-name> [target-migration]');
          process.exit(1);
        }
        await deployer.rollback(rollbackDbName, targetMigration);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('\nAvailable commands:');
        console.error('  all          - Deploy to all databases (default)');
        console.error('  single <db>  - Deploy to a single database');
        console.error('  rollback <db> [migration] - Rollback a database');
        console.error('\nOptions:');
        console.error('  --dry-run, -d - Dry run mode (no changes)');
        process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();

