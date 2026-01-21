@description('The location for all resources')
param location string = resourceGroup().location

@description('Environment name')
param envName string = 'dev'

@description('The name of the Function App')
param functionAppName string = 'func-insightstudio-${uniqueString(resourceGroup().id)}'

@description('The name of the storage account for Function App runtime')
param functionStorageAccountName string = 'stfunc${uniqueString(resourceGroup().id)}'

@description('A unique prefix for application identifier.')
param namePrefix string = 'insightstud'

@description('Node.js version for Function App')
param nodeVersion string = '22'

@description('Language runtime used by the function app.')
@allowed(['dotnet-isolated', 'python', 'java', 'node', 'powerShell'])
param functionAppRuntime string = 'node' //Defaults to node

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

@description('Tags applied to all created resources')
param tags object = {
  owner: 'west-stack'
  environment: envName
  application: 'app-insights'
}

var workspaceName = '${namePrefix}-la-${envName}'
var appInsightsName = '${namePrefix}-ai-${envName}'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2025-02-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: any({
    retentionInDays: 30
    features: {
      searchVersion: 1
    }
    sku: {
      name: 'PerGB2018'
    }
  })
}

output workspaceResourceId string = logAnalytics.id
output workspaceId string = logAnalytics.properties.customerId

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    // DisableLocalAuth: true
  }
}

// Get Application Insights connection string
var appInsightsConnectionString = 'InstrumentationKey=${applicationInsights.properties.InstrumentationKey};IngestionEndpoint=https://${location}.in.applicationinsights.azure.com/;LiveEndpoint=https://${location}.livediagnostics.monitor.azure.com/'

// Key access to the storage account is disabled by default 
var storageAccountAllowSharedKeyAccess = false

// Generates a unique container name for deployments.
var deploymentStorageContainerName = 'app-package-${take(functionAppName, 32)}-${take(uniqueString(resourceGroup().id), 7)}'

resource storage 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: functionStorageAccountName
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: storageAccountAllowSharedKeyAccess
    dnsEndpointType: 'Standard'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    publicNetworkAccess: 'Enabled'
  }
  resource blobServices 'blobServices' = {
    name: 'default'
    properties: {
      deleteRetentionPolicy: {}
    }
    resource deploymentContainer 'containers' = {
      name: deploymentStorageContainerName
      properties: {
        publicAccess: 'None'
      }
    }
  }
}

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

// Define the IDs of the roles we need to assign to our managed identities.
var storageBlobDataOwnerRoleId = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var storageQueueDataContributorId = '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
var storageTableDataContributorId = '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
var monitoringMetricsPublisherId = '3913510d-42f4-4e42-8a64-420c390055eb'

resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'uai-data-owner-${uniqueString(resourceGroup().id)}'
  location: location
}

resource roleAssignmentBlobDataOwner 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, storage.id, userAssignedIdentity.id, 'Storage Blob Data Owner')
  scope: storage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataOwnerRoleId)
    principalId: userAssignedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource roleAssignmentBlob 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, storage.id, userAssignedIdentity.id, 'Storage Blob Data Contributor')
  scope: storage
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      storageBlobDataContributorRoleId
    )
    principalId: userAssignedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource roleAssignmentQueueStorage 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, storage.id, userAssignedIdentity.id, 'Storage Queue Data Contributor')
  scope: storage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageQueueDataContributorId)
    principalId: userAssignedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource roleAssignmentTableStorage 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, storage.id, userAssignedIdentity.id, 'Storage Table Data Contributor')
  scope: storage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageTableDataContributorId)
    principalId: userAssignedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource roleAssignmentAppInsights 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().id, applicationInsights.id, userAssignedIdentity.id, 'Monitoring Metrics Publisher')
  scope: applicationInsights
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', monitoringMetricsPublisherId)
    principalId: userAssignedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2024-11-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: true // Consumption plan doesn't support always on
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      // appSettings: [
      //   {
      //     name: 'AzureWebJobsStorage'
      //     value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};AccountKey=${functionStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
      //   }
      //   {
      //     name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
      //     value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorageAccount.name};AccountKey=${functionStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
      //   }
      //   {
      //     name: 'WEBSITE_CONTENTSHARE'
      //     value: toLower(functionAppName)
      //   }
      //   {
      //     name: 'FUNCTIONS_EXTENSION_VERSION'
      //     value: '~4'
      //   }
      //   {
      //     name: 'WEBSITE_NODE_DEFAULT_VERSION'
      //     value: nodeVersion
      //   }
      //   {
      //     name: 'FUNCTIONS_WORKER_RUNTIME'
      //     value: 'node'
      //   }
      //   {
      //     name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
      //     value: appInsights.properties.InstrumentationKey
      //   }
      //   {
      //     name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
      //     value: appInsightsConnectionString
      //   }
      //   {
      //     name: 'AZURE_SQL_CONNECTION_STRING'
      //     value: azureSqlConnectionString
      //   }
      //   {
      //     name: 'AZURE_STORAGE_CONNECTION_STRING'
      //     value: azureStorageConnectionString
      //   }
      //   {
      //     name: 'AZURE_AD_CLIENT_ID'
      //     value: azureAdClientId
      //   }
      //   {
      //     name: 'AZURE_AD_CLIENT_SECRET'
      //     value: azureAdClientSecret
      //   }
      //   {
      //     name: 'AZURE_AD_TENANT_ID'
      //     value: azureAdTenantId
      //   }
      //   {
      //     name: 'AZURE_OPENAI_ENDPOINT'
      //     value: azureOpenAiEndpoint
      //   }
      //   {
      //     name: 'AZURE_OPENAI_API_KEY'
      //     value: azureOpenAiApiKey
      //   }
      //   {
      //     name: 'AZURE_OPENAI_DEPLOYMENT_NAME'
      //     value: azureOpenAiDeploymentName
      //   }
      //   {
      //     name: 'AZURE_SEARCH_ENDPOINT'
      //     value: azureSearchEndpoint
      //   }
      //   {
      //     name: 'AZURE_SEARCH_API_KEY'
      //     value: azureSearchApiKey
      //   }
      //   {
      //     name: 'AZURE_SEARCH_INDEX_NAME'
      //     value: azureSearchIndexName
      //   }
      //   {
      //     name: 'ADDEPAR_API_URL'
      //     value: addeparApiUrl
      //   }
      //   {
      //     name: 'ADDEPAR_CLIENT_ID'
      //     value: addeparClientId
      //   }
      //   {
      //     name: 'ADDEPAR_CLIENT_SECRET'
      //     value: addeparClientSecret
      //   }
      //   {
      //     name: 'ADDEPAR_FIRM'
      //     value: addeparFirm
      //   }
      //   {
      //     name: 'NEXTAUTH_SECRET'
      //     value: nextAuthSecret
      //   }
      //   {
      //     name: 'NEXTAUTH_URL'
      //     value: nextAuthUrl
      //   }
      // ]
    }
    httpsOnly: true
  }
  resource configAppSettings 'config' = {
    name: 'appsettings'
    properties: {
      // Azure Functions required settings with Managed Identity
      AzureWebJobsStorage__accountName: storage.name
      AzureWebJobsStorage__credential: 'managedidentity'
      AzureWebJobsStorage__clientId: userAssignedIdentity.properties.clientId

      FUNCTIONS_EXTENSION_VERSION: '~4'
      FUNCTIONS_WORKER_RUNTIME: 'node'

      // Application Insights with Managed Identity
      APPINSIGHTS_INSTRUMENTATIONKEY: applicationInsights.properties.InstrumentationKey
      APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
      APPLICATIONINSIGHTS_AUTHENTICATION_STRING: 'ClientId=${userAssignedIdentity.properties.clientId};Authorization=AAD'

      // Custom application settings
      AZURE_SQL_CONNECTION_STRING: azureSqlConnectionString
      AZURE_STORAGE_CONNECTION_STRING: azureStorageConnectionString
      AZURE_AD_CLIENT_ID: azureAdClientId
      AZURE_AD_CLIENT_SECRET: azureAdClientSecret
      AZURE_AD_TENANT_ID: azureAdTenantId
      AZURE_OPENAI_ENDPOINT: azureOpenAiEndpoint
      AZURE_OPENAI_API_KEY: azureOpenAiApiKey
      AZURE_OPENAI_DEPLOYMENT_NAME: azureOpenAiDeploymentName
      AZURE_SEARCH_ENDPOINT: azureSearchEndpoint
      AZURE_SEARCH_API_KEY: azureSearchApiKey
      AZURE_SEARCH_INDEX_NAME: azureSearchIndexName
      ADDEPAR_API_URL: addeparApiUrl
      ADDEPAR_CLIENT_ID: addeparClientId
      ADDEPAR_CLIENT_SECRET: addeparClientSecret
      ADDEPAR_FIRM: addeparFirm
      NEXTAUTH_SECRET: nextAuthSecret
      NEXTAUTH_URL: nextAuthUrl
    }
  }
}

// Outputs
output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output appInsightsName string = applicationInsights.name
output appInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
output functionStorageAccountName string = storage.name
