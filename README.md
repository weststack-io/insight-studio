# Insight Studio

AI-powered personalized briefings & education hub for wealth management firms.

## About

Insight Studio is designed for **wealth management firms** to deliver personalized financial briefings and educational content to their **high net worth (HNW) clients**. The application serves two primary user groups:

- **Wealth Advisors**: Generate, review, and approve personalized content for clients
- **HNW Clients**: Receive weekly briefings, educational lessons, and personalized financial content

See [docs/USER_GUIDE.md](docs/USER_GUIDE.md) for detailed information about:
- Who uses the application and their roles
- How each user type interacts with the application
- Content personalization features
- Current implementation status vs planned features

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Content Rendering**: react-markdown with remark-gfm for enhanced markdown display
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

## Key Components

### Content Components

- **MarkdownContent**: Reusable component for rendering markdown content with enhanced typography and styling. Used by lessons and explainers to display AI-generated content with proper formatting for headings, lists, links, code blocks, and tables.
- **LessonView**: Displays educational micro-lessons with personalized content based on user's generation, language, and sophistication level.
- **ExplainerView**: Displays on-demand topic explanations with search and regeneration capabilities.
- **BriefingCard**: Displays weekly market briefings with portfolio impact information.

All content components use the `MarkdownContent` component for consistent, readable markdown rendering across the application.

## Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete guide to user roles, features, and how to use the application
- **[Functional Requirements](docs/FUNCTIONAL_REQUIREMENTS.md)**: Complete feature specifications and architecture
- **[Theme Configuration](docs/THEME_CONFIGURATION.md)**: Multi-tenant branding setup and customization
- **[Setup Guide](SETUP.md)**: Environment setup and configuration instructions

## Theme Configuration

Insight Studio supports multi-tenant white-label branding. Each tenant can have custom colors, fonts, and logos that are automatically applied based on domain.

See [docs/THEME_CONFIGURATION.md](docs/THEME_CONFIGURATION.md) for detailed documentation on:
- How the theme system works
- Adding and configuring themes
- Available CSS variables and utility classes
- Best practices and troubleshooting

## License

[MIT](LICENSE)
