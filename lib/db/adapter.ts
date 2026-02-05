import { PrismaMssql } from '@prisma/adapter-mssql';
import sql from 'mssql';

/**
 * Parse connection string to mssql config format
 * Supports both formats:
 * - Prisma format: sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true
 * - ADO.NET format: Server=tcp:HOST,PORT;Initial Catalog=DATABASE;User ID=USER;Password=PASSWORD;...
 */
export function parseConnectionString(connectionString: string): sql.config {
  const config: sql.config = {
    server: '',
    port: 1433,
    database: '',
    user: '',
    password: '',
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };

  // Check if it's Prisma format (starts with sqlserver://)
  const urlMatch = connectionString.match(/^sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  if (urlMatch) {
    // Prisma format
    config.server = urlMatch[1];
    config.port = urlMatch[2] ? parseInt(urlMatch[2], 10) : 1433;

    // Parse semicolon-separated parameters after the URL part
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
  } else {
    // ADO.NET format: Server=tcp:HOST,PORT;Initial Catalog=DB;User ID=user;Password=pwd;...
    const params = connectionString.split(';');
    for (const param of params) {
      const [key, ...valueParts] = param.split('=');
      const value = valueParts.join('=').trim();
      const keyLower = key.trim().toLowerCase();

      if (!keyLower || !value) continue;

      switch (keyLower) {
        case 'server':
        case 'data source':
          // Parse Server=tcp:hostname,port or Server=hostname,port
          const serverMatch = value.match(/^(?:tcp:)?([^,]+)(?:,(\d+))?/);
          if (serverMatch) {
            config.server = serverMatch[1];
            if (serverMatch[2]) {
              config.port = parseInt(serverMatch[2], 10);
            }
          }
          break;
        case 'database':
        case 'initial catalog':
          config.database = value;
          break;
        case 'user id':
        case 'uid':
        case 'user':
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
  }

  if (!config.server) {
    throw new Error('Invalid connection string format: could not extract server');
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

