#!/bin/bash
# Insight Studio Infrastructure Deployment Script
# This script deploys Azure SQL Database and Blob Storage using Bicep

set -e

# Default values
RESOURCE_GROUP_NAME="rg-insightstudio"
LOCATION="eastus"
SAVE_OUTPUTS=false

# Parse arguments
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
        -u|--sql-username)
            SQL_USERNAME="$2"
            shift 2
            ;;
        -p|--sql-password)
            SQL_PASSWORD="$2"
            shift 2
            ;;
        -s|--save-outputs)
            SAVE_OUTPUTS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -g, --resource-group NAME    Resource group name (default: rg-insightstudio)"
            echo "  -l, --location LOCATION      Azure location (default: eastus)"
            echo "  -u, --sql-username USERNAME   SQL admin username (required)"
            echo "  -p, --sql-password PASSWORD SQL admin password (required)"
            echo "  -s, --save-outputs          Save outputs to file"
            echo "  -h, --help                   Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check required parameters
if [ -z "$SQL_USERNAME" ] || [ -z "$SQL_PASSWORD" ]; then
    echo "Error: SQL username and password are required"
    echo "Use -u/--sql-username and -p/--sql-password"
    exit 1
fi

echo "========================================="
echo "Insight Studio Infrastructure Deployment"
echo "========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed."
    echo "Please install Azure CLI from: https://aka.ms/installazurecli"
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

# Create resource group if it doesn't exist
echo "Checking resource group..."
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "Creating resource group: $RESOURCE_GROUP_NAME"
    az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create resource group."
        exit 1
    fi
else
    echo "Resource group already exists."
fi

# Deploy infrastructure
echo ""
echo "Deploying infrastructure..."
DEPLOYMENT_NAME="insightstudio-deployment-$(date +%Y%m%d-%H%M%S)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$SCRIPT_DIR/main.bicep" \
    --parameters sqlAdminUsername="$SQL_USERNAME" sqlAdminPassword="$SQL_PASSWORD" location="$LOCATION"

if [ $? -ne 0 ]; then
    echo "Error: Deployment failed."
    exit 1
fi

echo ""
echo "Deployment completed successfully!"
echo ""

# Get outputs
echo "Retrieving deployment outputs..."
OUTPUTS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs \
    --output json)

echo ""
echo "========================================="
echo "Deployment Outputs"
echo "========================================="
echo ""
echo "SQL Server Name: $(echo $OUTPUTS | jq -r '.sqlServerName.value')"
echo "SQL Database Name: $(echo $OUTPUTS | jq -r '.sqlDatabaseName.value')"
echo "Storage Account Name: $(echo $OUTPUTS | jq -r '.storageAccountName.value')"
echo "Blob Container Name: $(echo $OUTPUTS | jq -r '.blobContainerName.value')"
echo ""

# Save outputs to file if requested
if [ "$SAVE_OUTPUTS" = true ]; then
    OUTPUT_FILE="$SCRIPT_DIR/deployment-outputs.json"
    echo "$OUTPUTS" > "$OUTPUT_FILE"
    echo "Outputs saved to: $OUTPUT_FILE"
    echo ""
fi

# Display connection strings
echo "========================================="
echo "Connection Strings"
echo "========================================="
echo ""
echo "SQL Connection String (Azure format):"
echo "$(echo $OUTPUTS | jq -r '.sqlConnectionString.value')"
echo ""
echo "SQL Connection String (Prisma format - USE THIS):"
echo "$(echo $OUTPUTS | jq -r '.sqlConnectionStringPrisma.value')"
echo ""
echo "Storage Connection String:"
echo "$(echo $OUTPUTS | jq -r '.storageConnectionString.value')"
echo ""

echo "Next Steps:"
echo "1. Add these connection strings to your .env file"
echo "2. Update SQL firewall rules to allow your IP address"
echo "3. Run 'npm run db:push' to set up the database schema"
echo ""

