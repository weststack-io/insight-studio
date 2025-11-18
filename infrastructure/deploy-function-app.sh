#!/bin/bash

# Insight Studio Function App Deployment Script
# This script deploys only the Azure Function App infrastructure

set -e

# Default values
RESOURCE_GROUP_NAME="rg-insightstudio"
LOCATION="eastus2"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"
ADDEPAR_API_URL="https://api.addepar.com"
ADDEPAR_CLIENT_ID=""
ADDEPAR_CLIENT_SECRET=""
ADDEPAR_FIRM=""
NEXTAUTH_URL="http://localhost:3000"
FUNCTION_APP_NAME=""
SAVE_OUTPUTS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP_NAME="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        --sql-connection-string)
            AZURE_SQL_CONNECTION_STRING="$2"
            shift 2
            ;;
        --storage-connection-string)
            AZURE_STORAGE_CONNECTION_STRING="$2"
            shift 2
            ;;
        --azure-ad-client-id)
            AZURE_AD_CLIENT_ID="$2"
            shift 2
            ;;
        --azure-ad-client-secret)
            AZURE_AD_CLIENT_SECRET="$2"
            shift 2
            ;;
        --azure-ad-tenant-id)
            AZURE_AD_TENANT_ID="$2"
            shift 2
            ;;
        --azure-openai-endpoint)
            AZURE_OPENAI_ENDPOINT="$2"
            shift 2
            ;;
        --azure-openai-api-key)
            AZURE_OPENAI_API_KEY="$2"
            shift 2
            ;;
        --azure-openai-deployment-name)
            AZURE_OPENAI_DEPLOYMENT_NAME="$2"
            shift 2
            ;;
        --azure-search-endpoint)
            AZURE_SEARCH_ENDPOINT="$2"
            shift 2
            ;;
        --azure-search-api-key)
            AZURE_SEARCH_API_KEY="$2"
            shift 2
            ;;
        --azure-search-index-name)
            AZURE_SEARCH_INDEX_NAME="$2"
            shift 2
            ;;
        --addepar-api-url)
            ADDEPAR_API_URL="$2"
            shift 2
            ;;
        --addepar-client-id)
            ADDEPAR_CLIENT_ID="$2"
            shift 2
            ;;
        --addepar-client-secret)
            ADDEPAR_CLIENT_SECRET="$2"
            shift 2
            ;;
        --addepar-firm)
            ADDEPAR_FIRM="$2"
            shift 2
            ;;
        --next-auth-secret)
            NEXT_AUTH_SECRET="$2"
            shift 2
            ;;
        --next-auth-url)
            NEXTAUTH_URL="$2"
            shift 2
            ;;
        --function-app-name)
            FUNCTION_APP_NAME="$2"
            shift 2
            ;;
        --save-outputs)
            SAVE_OUTPUTS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Required options:"
            echo "  --sql-connection-string STRING     Azure SQL connection string"
            echo "  --storage-connection-string STRING Azure Storage connection string"
            echo "  --azure-ad-client-id STRING        Azure AD Client ID"
            echo "  --azure-ad-client-secret STRING    Azure AD Client Secret"
            echo "  --azure-ad-tenant-id STRING        Azure AD Tenant ID"
            echo "  --azure-openai-endpoint STRING     Azure OpenAI endpoint"
            echo "  --azure-openai-api-key STRING      Azure OpenAI API key"
            echo "  --azure-search-endpoint STRING     Azure AI Search endpoint"
            echo "  --azure-search-api-key STRING      Azure AI Search API key"
            echo "  --azure-search-index-name STRING   Azure AI Search index name"
            echo "  --next-auth-secret STRING          NextAuth secret"
            echo ""
            echo "Optional options:"
            echo "  -g, --resource-group NAME          Resource group name (default: rg-insightstudio)"
            echo "  -l, --location LOCATION            Azure location (default: eastus2)"
            echo "  --azure-openai-deployment-name     OpenAI deployment name (default: gpt-4)"
            echo "  --addepar-api-url URL              Addepar API URL (default: https://api.addepar.com)"
            echo "  --addepar-client-id STRING          Addepar Client ID (optional)"
            echo "  --addepar-client-secret STRING      Addepar Client Secret (optional)"
            echo "  --addepar-firm STRING               Addepar Firm (optional)"
            echo "  --next-auth-url URL                 NextAuth URL (default: http://localhost:3000)"
            echo "  --function-app-name NAME            Function App name (auto-generated if not provided)"
            echo "  --save-outputs                      Save outputs to JSON file"
            echo "  -h, --help                         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$AZURE_SQL_CONNECTION_STRING" ]] || \
   [[ -z "$AZURE_STORAGE_CONNECTION_STRING" ]] || \
   [[ -z "$AZURE_AD_CLIENT_ID" ]] || \
   [[ -z "$AZURE_AD_CLIENT_SECRET" ]] || \
   [[ -z "$AZURE_AD_TENANT_ID" ]] || \
   [[ -z "$AZURE_OPENAI_ENDPOINT" ]] || \
   [[ -z "$AZURE_OPENAI_API_KEY" ]] || \
   [[ -z "$AZURE_SEARCH_ENDPOINT" ]] || \
   [[ -z "$AZURE_SEARCH_API_KEY" ]] || \
   [[ -z "$AZURE_SEARCH_INDEX_NAME" ]] || \
   [[ -z "$NEXT_AUTH_SECRET" ]]; then
    echo "Error: Missing required parameters"
    echo "Use --help for usage information"
    exit 1
fi

echo "========================================="
echo "Insight Studio Function App Deployment"
echo "========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed."
    echo "Please install Azure CLI from: https://aka.ms/installazureclilinux"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Not logged in to Azure. Logging in..."
    az login
    if [ $? -ne 0 ]; then
        echo "Error: Failed to login to Azure."
        exit 1
    fi
fi

# Check if resource group exists
echo "Checking resource group..."
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "Error: Resource group '$RESOURCE_GROUP_NAME' does not exist."
    echo "Please create the resource group first or deploy the main infrastructure."
    exit 1
fi
echo "Resource group exists."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Build parameters array
PARAMS=(
    "azureSqlConnectionString=\"$AZURE_SQL_CONNECTION_STRING\""
    "azureStorageConnectionString=\"$AZURE_STORAGE_CONNECTION_STRING\""
    "azureAdClientId=$AZURE_AD_CLIENT_ID"
    "azureAdClientSecret=$AZURE_AD_CLIENT_SECRET"
    "azureAdTenantId=$AZURE_AD_TENANT_ID"
    "azureOpenAiEndpoint=$AZURE_OPENAI_ENDPOINT"
    "azureOpenAiApiKey=$AZURE_OPENAI_API_KEY"
    "azureOpenAiDeploymentName=$AZURE_OPENAI_DEPLOYMENT_NAME"
    "azureSearchEndpoint=$AZURE_SEARCH_ENDPOINT"
    "azureSearchApiKey=$AZURE_SEARCH_API_KEY"
    "azureSearchIndexName=$AZURE_SEARCH_INDEX_NAME"
    "addeparApiUrl=$ADDEPAR_API_URL"
    "addeparClientId=$ADDEPAR_CLIENT_ID"
    "addeparClientSecret=$ADDEPAR_CLIENT_SECRET"
    "addeparFirm=$ADDEPAR_FIRM"
    "nextAuthSecret=$NEXT_AUTH_SECRET"
    "nextAuthUrl=$NEXTAUTH_URL"
    "location=$LOCATION"
)

if [[ -n "$FUNCTION_APP_NAME" ]]; then
    PARAMS+=("functionAppName=$FUNCTION_APP_NAME")
fi

# Deploy infrastructure
echo ""
echo "Deploying Function App infrastructure..."
DEPLOYMENT_NAME="functionapp-deployment-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$SCRIPT_DIR/function-app.bicep" \
    --parameters "${PARAMS[@]}"

if [ $? -ne 0 ]; then
    echo "Error: Deployment failed."
    exit 1
fi

echo ""
echo "Deployment completed successfully!"
echo ""

# Get outputs
echo "Retrieving deployment outputs..."
OUTPUTS_JSON=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs \
    --output json)

if [ $? -ne 0 ]; then
    echo "Error: Failed to retrieve deployment outputs."
    exit 1
fi

echo ""
echo "========================================="
echo "Deployment Outputs"
echo "========================================="
echo ""

FUNCTION_APP_NAME_OUTPUT=$(echo "$OUTPUTS_JSON" | jq -r '.functionAppName.value')
FUNCTION_APP_URL=$(echo "$OUTPUTS_JSON" | jq -r '.functionAppUrl.value')
APP_INSIGHTS_NAME=$(echo "$OUTPUTS_JSON" | jq -r '.appInsightsName.value')
FUNCTION_STORAGE_ACCOUNT=$(echo "$OUTPUTS_JSON" | jq -r '.functionStorageAccountName.value')

echo "Function App Name: $FUNCTION_APP_NAME_OUTPUT"
echo "Function App URL: $FUNCTION_APP_URL"
echo "Application Insights Name: $APP_INSIGHTS_NAME"
echo "Function Storage Account: $FUNCTION_STORAGE_ACCOUNT"
echo ""

# Save outputs to file if requested
if [ "$SAVE_OUTPUTS" = true ]; then
    OUTPUT_FILE="$SCRIPT_DIR/function-app-outputs.json"
    echo "$OUTPUTS_JSON" | jq '.' > "$OUTPUT_FILE"
    echo "Outputs saved to: $OUTPUT_FILE"
    echo ""
fi

echo "Next Steps:"
echo "1. Deploy the function code using: func azure functionapp publish $FUNCTION_APP_NAME_OUTPUT"
echo "2. Verify the function is running in the Azure Portal"
echo ""






