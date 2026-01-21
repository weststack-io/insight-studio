import { PrismaMssql } from '@prisma/adapter-mssql';
import sql from 'mssql';

/**
 * Parse Prisma connection string format to mssql config format
 * Prisma format: sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true
 */
export function parseConnectionString(connectionString: string): sql.config {
  // Extract host and port from the URL
  const urlMatch = connectionString.match(/^sqlserver:\/\/([^:]+)(?::(\d+))?/);
  if (!urlMatch) {
    throw new Error('Invalid connection string format');
  }

  const hostname = urlMatch[1];
  const port = urlMatch[2] ? parseInt(urlMatch[2], 10) : 1433;

  const config: sql.config = {
    server: hostname,
    port: port,
    database: '',
    user: '',
    password: '',
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };

  // Parse semicolon-separated parameters
  const params = connectionString.split(';').slice(1);
  for (const param of params) {
    const [key, ...valueParts] = param.split('=');
    const value = valueParts.join('=').trim();
    const keyLower = key.trim().toLowerCase();

    if (!keyLower || !value) continue;

    switch (keyLower) {
      case 'database':
      case 'initial catalog':
        config.database = value;
        break;
      case 'user':
      case 'username':
      case 'uid':
      case 'userid':
        config.user = value;
        break;
      case 'password':
      case 'pwd':
        config.password = value;
        break;
      case 'encrypt':
        config.options!.encrypt = value.toLowerCase() === 'true';
        break;
      case 'trustservercertificate':
        config.options!.trustServerCertificate = value.toLowerCase() === 'true';
        break;
    }
  }

  return config;
}

/**
 * Create a PrismaMssql adapter from a connection string
 */
export function createMssqlAdapter(connectionString?: string): PrismaMssql {
  const connString = connectionString || process.env.AZURE_SQL_CONNECTION_STRING;
  
  if (!connString) {
    throw new Error('AZURE_SQL_CONNECTION_STRING environment variable is not set');
  }

  const mssqlConfig = parseConnectionString(connString);
  return new PrismaMssql(mssqlConfig);
}
