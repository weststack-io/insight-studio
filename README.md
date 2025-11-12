# Insight Studio

AI-powered personalized briefings & education hub for wealth management firms.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Azure Functions
- **AI**: Azure OpenAI
- **Database**: Azure SQL with Prisma ORM
- **Auth**: Azure AD / Microsoft Entra ID
- **Vector DB**: Azure AI Search
- **Storage**: Azure Blob Storage

## Getting Started

### 1. Deploy Azure Infrastructure

First, deploy the Azure SQL Database and Blob Storage resources:

**Using PowerShell (Windows):**

```powershell
cd infrastructure
.\deploy.ps1 -SqlAdminUsername "insightstudioadmin" -SqlAdminPassword (Read-Host -AsSecureString "Enter SQL password")
```

**Using Bash (Linux/Mac):**

```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh -u insightstudioadmin -p "YourSecurePassword123!"
```

**Using Azure CLI directly:**

```bash
az deployment group create \
  --resource-group rg-insightstudio \
  --template-file infrastructure/main.bicep \
  --parameters sqlAdminUsername=insightstudioadmin sqlAdminPassword="YourSecurePassword123!"
```

See [infrastructure/DEPLOY.md](infrastructure/DEPLOY.md) for detailed instructions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file with the connection strings from the deployment output:

```env
AZURE_SQL_CONNECTION_STRING=Server=tcp:...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

See [SETUP.md](SETUP.md) for all required environment variables.

### 4. Set Up Database

```bash
npm run db:generate
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

## Infrastructure

The infrastructure deployment includes:

- **Azure SQL Database**: Basic tier database for application data
- **Azure Blob Storage**: Storage account with blob container for generated content

See [infrastructure/](infrastructure/) directory for Bicep templates and deployment scripts.

## Environment Variables

See [SETUP.md](SETUP.md) for a complete list of required environment variables.
