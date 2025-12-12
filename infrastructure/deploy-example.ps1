# Example: Full Deployment Command
# This is an example showing how to call deploy.ps1 with all parameters for a full deployment
# Replace all placeholder values with your actual values

.\deploy.ps1 `
    -ResourceGroupName "rg-insightstudio-prod" `
    -Location "eastus2" `
    -SqlAdminUsername "sqladmin" `
    -SqlAdminPassword (ConvertTo-SecureString -String "YourSecureSqlPassword123!" -AsPlainText -Force) `
    -AzureAdClientId "12345678-1234-1234-1234-123456789012" `
    -AzureAdClientSecret (ConvertTo-SecureString -String "YourAzureAdClientSecret" -AsPlainText -Force) `
    -AzureAdTenantId "87654321-4321-4321-4321-210987654321" `
    -AzureOpenAiEndpoint "https://your-openai-resource.openai.azure.com/" `
    -AzureOpenAiApiKey (ConvertTo-SecureString -String "YourOpenAiApiKey" -AsPlainText -Force) `
    -AzureOpenAiDeploymentName "gpt-4" `
    -AzureSearchEndpoint "https://your-search-service.search.windows.net" `
    -AzureSearchApiKey (ConvertTo-SecureString -String "YourSearchApiKey" -AsPlainText -Force) `
    -AzureSearchIndexName "insightstudio-index" `
    -NextAuthSecret (ConvertTo-SecureString -String "YourNextAuthSecretKeyHere" -AsPlainText -Force) `
    -AddeparApiUrl "https://api.addepar.com" `
    -AddeparClientId "your-addepar-client-id" `
    -AddeparClientSecret (ConvertTo-SecureString -String "YourAddeparClientSecret" -AsPlainText -Force) `
    -AddeparFirm "your-firm-name" `
    -AppServicePlanSku "S1" `
    -AppServicePlanSkuName "S1" `
    -SaveOutputs

# Alternative: Interactive version (prompts for secrets)
# This version will prompt you to enter secrets securely without showing them in the command line
# Uncomment and use this if you prefer not to have secrets in your command history

# $sqlPassword = Read-Host "Enter SQL Admin Password" -AsSecureString
# $azureAdSecret = Read-Host "Enter Azure AD Client Secret" -AsSecureString
# $openAiKey = Read-Host "Enter Azure OpenAI API Key" -AsSecureString
# $searchKey = Read-Host "Enter Azure Search API Key" -AsSecureString
# $nextAuthSecret = Read-Host "Enter NextAuth Secret" -AsSecureString
# $addeparSecret = Read-Host "Enter Addepar Client Secret" -AsSecureString

# .\deploy.ps1 `
#     -ResourceGroupName "rg-insightstudio-prod" `
#     -Location "eastus2" `
#     -SqlAdminUsername "sqladmin" `
#     -SqlAdminPassword $sqlPassword `
#     -AzureAdClientId "12345678-1234-1234-1234-123456789012" `
#     -AzureAdClientSecret $azureAdSecret `
#     -AzureAdTenantId "87654321-4321-4321-4321-210987654321" `
#     -AzureOpenAiEndpoint "https://your-openai-resource.openai.azure.com/" `
#     -AzureOpenAiApiKey $openAiKey `
#     -AzureOpenAiDeploymentName "gpt-4" `
#     -AzureSearchEndpoint "https://your-search-service.search.windows.net" `
#     -AzureSearchApiKey $searchKey `
#     -AzureSearchIndexName "insightstudio-index" `
#     -NextAuthSecret $nextAuthSecret `
#     -AddeparApiUrl "https://api.addepar.com" `
#     -AddeparClientId "your-addepar-client-id" `
#     -AddeparClientSecret $addeparSecret `
#     -AddeparFirm "your-firm-name" `
#     -AppServicePlanSku "S1" `
#     -AppServicePlanSkuName "S1" `
#     -SaveOutputs

