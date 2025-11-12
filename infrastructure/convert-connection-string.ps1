# Convert Azure SQL Connection String to Prisma Format
# Usage: .\convert-connection-string.ps1 "Server=tcp:server.database.windows.net,1433;Initial Catalog=dbname;User ID=user;Password=pass;..."

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString
)

# Parse the Azure connection string
$server = ""
$database = ""
$userId = ""
$password = ""

$parts = $ConnectionString -split ';'
foreach ($part in $parts) {
    if ($part -match 'Server=tcp:(.+),(\d+)') {
        $server = $matches[1]
    }
    elseif ($part -match 'Initial Catalog=(.+)') {
        $database = $matches[1]
    }
    elseif ($part -match 'User ID=(.+)') {
        $userId = $matches[1]
    }
    elseif ($part -match 'Password=(.+)') {
        $password = $matches[1]
    }
}

if (-not $server -or -not $database -or -not $userId -or -not $password) {
    Write-Host "Error: Could not parse connection string. Make sure it contains Server, Initial Catalog, User ID, and Password." -ForegroundColor Red
    exit 1
}

# Build Prisma connection string (using semicolon-separated format)
# Special characters in password may need curly braces if they are in the list: :\=;/[]{}
# For most passwords, we can use them directly
$prismaConnectionString = "sqlserver://${server}:1433;database=${database};user=${userId};password=${password};encrypt=true;trustServerCertificate=false"

Write-Host ""
Write-Host "Prisma Connection String:" -ForegroundColor Green
Write-Host $prismaConnectionString -ForegroundColor White
Write-Host ""
Write-Host "Add this to your .env file as:" -ForegroundColor Yellow
Write-Host "AZURE_SQL_CONNECTION_STRING=$prismaConnectionString" -ForegroundColor White
Write-Host ""

