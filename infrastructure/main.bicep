@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the SQL server')
param sqlServerName string = 'sql-insightstudio-${uniqueString(resourceGroup().id)}'

@description('The name of the SQL database')
param sqlDatabaseName string = 'sqldb-insightstudio'

@description('SQL administrator login username')
param sqlAdminUsername string

@description('SQL administrator login password')
@secure()
param sqlAdminPassword string

@description('The name of the storage account')
param storageAccountName string = 'stist${uniqueString(resourceGroup().id)}'

@description('The name of the blob container')
param blobContainerName string = 'insightstudio-content'

@description('The name of the Function App (reserved for future use)')
param functionAppName string = 'func-insightstudio-${uniqueString(resourceGroup().id)}'

@description('The name of the storage account for Function App runtime')
param functionStorageAccountName string = 'stfunc${uniqueString(resourceGroup().id)}'

@description('The name of the Application Insights resource')
param appInsightsName string = 'appi-insightstudio-${uniqueString(resourceGroup().id)}'

@description('The name of the App Service (Next.js front-end)')
param appServiceName string = 'app-insightstudio-${uniqueString(resourceGroup().id)}'

@description('The name of the App Service Plan')
param appServicePlanName string = 'plan-insightstudio-${uniqueString(resourceGroup().id)}'

@description('Node.js version for Function App and App Service')
param nodeVersion string = '~20'

@description('App Service Plan SKU tier')
param appServicePlanSku string = 'B1'

@description('App Service Plan SKU name')
param appServicePlanSkuName string = 'B1'

// Azure AD / Microsoft Entra ID Configuration (optional - required for App Service)
@description('Azure AD Client ID')
param azureAdClientId string = ''

@secure()
@description('Azure AD Client Secret')
param azureAdClientSecret string = ''

@description('Azure AD Tenant ID')
param azureAdTenantId string = ''

// Azure OpenAI Configuration (optional - required for App Service)
@description('Azure OpenAI Endpoint')
param azureOpenAiEndpoint string = ''

@secure()
@description('Azure OpenAI API Key')
param azureOpenAiApiKey string = ''

@description('Azure OpenAI Deployment Name')
param azureOpenAiDeploymentName string = 'gpt-4'

// Azure AI Search Configuration (optional - required for App Service)
@description('Azure AI Search Endpoint')
param azureSearchEndpoint string = ''

@secure()
@description('Azure AI Search API Key')
param azureSearchApiKey string = ''

@description('Azure AI Search Index Name')
param azureSearchIndexName string = ''

// Addepar API Configuration (optional)
@description('Addepar API URL')
param addeparApiUrl string = 'https://api.addepar.com'

@description('Addepar Client ID')
param addeparClientId string = ''

@secure()
@description('Addepar Client Secret')
param addeparClientSecret string = ''

@description('Addepar Firm')
param addeparFirm string = ''

// NextAuth Configuration (optional - required for App Service)
@secure()
@description('NextAuth Secret')
param nextAuthSecret string = ''

@description('NextAuth URL (reserved for future use - currently auto-detected from App Service URL)')
param nextAuthUrl string = 'http://localhost:3000'

// Condition to determine if App Service should be created
// Note: functionAppName and nextAuthUrl are reserved for future use
var _unusedFunctionAppName = functionAppName
var _unusedNextAuthUrl = nextAuthUrl
var shouldCreateAppService = azureAdClientId != '' && azureAdClientSecret != '' && azureAdTenantId != '' && azureOpenAiEndpoint != '' && azureOpenAiApiKey != '' && azureSearchEndpoint != '' && azureSearchApiKey != '' && azureSearchIndexName != '' && nextAuthSecret != ''

// SQL Server
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// SQL Server Firewall Rule - Allow Azure Services
resource sqlServerFirewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// SQL Server Firewall Rule - Allow current IP (placeholder - should be configured per environment)
resource sqlServerFirewallRuleClient 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowClientIP'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}

// SQL Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2 GB
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    requestedBackupStorageRedundancy: 'Local'
  }
}

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: false
  }
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

// Blob Container
resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: blobContainerName
  properties: {
    publicAccess: 'None'
  }
}

// Storage Account for Function App Runtime
resource functionStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: functionStorageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: false
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
    IngestionMode: 'ApplicationInsights'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Get Application Insights connection string
var appInsightsConnectionString = 'InstrumentationKey=${appInsights.properties.InstrumentationKey};IngestionEndpoint=https://${location}.in.applicationinsights.azure.com/;LiveEndpoint=https://${location}.livediagnostics.monitor.azure.com/'

// App Service Plan for Next.js front-end (only created if full deployment)
resource appServicePlan 'Microsoft.Web/serverfarms@2024-11-01' = if (shouldCreateAppService) {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: appServicePlanSkuName
  }
  properties: {
    reserved: true // Required for Linux App Service Plans
  }
}

// App Service for Next.js front-end (only created if full deployment)
resource appService 'Microsoft.Web/sites@2025-03-01' = if (shouldCreateAppService) {
  name: appServiceName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: nodeVersion
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'AZURE_SQL_CONNECTION_STRING'
          value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminUsername};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'AZURE_AD_CLIENT_ID'
          value: azureAdClientId
        }
        {
          name: 'AZURE_AD_CLIENT_SECRET'
          value: azureAdClientSecret
        }
        {
          name: 'AZURE_AD_TENANT_ID'
          value: azureAdTenantId
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: azureOpenAiEndpoint
        }
        {
          name: 'AZURE_OPENAI_API_KEY'
          value: azureOpenAiApiKey
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT_NAME'
          value: azureOpenAiDeploymentName
        }
        {
          name: 'AZURE_SEARCH_ENDPOINT'
          value: azureSearchEndpoint
        }
        {
          name: 'AZURE_SEARCH_API_KEY'
          value: azureSearchApiKey
        }
        {
          name: 'AZURE_SEARCH_INDEX_NAME'
          value: azureSearchIndexName
        }
        {
          name: 'ADDEPAR_API_URL'
          value: addeparApiUrl
        }
        {
          name: 'ADDEPAR_CLIENT_ID'
          value: addeparClientId
        }
        {
          name: 'ADDEPAR_CLIENT_SECRET'
          value: addeparClientSecret
        }
        {
          name: 'ADDEPAR_FIRM'
          value: addeparFirm
        }
        {
          name: 'NEXTAUTH_SECRET'
          value: nextAuthSecret
        }
        {
          name: 'NEXTAUTH_URL'
          value: 'https://${appServiceName}.azurewebsites.net'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Moved to it's own module ...
// // Get Application Insights connection string (using reference function)
// var appInsightsConnectionString = 'InstrumentationKey=${appInsights.properties.InstrumentationKey};IngestionEndpoint=https://${location}.in.applicationinsights.azure.com/;LiveEndpoint=https://${location}.livediagnostics.monitor.azure.com/'

// // App Service Plan (Consumption Plan for Azure Functions)
// resource appServicePlan 'Microsoft.Web/serverfarms@2024-11-01' = {
//   name: '${functionAppName}-plan'
//   location: location
//   kind: 'functionapp'
//   sku: {
//     name: 'Y1'
//     tier: 'Dynamic'
//   }
//   properties: {
//     reserved: true // Required for Linux consumption plans
//   }
// }

// // Function App
// resource functionApp 'Microsoft.Web/sites@2025-03-01' = {
//   name: functionAppName
//   location: location
//   kind: 'functionapp,linux'
//   properties: {
//     serverFarmId: appServicePlan.id
//     siteConfig: {
//       linuxFxVersion: 'NODE|${nodeVersion}'
//       alwaysOn: false // Consumption plan doesn't support always on
//       http20Enabled: true
//       minTlsVersion: '1.2'
//       ftpsState: 'Disabled'
//       appSettings: [
//         {
//           name: 'AzureWebJobsStorage'
//           value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};AccountKey=${functionStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
//         }
//         {
//           name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
//           value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};AccountKey=${functionStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
//         }
//         {
//           name: 'WEBSITE_CONTENTSHARE'
//           value: toLower(functionAppName)
//         }
//         {
//           name: 'FUNCTIONS_EXTENSION_VERSION'
//           value: '~4'
//         }
//         {
//           name: 'WEBSITE_NODE_DEFAULT_VERSION'
//           value: nodeVersion
//         }
//         {
//           name: 'FUNCTIONS_WORKER_RUNTIME'
//           value: 'node'
//         }
//         {
//           name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
//           value: appInsights.properties.InstrumentationKey
//         }
//         {
//           name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
//           value: appInsightsConnectionString
//         }
//         {
//           name: 'AZURE_SQL_CONNECTION_STRING'
//           value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminUsername};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
//         }
//         {
//           name: 'AZURE_STORAGE_CONNECTION_STRING'
//           value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
//         }
//         {
//           name: 'AZURE_AD_CLIENT_ID'
//           value: azureAdClientId
//         }
//         {
//           name: 'AZURE_AD_CLIENT_SECRET'
//           value: azureAdClientSecret
//         }
//         {
//           name: 'AZURE_AD_TENANT_ID'
//           value: azureAdTenantId
//         }
//         {
//           name: 'AZURE_OPENAI_ENDPOINT'
//           value: azureOpenAiEndpoint
//         }
//         {
//           name: 'AZURE_OPENAI_API_KEY'
//           value: azureOpenAiApiKey
//         }
//         {
//           name: 'AZURE_OPENAI_DEPLOYMENT_NAME'
//           value: azureOpenAiDeploymentName
//         }
//         {
//           name: 'AZURE_SEARCH_ENDPOINT'
//           value: azureSearchEndpoint
//         }
//         {
//           name: 'AZURE_SEARCH_API_KEY'
//           value: azureSearchApiKey
//         }
//         {
//           name: 'AZURE_SEARCH_INDEX_NAME'
//           value: azureSearchIndexName
//         }
//         {
//           name: 'ADDEPAR_API_URL'
//           value: addeparApiUrl
//         }
//         {
//           name: 'ADDEPAR_CLIENT_ID'
//           value: addeparClientId
//         }
//         {
//           name: 'ADDEPAR_CLIENT_SECRET'
//           value: addeparClientSecret
//         }
//         {
//           name: 'ADDEPAR_FIRM'
//           value: addeparFirm
//         }
//         {
//           name: 'NEXTAUTH_SECRET'
//           value: nextAuthSecret
//         }
//         {
//           name: 'NEXTAUTH_URL'
//           value: nextAuthUrl
//         }
//       ]
//     }
//     httpsOnly: true
//   }
//   identity: {
//     type: 'SystemAssigned'
//   }
// }

// Outputs
output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output sqlConnectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminUsername};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
output sqlConnectionStringPrisma string = 'sqlserver://${sqlServer.properties.fullyQualifiedDomainName}:1433;database=${sqlDatabaseName};user=${sqlAdminUsername};password=${sqlAdminPassword};encrypt=true;trustServerCertificate=false'
output storageAccountName string = storageAccount.name
output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
output blobContainerName string = blobContainer.name
@description('App Service name (only if App Service was deployed)')
output appServiceName string = shouldCreateAppService ? appService.name : ''
@description('App Service URL (only if App Service was deployed)')
output appServiceUrl string = shouldCreateAppService ? 'https://${appService.properties.defaultHostName}' : ''
@description('App Service Plan name (only if App Service was deployed)')
output appServicePlanName string = shouldCreateAppService ? appServicePlan.name : ''
// output functionAppName string = functionApp.name
// output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output appInsightsName string = appInsights.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
