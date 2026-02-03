# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Insight Studio is an AI-powered personalized briefings and education hub for wealth management firms. It delivers personalized financial content to high net worth (HNW) clients through two user groups: Wealth Advisors (content creators/reviewers) and HNW Clients (content consumers).

## Development Commands

```bash
# Development
npm run dev                # Start Next.js development server
npm run build              # Production build (includes prisma generate)
npm run lint               # Run Next.js linter

# Database
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:migrate         # Run Prisma migrations
npm run db:studio          # Open Prisma Studio GUI
npm run db:deploy          # Deploy schema (multi-database)
npm run db:deploy:dry-run  # Preview changes without applying

# Azure Functions (in azure-functions/ directory)
npm run build              # Compile TypeScript
npm run start              # Start Azure Functions locally
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query
- **Backend**: Next.js API routes, Prisma 7.1 with MSSQL adapter, Azure SQL
- **AI/ML**: Azure OpenAI (GPT-4), Azure AI Search (vector DB for RAG)
- **Auth**: NextAuth.js with Azure AD / Microsoft Entra ID
- **Scheduled Jobs**: Azure Functions
- **Storage**: Azure Blob Storage (audit logs, files)

**Required Node Version**: 22.x

## Architecture

```
app/                        # Next.js App Router
├── (auth)/                 # Auth layout (login)
├── (dashboard)/            # Protected dashboard routes
│   ├── briefings/          # Weekly market briefings
│   ├── compliance/         # Compliance dashboard
│   ├── explainers/         # On-demand topic explainers
│   ├── lessons/            # Educational micro-lessons
│   ├── reviews/            # Advisor content review queue
│   └── sources/            # Content source management
└── api/                    # API routes

lib/                        # Core business logic
├── ai/                     # Content generation & prompts
├── azure/                  # Azure service clients (OpenAI, Search, Storage)
├── compliance/             # Guardrails, risk scoring, policy engine, citations
├── ingestion/              # Data ingestion pipeline
└── personalization/        # Personalization algorithms

azure-functions/            # Scheduled jobs
├── weekly-briefings/       # Monday 9 AM briefing generation
└── data-ingestion/         # Market data & RSS feed ingestion

prisma/                     # Database
├── schema.prisma           # Data model
├── config.ts               # Prisma v7 MSSQL adapter config
└── databases.json          # Multi-database configuration

infrastructure/             # Azure IaC (Bicep templates)
```

## Key Implementation Details

- **Multi-tenant**: Supports white-label branding per domain (see docs/THEME_CONFIGURATION.md)
- **RAG Pipeline**: Content generation uses Azure AI Search for retrieval-augmented generation
- **Compliance System**: Multi-factor risk scoring, citation tracking, disclosure management, audit logging
- **Review Workflow**: Advisor approval with versioning before client publication
- **Multi-Database**: Custom deployment scripts support multiple tenant databases

## Project Planning

Sprint roadmap tracked in `.cursor/plans/technical-implementation-plan.md`:
- Sprints 1-3: COMPLETED (citations, reviews, compliance, ingestion)
- Sprints 4-6: PENDING (analytics, preferences learning, email, audio, Q&A)

## Development Guidelines (from .cursorrules)

- Use Tailwind CSS with appropriate light/dark mode colors
- Step-by-step pseudocode planning before implementation
- Focus on readability over performance
- Leave no TODOs or missing pieces
- Reference filenames explicitly

## Key Documentation

- `docs/USER_GUIDE.md` - User roles, features, workflows
- `docs/FUNCTIONAL_REQUIREMENTS.md` - Feature specifications
- `infrastructure/DEPLOY.md` - Azure deployment instructions
- `docs/PRISMA_7_MIGRATION.md` - Prisma v7 upgrade notes
