#!/bin/bash
# Sync shared library files from parent directory to azure-functions/lib
# This ensures the latest code is included in deployments

echo "Syncing library files from parent directory..."

set -e

# Get parent directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE_LIB="$PARENT_DIR/lib"
SOURCE_TYPES="$PARENT_DIR/types"
DEST_LIB="$SCRIPT_DIR/lib"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_LIB"

# List of library files to sync from lib/ directory
declare -a LIB_FILES=(
    "db/adapter.ts"
    "azure/openai.ts"
    "azure/search.ts"
    "ai/generators.ts"
    "ai/prompts.ts"
)

# Copy library files with import transformations
for file in "${LIB_FILES[@]}"; do
    SOURCE_PATH="$SOURCE_LIB/$file"
    DEST_PATH="$DEST_LIB/$file"
    DEST_DIR="$(dirname "$DEST_PATH")"
    
    # Create destination directory if needed
    mkdir -p "$DEST_DIR"
    
    if [ -f "$SOURCE_PATH" ]; then
        # Read and transform the file
        # Transform imports from @/ aliases to relative paths
        sed -e 's|from "@/lib/|from "../|g' \
            -e 's|from "@/types"|from "../types"|g' \
            "$SOURCE_PATH" > "$DEST_PATH"
        echo "  ✓ Synced: $file"
    else
        echo "  ⚠ Warning: Source file not found: $file"
    fi
done

# Copy types file from types/ directory (not lib/types/)
TYPES_SOURCE="$SOURCE_TYPES/index.ts"
TYPES_DEST="$DEST_LIB/types/index.ts"
TYPES_DEST_DIR="$(dirname "$TYPES_DEST")"

mkdir -p "$TYPES_DEST_DIR"

if [ -f "$TYPES_SOURCE" ]; then
    cp "$TYPES_SOURCE" "$TYPES_DEST"
    echo "  ✓ Synced: types/index.ts"
else
    echo "  ⚠ Warning: Source file not found: types/index.ts"
fi

# Keep stub implementations for ingestion files (not copying from parent)
echo "  ℹ Keeping stub implementations for ingestion files"

echo "Library sync complete!"
