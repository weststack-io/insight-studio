# Azure App Service Startup Command Configuration

## Issue

Azure App Service may use a different version of Prisma CLI than your project, causing version conflicts.

## Solution

Use the local Prisma version from `node_modules` instead of the global one.

## Correct Startup Command

Set the startup command in Azure App Service to:

```bash
./node_modules/.bin/prisma generate && node server.js
```

Or using npx (which should use local version):

```bash
npx prisma generate && node server.js
```

**Note:** With Prisma 7, the configuration is now in `prisma/config.ts` instead of `schema.prisma`, so make sure that file is deployed.

## Setting the Startup Command

### Via Azure CLI

```bash
az webapp config set \
  --name <app-service-name> \
  --resource-group <resource-group-name> \
  --startup-file "./node_modules/.bin/prisma generate && node server.js"
```

### Via Azure Portal

1. Go to your App Service in Azure Portal
2. Navigate to: **Settings** → **Configuration** → **General settings**
3. Under **Startup Command**, enter:
   ```
   ./node_modules/.bin/prisma generate && node server.js
   ```
4. Click **Save**
5. Restart the App Service

## Alternative: Pin Prisma Version

If you want to ensure a specific Prisma version is used, you can:

1. Update `package.json` to pin the exact version:

   ```json
   "prisma": "6.19.0"
   ```

2. Ensure `package-lock.json` is committed and deployed

3. Use the startup command:
   ```
   npm install && ./node_modules/.bin/prisma generate && node server.js
   ```

## Troubleshooting

### Check Prisma Version in Azure

SSH into your App Service and check:

```bash
cd /home/site/wwwroot
./node_modules/.bin/prisma --version
npx prisma --version
```

### Verify Local Prisma Exists

```bash
ls -la node_modules/.bin/prisma
ls -la node_modules/prisma/
```

### Force Use Local Version

If npx is still using the wrong version:

```bash
# In startup command, use explicit path
./node_modules/.bin/prisma generate && node server.js
```
