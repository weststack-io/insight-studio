# Azure App Service Startup Command Configuration

## Do You Need a Custom Startup Command?

**Usually no.** Your `package.json` has:

- **`"postinstall": "prisma generate"`** — when Azure runs `npm install` during deploy, the Prisma client is already generated.
- **`"start": "node server.js"`** — the app just runs `node server.js`.

So you typically **do not need to run `prisma generate` at startup**. You only need a startup command that runs your app from the correct directory, because the startup script runs from `/opt/startup/`, not from your app folder (`/home/site/wwwroot`).

## Recommended Startup Command (Minimal)

Use the smallest command that works: change to the app directory, then start the app. No `prisma generate` needed (postinstall already did it).

```bash
cd /home/site/wwwroot && node server.js
```

Or, if you prefer to use npm:

```bash
cd /home/site/wwwroot && npm start
```

**Why `cd /home/site/wwwroot`?** The startup script runs from `/opt/startup/`. Your app and `node_modules` live in `/home/site/wwwroot`. Without the `cd`, `node server.js` would run in the wrong place and fail.

---

## Why Was “prisma generate” in the Startup Command Before?

Someone had added **`npx prisma generate && node server.js`** (or similar) to work around a missing Prisma client. That caused two problems:

1. **WASM error** — `npx` ran Prisma from its cache (`/root/.npm/_npx/...`) instead of your app’s `node_modules`. That cached Prisma looked for `@prisma/client` in the wrong place and failed with:  
   `Cannot find module '.../query_compiler_fast_bg.sqlserver.wasm-base64.js'`
2. **“prisma: not found”** — Using `./node_modules/.bin/prisma` without `cd` made the script look for `/opt/startup/node_modules`, which doesn’t exist.

**The real fix:** Rely on **postinstall** to run `prisma generate` during deploy. At startup, only run the app from the app directory. No Prisma CLI in the startup command.

---

## When Would You Run prisma generate at Startup?

Only if your deployment **does not** run `npm install` (or skips postinstall) and you deploy without a pre-generated client. Then you’d need something like:

```bash
cd /home/site/wwwroot && ./node_modules/.bin/prisma generate && node server.js
```

(And `node_modules` must already exist in wwwroot.) For most Azure Node setups, postinstall runs on deploy, so the minimal command above is enough.

**Note:** With Prisma 7, the configuration is in `prisma/config.ts`; ensure that file is deployed.

## Setting the Startup Command

### Via Azure CLI

```bash
az webapp config set \
  --name <app-service-name> \
  --resource-group <resource-group-name> \
  --startup-file "cd /home/site/wwwroot && node server.js"
```

### Via Azure Portal

1. Go to your App Service in Azure Portal
2. Navigate to: **Settings** → **Configuration** → **General settings**
3. Under **Startup Command**, enter:
   ```
   cd /home/site/wwwroot && node server.js
   ```
4. Click **Save**
5. Restart the App Service

## Troubleshooting

### Error: Cannot find module '.../query_compiler_fast_bg.sqlserver.wasm-base64.js'

**Cause:** The startup command was using `npx prisma generate`. npx runs Prisma from its cache, which looks for `@prisma/client` in the wrong place.

**Fix:** Do not run `prisma generate` (or npx) in the startup command. Rely on `postinstall` during deploy. Use only:

```bash
cd /home/site/wwwroot && node server.js
```

### Error: ./node_modules/.bin/prisma: not found

**Cause:** The startup script runs from `/opt/startup/`, so `./node_modules/.bin/prisma` looks for `/opt/startup/node_modules`, which does not exist.

**Fix:** Do not run prisma at startup. Use the minimal command:

```bash
cd /home/site/wwwroot && node server.js
```

### Error: Cannot find module 'next'

**Cause:** The app is started with `node server.js` (from Next.js standalone), which does `require('next')`. At runtime there is no `node_modules/next` in `/home/site/wwwroot`. That usually means either the deployment zip didn’t include a full `node_modules`, or the standalone build’s traced `node_modules` didn’t include `next`.

**Fix:**

- **If you deploy using `webdeploy.ps1`:** The script was updated to run `npm install --omit=dev` inside the webdeploy folder when `next` is missing, so the zip includes a complete `node_modules`. Re-run `.\webdeploy.ps1` and redeploy the new zip.
- **If you deploy another way (e.g. GitHub Actions):** Ensure the artifact you deploy includes `node_modules` with `next` (e.g. run `npm install --omit=dev` in the build output before zipping), or set the startup command to install then start:  
  `cd /home/site/wwwroot && npm install --omit=dev && node server.js`  
  (Slower on first start; prefer fixing the build so `node_modules` is in the zip.)

### App still fails at runtime with Prisma/client errors

If the Prisma client is missing at runtime (e.g. deploy doesn’t run `npm install` or postinstall), ensure your deployment runs `npm install` from the app root so `postinstall` runs `prisma generate`. If you truly cannot run install on deploy, then you’d need a startup command that runs from wwwroot and has node_modules (e.g. `cd /home/site/wwwroot && ./node_modules/.bin/prisma generate && node server.js`), but that only works if `node_modules` already exists in wwwroot.
