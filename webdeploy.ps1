param(
    [string]$ResourceGroup = "rg-insight-studio-centralus-dev",
    [string]$AppServiceName = "app-insightstudio-bfnfaxmvsmmgc"
)

Write-Host "🚀 Starting Next.js web deployment..." -ForegroundColor Cyan

# 1️⃣ Install dependencies
Write-Host "📦 Installing dependencies..."
npm install

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

# 6️⃣ Copy static assets
Write-Host "📂 Copying static assets..."
New-Item -ItemType Directory -Path ".\webdeploy\.next\static" -Force | Out-Null
Copy-Item -Path ".next\static\*" -Destination ".\webdeploy\.next\static" -Recurse

# 7️⃣ Copy public assets (if any)
if (Test-Path ".\public") {
    Write-Host "📂 Copying public assets..."
    Copy-Item -Path ".\public\*" -Destination ".\webdeploy\public" -Recurse
}

# 8️⃣ Copy package.json and package-lock.json
Write-Host "📂 Copying package.json and package-lock.json..."
Copy-Item -Path "package.json" -Destination ".\webdeploy"
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination ".\webdeploy"
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