@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the Function App')
param functionAppName string = 'func-insightstudio-${uniqueString(resourceGroup().id)}'

@description('The name of the storage account for Function App runtime')
param functionStorageAccountName string = 'stfunc${uniqueString(resourceGroup().id)}'

@description('The name of the Application Insights resource')
param appInsightsName string = 'appi-insightstudio-${uniqueString(resourceGroup().id)}'

@description('Node.js version for Function App')
param nodeVersion string = '22-lts'

// Existing Resources - Connection Strings
@description('Azure SQL Database connection string')
@secure()
param azureSqlConnectionString string

@description('Azure Storage connection string (for blob storage)')
@secure()
param azureStorageConnectionString string

// Azure AD / Microsoft Entra ID Configuration
@description('Azure AD Client ID')
param azureAdClientId string

@secure()
@description('Azure AD Client Secret')
param azureAdClientSecret string

@description('Azure AD Tenant ID')
param azureAdTenantId string

// Azure OpenAI Configuration
@description('Azure OpenAI Endpoint')
param azureOpenAiEndpoint string

@secure()
@description('Azure OpenAI API Key')
param azureOpenAiApiKey string

@description('Azure OpenAI Deployment Name')
param azureOpenAiDeploymentName string = 'gpt5-mini'

// Azure AI Search Configuration
@description('Azure AI Search Endpoint')
param azureSearchEndpoint string

@secure()
@description('Azure AI Search API Key')
param azureSearchApiKey string

@description('Azure AI Search Index Name')
param azureSearchIndexName string

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

// NextAuth Configuration
@secure()
@description('NextAuth Secret')
param nextAuthSecret string

@description('NextAuth URL')
param nextAuthUrl string = 'http://localhost:3000'

// Storage Account for Function App Runtime
resource functionStorageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name: functionStorageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    defaultToOAuthAuthentication: false
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    dnsEndpointType: 'Standard'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    publicNetworkAccess: 'Enabled'
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

// App Service Plan (Consumption Plan for Azure Functions)
resource appServicePlan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: '${functionAppName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
    capacity: 1
  }
  properties: {
    reserved: true // Required for Linux consumption plans
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2024-11-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: true // Consumption plan doesn't support always on
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};AccountKey=${functionStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};AccountKey=${functionStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: nodeVersion
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
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
          value: azureSqlConnectionString
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: azureStorageConnectionString
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
          value: nextAuthUrl
        }
      ]
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Outputs
output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output appInsightsName string = appInsights.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output functionStorageAccountName string = functionStorageAccount.name
