# Azure App Service SSH Access Guide

This guide explains how to access your Azure App Service via SSH to run commands manually, such as `prisma generate`.

## Method 1: SSH via Azure Portal (Easiest)

1. **Navigate to your App Service in Azure Portal**

   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to: **App Services** → Your App Service Name

2. **Open SSH Console**

   - In the left sidebar, under **Development Tools**, click **SSH**
   - Or go to: **Development Tools** → **Console** → **SSH**

3. **You'll be connected to the container**
   - You'll see a bash prompt like: `root@<container-id>:/home#`

## Method 2: SSH via Azure CLI

1. **Open Azure Cloud Shell or your terminal with Azure CLI**

2. **SSH into your App Service:**

   ```bash
   az webapp ssh --name <app-service-name> --resource-group <resource-group-name>
   ```

   Example:

   ```bash
   az webapp ssh --name app-insightstudio-bfnfaxmvsmmgc --resource-group rg-insight-studio-centralus-dev
   ```

## Once Connected via SSH

### Navigate to your app directory

```bash
cd /home/site/wwwroot
```

### Check current directory structure

```bash
ls -la
```

### Run Prisma Generate

```bash
# First, check if Prisma schema exists
ls -la prisma/

# Generate Prisma client with Linux binaries
# Use local Prisma version to avoid version conflicts
./node_modules/.bin/prisma generate

# Or if that doesn't work:
npx --yes prisma@6.19.0 generate

# Verify the Linux binary was generated
ls -la node_modules/.prisma/client/ | grep debian
```

### Check Prisma Client Location

```bash
# Check if Prisma binaries exist
find node_modules -name "*debian*" -type f

# Check Prisma client
ls -la node_modules/@prisma/client/
ls -la node_modules/.prisma/client/
```

### Restart the App Service

After running `prisma generate`, you may need to restart the app:

```bash
# Exit SSH
exit
```

Then restart via Azure Portal or CLI:

```bash
az webapp restart --name <app-service-name> --resource-group <resource-group-name>
```

## Setting Up Automatic Prisma Generate on Startup

To avoid manually running `prisma generate` after each deployment, you can configure a startup command.

### Option 1: Via Azure Portal

1. Go to your App Service in Azure Portal
2. Navigate to: **Settings** → **Configuration** → **General settings**
3. Under **Startup Command**, enter:

   ```bash
   ./node_modules/.bin/prisma generate && node server.js
   ```

   This uses the local Prisma version from your project (6.19.0) instead of the global CLI version.

4. Click **Save**
5. Restart the App Service

### Option 2: Via Azure CLI

```bash
az webapp config set \
  --name <app-service-name> \
  --resource-group <resource-group-name> \
  --startup-file "./node_modules/.bin/prisma generate && node server.js"
```

**Important:** Use `./node_modules/.bin/prisma` to ensure you're using the Prisma version from your `package.json` (6.19.0), not the global Prisma CLI version (7.1.0) that Azure may have installed.

### Option 3: Update Infrastructure (Bicep)

Add to your `main.bicep` file in the App Service configuration:

```bicep
resource appService 'Microsoft.Web/sites@2025-03-01' = {
  // ... existing configuration ...
  properties: {
    // ... existing properties ...
    siteConfig: {
      // ... existing config ...
      appCommandLine: 'npx prisma generate && node server.js'
    }
  }
}
```

## Troubleshooting

### If Prisma CLI is not found

```bash
# Check if Prisma is installed
npm list prisma

# If not installed, install it
npm install prisma --save

# Then generate
npx prisma generate
```

### If you get permission errors

```bash
# Check permissions
ls -la node_modules/.prisma/

# If needed, fix permissions (though this shouldn't be necessary)
chmod -R 755 node_modules/.prisma/
```

### Check Environment Variables

```bash
# Verify connection string is set
echo $AZURE_SQL_CONNECTION_STRING

# Check all environment variables
env | grep AZURE
```

### View Application Logs

```bash
# View recent logs
tail -f /home/LogFiles/Application/logging-errors.txt

# Or check via Azure Portal:
# Monitoring → Log stream
```

## Quick Fix Script

Once connected via SSH, you can run this sequence:

```bash
cd /home/site/wwwroot
npm install prisma --save
npx prisma generate
exit
```

Then restart the App Service from Azure Portal or CLI.

## Notes

- SSH access is only available for Linux App Services
- The container is ephemeral - changes made via SSH will be lost on restart unless persisted
- For permanent fixes, update your deployment process or use startup commands
- The `postinstall` script in `package.json` should run automatically after `npm install`, but sometimes it doesn't in standalone deployments
