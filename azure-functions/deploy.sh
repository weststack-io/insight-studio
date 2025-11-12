#!/bin/bash
# Azure Functions Deployment Script
# This script prepares and deploys the Azure Functions with compiled lib dependencies

set -e

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <function-app-name>"
    exit 1
fi

FUNCTION_APP_NAME=$1
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Building Azure Functions..."
cd "$SCRIPT_DIR"
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful!"

# Copy compiled files to match Azure Functions expected structure
# Azure Functions expects: azure-functions/weekly-briefings/index.js and lib/ at root
echo "Preparing deployment structure..."

DIST_LIB_PATH="$SCRIPT_DIR/dist/lib"
TARGET_LIB_PATH="$PROJECT_ROOT/lib"

if [ -d "$DIST_LIB_PATH" ]; then
    echo "Copying compiled lib files to root lib/ directory..."
    # Copy only .js files to preserve .ts source files
    find "$DIST_LIB_PATH" -name "*.js" -type f | while read -r jsfile; do
        relpath="${jsfile#$DIST_LIB_PATH/}"
        targetfile="$TARGET_LIB_PATH/$relpath"
        targetdir=$(dirname "$targetfile")
        mkdir -p "$targetdir"
        cp "$jsfile" "$targetfile"
    done
fi

# Copy compiled types
DIST_TYPES_PATH="$SCRIPT_DIR/dist/types"
TARGET_TYPES_PATH="$PROJECT_ROOT/types"

if [ -d "$DIST_TYPES_PATH" ]; then
    echo "Copying compiled types..."
    find "$DIST_TYPES_PATH" -name "*.js" -type f | while read -r jsfile; do
        relpath="${jsfile#$DIST_TYPES_PATH/}"
        targetfile="$TARGET_TYPES_PATH/$relpath"
        targetdir=$(dirname "$targetfile")
        mkdir -p "$targetdir"
        cp "$jsfile" "$targetfile"
    done
fi

# Copy compiled function files to azure-functions directory structure
DIST_FUNCTION_PATH="$SCRIPT_DIR/dist/azure-functions/weekly-briefings"
TARGET_FUNCTION_PATH="$SCRIPT_DIR/weekly-briefings"

if [ -d "$DIST_FUNCTION_PATH" ]; then
    echo "Copying compiled function files..."
    cp "$DIST_FUNCTION_PATH"/*.js "$TARGET_FUNCTION_PATH/" 2>/dev/null || true
fi

# Deploy from project root
echo "Deploying to Azure Function App: $FUNCTION_APP_NAME"
cd "$PROJECT_ROOT"

func azure functionapp publish "$FUNCTION_APP_NAME" --javascript

if [ $? -ne 0 ]; then
    echo "Deployment failed!"
    exit 1
fi

echo "Deployment successful!"

