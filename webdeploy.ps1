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
} else {
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

# 3️⃣ Remove any old deploy folder
Write-Host "🧹 Cleaning old deploy folder..."
Remove-Item -Recurse -Force .\webdeploy -ErrorAction SilentlyContinue

# 4️⃣ Create deploy folder
New-Item -ItemType Directory -Path .\webdeploy | Out-Null

# 5️⃣ Copy standalone server files
Write-Host "📂 Copying standalone server files..."
Copy-Item -Path ".next\standalone\*" -Destination ".\webdeploy" -Recurse

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

# 9️⃣ Zip the deploy folder
Write-Host "🗜 Creating deployment zip..."
Compress-Archive -Path ".\webdeploy\*" -DestinationPath "webdeploy.zip" -Force

# 🔟 Deploy to Azure App Service
Write-Host "☁ Deploying to Azure App Service..."
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --src webdeploy.zip `
    --verbose

Write-Host "✅ Web deployment complete!" -ForegroundColor Green