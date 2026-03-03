param(
    [string]$ResourceGroup = "rg-insight-studio-centralus-dev",
    [string]$AppServiceName = "app-insightstudio-bfnfaxmvsmmgc"
)

Write-Host "🚀 Starting Next.js web deployment..." -ForegroundColor Cyan

# 1️⃣ Install dependencies
Write-Host "📦 Installing dependencies..."
npm install

# 1.5️⃣ Generate Prisma Client with Linux binaries
Write-Host "🔧 Generating Prisma Client with Linux binaries..."
npm run db:generate

# Verify Linux binary was generated
Write-Host "🔍 Verifying Prisma binaries..."
$prismaBinPath = "node_modules\.prisma\client\query-engine-debian-openssl-3.0.x"
if (Test-Path $prismaBinPath) {
    Write-Host "   ✅ Linux binary found: $prismaBinPath" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Warning: Linux binary not found at $prismaBinPath" -ForegroundColor Yellow
    Write-Host "   Checking for alternative locations..."
    $altPaths = @(
        "node_modules\.prisma\client\*debian*",
        "node_modules\@prisma\engines\*debian*"
    )
    $found = $false
    foreach ($path in $altPaths) {
        if (Test-Path $path) {
            Write-Host "   ✅ Found binary at: $path" -ForegroundColor Green
            $found = $true
            break
        }
    }
    if (-not $found) {
        Write-Host "   ❌ Linux binary not found. This may cause issues on Azure." -ForegroundColor Red
    }
}

# 2️⃣ Build Next.js app in standalone mode
Write-Host "🏗 Building Next.js app (standalone mode)..."
npm run build

# 2.5️⃣ Verify standalone build exists
Write-Host "🔍 Verifying standalone build..."
if (-not (Test-Path ".next\standalone")) {
    Write-Host "   ❌ ERROR: .next\standalone directory not found!" -ForegroundColor Red
    Write-Host "   Make sure next.config.js has 'output: \"standalone\"'" -ForegroundColor Yellow
    exit 1
}

# Check for server.js in standalone folder
$serverJsPath = ".next\standalone\server.js"
if (-not (Test-Path $serverJsPath)) {
    Write-Host "   ⚠️  Warning: server.js not found at $serverJsPath" -ForegroundColor Yellow
    Write-Host "   Checking for alternative locations..."
    $altServerPaths = @(
        ".next\standalone\server.js",
        ".next\standalone\*.js"
    )
    $found = $false
    Get-ChildItem -Path ".next\standalone" -Filter "*.js" -File | ForEach-Object {
        Write-Host "   Found: $($_.FullName)" -ForegroundColor Cyan
        if ($_.Name -eq "server.js") {
            $found = $true
        }
    }
    if (-not $found) {
        Write-Host "   ❌ ERROR: server.js not found in standalone build!" -ForegroundColor Red
        Write-Host "   Listing contents of .next\standalone:" -ForegroundColor Yellow
        Get-ChildItem -Path ".next\standalone" | ForEach-Object {
            Write-Host "     - $($_.Name) ($($_.PSIsContainer ? 'Directory' : 'File'))" -ForegroundColor Gray
        }
        exit 1
    }
}
else {
    Write-Host "   ✅ server.js found at $serverJsPath" -ForegroundColor Green
}

# 3️⃣ Remove any old deploy folder
Write-Host "🧹 Cleaning old deploy folder..."
Remove-Item -Recurse -Force .\webdeploy -ErrorAction SilentlyContinue

# 4️⃣ Create deploy folder
New-Item -ItemType Directory -Path .\webdeploy | Out-Null

# 5️⃣ Copy standalone server files
Write-Host "📂 Copying standalone server files..."
Copy-Item -Path ".next\standalone\*" -Destination ".\webdeploy" -Recurse

# 5.1️⃣ Verify server.js was copied
Write-Host "🔍 Verifying server.js was copied..."
if (-not (Test-Path ".\webdeploy\server.js")) {
    Write-Host "   ❌ ERROR: server.js not found in webdeploy folder after copy!" -ForegroundColor Red
    Write-Host "   Listing contents of webdeploy:" -ForegroundColor Yellow
    Get-ChildItem -Path ".\webdeploy" | ForEach-Object {
        Write-Host "     - $($_.Name) ($($_.PSIsContainer ? 'Directory' : 'File'))" -ForegroundColor Gray
    }
    exit 1
}
else {
    Write-Host "   ✅ server.js verified in webdeploy folder" -ForegroundColor Green
}

# 5.5️⃣ Copy Prisma client and binaries (critical for Linux deployment)
Write-Host "📂 Copying Prisma client and binaries..."
# Copy from source node_modules (where we generated with both binaries)
if (Test-Path "node_modules\.prisma") {
    $prismaDest = ".\webdeploy\node_modules\.prisma"
    if (-not (Test-Path $prismaDest)) {
        New-Item -ItemType Directory -Path $prismaDest -Force | Out-Null
    }
    Write-Host "   Copying .prisma binaries..."
    Copy-Item -Path "node_modules\.prisma\*" -Destination $prismaDest -Recurse -Force
}

# Also check if standalone build has its own node_modules
if (Test-Path ".next\standalone\node_modules\.prisma") {
    $prismaDest = ".\webdeploy\node_modules\.prisma"
    if (-not (Test-Path $prismaDest)) {
        New-Item -ItemType Directory -Path $prismaDest -Force | Out-Null
    }
    Write-Host "   Copying .prisma binaries from standalone build..."
    Copy-Item -Path ".next\standalone\node_modules\.prisma\*" -Destination $prismaDest -Recurse -Force
}

# Ensure @prisma/client is in place
if (Test-Path "node_modules\@prisma\client") {
    $prismaClientDest = ".\webdeploy\node_modules\@prisma\client"
    if (-not (Test-Path $prismaClientDest)) {
        New-Item -ItemType Directory -Path $prismaClientDest -Force | Out-Null
    }
    Write-Host "   Copying @prisma/client..."
    Copy-Item -Path "node_modules\@prisma\client\*" -Destination $prismaClientDest -Recurse -Force
}

# 6️⃣ Copy static assets
Write-Host "📂 Copying static assets..."
New-Item -ItemType Directory -Path ".\webdeploy\.next\static" -Force | Out-Null
Copy-Item -Path ".next\static\*" -Destination ".\webdeploy\.next\static" -Recurse

# 7️⃣ Copy public assets (if any)
if (Test-Path ".\public") {
    Write-Host "📂 Copying public assets..."
    Copy-Item -Path ".\public\*" -Destination ".\webdeploy\public" -Recurse
}

# 8️⃣ Copy package.json, package-lock.json, and Prisma schema
Write-Host "📂 Copying package.json, package-lock.json, and Prisma files..."
Copy-Item -Path "package.json" -Destination ".\webdeploy"
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination ".\webdeploy"
}
# Copy Prisma schema and config so postinstall can regenerate if needed
if (Test-Path "prisma") {
    New-Item -ItemType Directory -Path ".\webdeploy\prisma" -Force | Out-Null
    Copy-Item -Path "prisma\schema.prisma" -Destination ".\webdeploy\prisma\" -Force
    if (Test-Path "prisma\config.ts") {
        Copy-Item -Path "prisma\config.ts" -Destination ".\webdeploy\prisma\" -Force
    }
}

# 8.2️⃣ Ensure node_modules has 'next' (standalone trace can omit it)
# server.js requires('next') at runtime; without it you get "Cannot find module 'next'"
if (-not (Test-Path ".\webdeploy\node_modules\next")) {
    Write-Host "📦 Installing production deps in webdeploy (next not in standalone trace)..."
    Push-Location ".\webdeploy"
    try {
        npm install --omit=dev
        if (-not (Test-Path "node_modules\next")) {
            Write-Host "   ❌ ERROR: next still missing after npm install" -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✅ node_modules/next installed" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "   ✅ node_modules/next present from standalone" -ForegroundColor Green
}

# 8.5️⃣ Final verification before zipping
Write-Host "🔍 Final verification of webdeploy folder..."
if (-not (Test-Path ".\webdeploy\server.js")) {
    Write-Host "   ❌ ERROR: server.js missing from webdeploy folder!" -ForegroundColor Red
    Write-Host "   Contents of webdeploy folder:" -ForegroundColor Yellow
    Get-ChildItem -Path ".\webdeploy" -Recurse -Depth 2 | ForEach-Object {
        $relativePath = $_.FullName.Replace("$PWD\webdeploy\", "")
        Write-Host "     $relativePath" -ForegroundColor Gray
    }
    exit 1
}
Write-Host "   ✅ All critical files verified" -ForegroundColor Green

# 9️⃣ Zip the deploy folder
Write-Host "🗜 Creating deployment zip..."
Compress-Archive -Path ".\webdeploy\*" -DestinationPath "webdeploy.zip" -Force

# 9.5️⃣ Verify zip contains server.js
Write-Host "🔍 Verifying deployment zip contents..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("$PWD\webdeploy.zip")
$serverJsInZip = $zip.Entries | Where-Object { $_.Name -eq "server.js" -and $_.FullName -notlike "*/node_modules/*" }
$zip.Dispose()

if ($serverJsInZip) {
    Write-Host "   ✅ server.js found in zip at: $($serverJsInZip.FullName)" -ForegroundColor Green
}
else {
    Write-Host "   ❌ ERROR: server.js not found in deployment zip!" -ForegroundColor Red
    Write-Host "   Listing top-level files in zip:" -ForegroundColor Yellow
    $zip = [System.IO.Compression.ZipFile]::OpenRead("$PWD\webdeploy.zip")
    $topLevelFiles = $zip.Entries | Where-Object { $_.FullName -notlike "*/*" } | Select-Object -First 20
    foreach ($entry in $topLevelFiles) {
        Write-Host "     - $($entry.FullName)" -ForegroundColor Gray
    }
    $zip.Dispose()
    exit 1
}

# 🔟 Deploy to Azure App Service
Write-Host "☁ Deploying to Azure App Service..."
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --src webdeploy.zip `
    --verbose

# 🔟.5️⃣ Verify startup command
Write-Host "🔍 Checking Azure App Service startup command..."
$startupCmd = az webapp config show --resource-group $ResourceGroup --name $AppServiceName --query "appCommandLine" -o tsv 2>$null
if ([string]::IsNullOrWhiteSpace($startupCmd)) {
    Write-Host "   ⚠️  No startup command configured. Setting to 'node server.js'..." -ForegroundColor Yellow
    az webapp config set `
        --resource-group $ResourceGroup `
        --name $AppServiceName `
        --startup-file "node server.js" | Out-Null
    Write-Host "   ✅ Startup command set to 'node server.js'" -ForegroundColor Green
}
else {
    Write-Host "   Current startup command: $startupCmd" -ForegroundColor Cyan
    if ($startupCmd -notlike "*server.js*") {
        Write-Host "   ⚠️  Warning: Startup command doesn't reference server.js" -ForegroundColor Yellow
        Write-Host "   Consider updating to: node server.js" -ForegroundColor Yellow
    }
}

Write-Host "✅ Web deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. If the app still fails, check the startup command in Azure Portal:" -ForegroundColor White
Write-Host "      Settings → Configuration → General settings → Startup Command" -ForegroundColor Gray
Write-Host "   2. Startup command should be: node server.js" -ForegroundColor White
Write-Host "   3. Or with Prisma: ./node_modules/.bin/prisma generate && node server.js" -ForegroundColor White