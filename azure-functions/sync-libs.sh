#!/bin/bash
# Sync shared library files from parent directory to azure-functions/lib
# This ensures the latest code is included in deployments

echo "Syncing library files from parent directory..."

set -e

# Get parent directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE_LIB="$PARENT_DIR/lib"
DEST_LIB="$SCRIPT_DIR/lib"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_LIB"

# List of files to sync
declare -a SYNC_FILES=(
    "db/adapter.ts"
    "azure/openai.ts"
    "azure/search.ts"
    "ai/generators.ts"
    "ai/prompts.ts"
    "types/index.ts"
)

# Copy each file
for file in "${SYNC_FILES[@]}"; do
    SOURCE_PATH="$SOURCE_LIB/$file"
    DEST_PATH="$DEST_LIB/$file"
    DEST_DIR="$(dirname "$DEST_PATH")"
    
    # Create destination directory if needed
    mkdir -p "$DEST_DIR"
    
    if [ -f "$SOURCE_PATH" ]; then
        cp "$SOURCE_PATH" "$DEST_PATH"
        echo "  ✓ Synced: $file"
    else
        echo "  ⚠ Warning: Source file not found: $file"
    fi
done

# Keep stub implementations for ingestion files (not copying from parent)
echo "  ℹ Keeping stub implementations for ingestion files"

echo "Library sync complete!"
