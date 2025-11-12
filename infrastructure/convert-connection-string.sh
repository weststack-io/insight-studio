#!/bin/bash
# Convert Azure SQL Connection String to Prisma Format
# Usage: ./convert-connection-string.sh "Server=tcp:server.database.windows.net,1433;Initial Catalog=dbname;User ID=user;Password=pass;..."

if [ -z "$1" ]; then
    echo "Error: Connection string is required"
    echo "Usage: $0 \"Server=tcp:...\""
    exit 1
fi

CONNECTION_STRING="$1"

# Extract components using sed/awk
SERVER=$(echo "$CONNECTION_STRING" | sed -n 's/.*Server=tcp:\([^,]*\).*/\1/p')
DATABASE=$(echo "$CONNECTION_STRING" | sed -n 's/.*Initial Catalog=\([^;]*\).*/\1/p')
USER_ID=$(echo "$CONNECTION_STRING" | sed -n 's/.*User ID=\([^;]*\).*/\1/p')
PASSWORD=$(echo "$CONNECTION_STRING" | sed -n 's/.*Password=\([^;]*\).*/\1/p')

if [ -z "$SERVER" ] || [ -z "$DATABASE" ] || [ -z "$USER_ID" ] || [ -z "$PASSWORD" ]; then
    echo "Error: Could not parse connection string. Make sure it contains Server, Initial Catalog, User ID, and Password."
    exit 1
fi

# Build Prisma connection string (using semicolon-separated format)
# Special characters in password may need curly braces if they are in the list: :\=;/[]{}
# For most passwords, we can use them directly
PRISMA_CONNECTION_STRING="sqlserver://${SERVER}:1433;database=${DATABASE};user=${USER_ID};password=${PASSWORD};encrypt=true;trustServerCertificate=false"

echo ""
echo "Prisma Connection String:"
echo "$PRISMA_CONNECTION_STRING"
echo ""
echo "Add this to your .env file as:"
echo "AZURE_SQL_CONNECTION_STRING=$PRISMA_CONNECTION_STRING"
echo ""

