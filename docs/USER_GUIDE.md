# Insight Studio User Guide

## Overview

Insight Studio is a **Personalized Briefings & Education Hub** designed for wealth management firms to deliver AI-powered, personalized financial content to their high net worth (HNW) clients. The application serves two primary user groups: **Wealth Advisors** and **HNW Clients**.

## Who Uses This Application

### Primary Users: Wealth Advisors

Wealth advisors use Insight Studio to:

- Generate personalized briefings and educational content for their clients
- Review and approve content before delivery to ensure compliance and quality
- Monitor client engagement and content performance
- Manage compliance workflows and audit trails

### End Beneficiaries: High Net Worth (HNW) Clients

HNW clients receive:

- Weekly personalized briefings explaining market moves and portfolio impacts
- Micro-lessons on complex wealth management topics
- Content tailored to their preferences (age, language, sophistication level)
- Educational content delivered via multiple channels (email, portal, mobile app, audio)

## User Roles

The application supports three distinct user roles:

### 1. Advisor (`advisor`)

**Purpose**: Wealth advisors who create, review, and approve content for clients.

**Capabilities**:

- ✅ Review and approve generated briefings, lessons, and explainers
- ✅ Request changes or reject content with comments
- ✅ View content with citations and source references
- ✅ Filter and manage review queue by status
- ✅ Access content versioning and review history
- ✅ Configure policy rules and disclosures (prohibited terms, required disclosures, content restrictions, risk thresholds)
- ✅ Access compliance dashboard with policy configuration UI
- ✅ View risk score visualizations and violation reports
- ✅ Monitor multi-factor risk scoring (content sensitivity, citations, user profile, historical patterns)
- ✅ Manage data sources (RSS feeds, market data) via Sources page
- ✅ Configure ingestion schedules for automated data collection
- ✅ Create and manage house views (tenant-specific investment philosophy)
- ✅ Monitor ingestion status and source reliability metrics
- 🚧 Monitor content analytics and client engagement (Sprint 4)

**Current Status**: ✅ Core advisor review workflow and comprehensive compliance engine implemented. See [Technical Implementation Plan](../.cursor/plans/technical-implementation-plan.md) for roadmap.

### 2. Family Member (`family_member`)

**Purpose**: Primary client users who receive personalized content.

**Capabilities**:

- View personalized dashboard with briefings, lessons, and explainers
- Access weekly market briefings tailored to their portfolio
- Browse educational micro-lessons on wealth topics
- Set preferences for topics, language, and content format
- Update profile settings (language, generation, sophistication level)
- View recommended topics based on their interests

**Current Status**: ✅ Fully implemented

### 3. Trustee (`trustee`)

**Purpose**: Users with trustee responsibilities, likely with similar viewing capabilities to family members but potentially with different access levels.

**Capabilities**: Similar to family members, with potential for expanded access in future releases.

**Current Status**: ✅ Basic implementation (uses same interface as family members)

## How Users Interact with the Application

### For HNW Clients (Family Members & Trustees)

#### 1. **Personalized Dashboard**

- **Location**: `/dashboard`
- **Features**:
  - Personalized feed showing recent briefings and recommended lessons
  - Recommended topics based on user preferences
  - Quick access to all content types
  - Tabs for Feed, Preferences, and Profile

#### 2. **Weekly Briefings**

- **Location**: `/briefings`
- **Content**: Weekly market updates explaining:
  - What happened in the markets (now includes real-time market data from Alpha Maven)
  - Why it matters to their portfolio
  - Portfolio impact (tax-aware)
  - Suggested actions (educational tone)
  - Source citations (now includes citations from ingested RSS feeds and content sources)
  - House view context (tenant-specific investment philosophy automatically included)

#### 3. **Educational Lessons**

- **Location**: `/lessons`
- **Content**: Micro-lessons on complex topics like:
  - Qualified Small Business Stock (QSBS)
  - Tax strategies
  - Estate planning
  - Investment concepts
- **Personalization**: Content adapted to user's generation, language, and sophistication level
- **Display**: Content is rendered with enhanced markdown formatting for improved readability, including proper typography, headings, lists, links, and code blocks

#### 4. **Topic Explainers**

- **Location**: `/explainers`
- **Content**: On-demand explanations of specific financial topics
- **Features**: Search and browse by topic
- **Display**: Content is rendered with enhanced markdown formatting for improved readability, including proper typography, headings, lists, links, and code blocks

#### 5. **Preferences Management**

- **Location**: `/dashboard` → Preferences tab
- **Features**:
  - Add topics of interest
  - Set interest levels (Low, Medium, High) for each topic
  - Remove topics you're no longer interested in
  - See how preferences affect your personalized content

#### 6. **Profile Settings**

- **Location**: `/dashboard` → Profile tab
- **Features**:
  - View and update language preference
  - Set generation (Gen X, Millennial, Gen Z, Boomer)
  - Configure investment sophistication level (beginner, intermediate, advanced)
  - View role and email (read-only)

### For Wealth Advisors

#### 1. **Review Queue** ✅ **IMPLEMENTED**

- **Location**: `/reviews`
- **Features**:
  - ✅ View pending content awaiting review
  - ✅ Filter by review status (pending, approved, rejected, changes requested)
  - ✅ See content status (draft, pending_review, approved, published)
  - ✅ View content type (briefing, explainer, lesson) and version number
  - ✅ See reviewer information and review timestamps

#### 2. **Content Review Interface** ✅ **IMPLEMENTED**

- **Features**:
  - ✅ View full content preview in review modal
  - ✅ Approve, reject, or request changes with one click
  - ✅ Add comments when reviewing content
  - ✅ View content metadata (type, version, status)
  - ✅ See review history and previous comments
  - ✅ View citations and confidence scores
  - ✅ See risk scoring and compliance flags (multi-factor risk scoring with automatic routing)
  - ✅ View policy violations and compliance violations
  - 🚧 Side-by-side comparison of content versions (coming in future sprint)

#### 3. **Compliance Dashboard** ✅ **IMPLEMENTED**

- **Location**: `/compliance`
- **Features**:
  - ✅ Configure policy rules and restricted terms (prohibited terms, required disclosures, content restrictions, risk thresholds)
  - ✅ View policy violations and violation reports
  - ✅ Manage disclosure templates
  - ✅ Overview dashboard with compliance statistics
  - ✅ Policy management UI (create, edit, delete policies)
  - ✅ Risk score visualization (placeholder for future analytics)
  - 🚧 Advanced audit log search interface (basic logging implemented, search UI coming)

#### 4. **Sources Management** ✅ **IMPLEMENTED (Sprint 3)**

- **Location**: `/sources`
- **Features**:
  - ✅ Configure RSS feed sources for content ingestion
  - ✅ Create and manage ingestion configurations (market data, RSS feeds)
  - ✅ Monitor ingestion status (last run, next run, status)
  - ✅ View source reliability metrics
  - ✅ Delete ingestion configurations
  - ✅ Automatic ingestion via scheduled Azure Function (every 6 hours)
  - ✅ Content sources automatically indexed for RAG search

#### 5. **House Views Management** ✅ **IMPLEMENTED (Sprint 3)**

- **Purpose**: Define tenant-specific investment philosophy and house views
- **Features**:
  - ✅ Create and manage house views (tenant-specific investment philosophy)
  - ✅ Automatic versioning when house views are updated
  - ✅ House views automatically included in briefing generation prompts
  - ✅ Active house view influences all generated briefings for the tenant
  - ✅ Version history tracking for house views

#### 6. **Content Analytics** 🚧 **PLANNED (Sprint 4)**

- **Features**:
  - View engagement metrics (open rates, time spent, topic clicks)
  - Monitor client preferences and behavior
  - Track content performance across clients

## Content Personalization

The application personalizes content based on multiple signals:

### Profile-Based Personalization

- **Age/Generation**: Content adapted for Gen X, Millennials, Gen Z, or Boomers
- **Language**: Content delivered in user's preferred language (English, Spanish, French, etc.)
- **Investment Sophistication**: Content complexity adjusted for beginner, intermediate, or advanced levels

### Portfolio-Based Personalization

- **Holdings**: Content considers user's actual portfolio holdings
- **Tax Context**: Avoids irrelevant advice (e.g., wash sale windows, lockups)
- **Concentration**: Highlights relevant portfolio concentrations

### Behavior-Based Personalization

- **Engagement**: Topics user has opened or spent time on
- **Preferences**: Explicit topic interests set by user
- **Format Preferences**: Preferred content formats (text vs audio)

### Topic Preferences - How They Work

Topic preferences are a powerful way to customize your content experience. Here's how they affect what you see:

#### Setting Topic Preferences

1. Navigate to the **Preferences** tab on your dashboard
2. Add topics you're interested in (e.g., "Stock Market Basics", "Bond Investing", "Estate Planning")
3. Set an interest level for each topic:
   - **High**: Topics you're very interested in
   - **Medium**: Topics you have moderate interest in
   - **Low**: Topics you have minimal interest in

#### How Preferences Affect Your Content

**1. Personalized Feed - Explainers Filtering**

- Only topics marked with **High** interest level are used to filter explainers in your personalized dashboard feed
- The feed will show up to 5 explainers that match your high-interest topics
- This ensures you see the most relevant educational content first

**2. Briefing Generation - AI Content Tailoring**

- When weekly briefings are generated, **all** your topic preferences (regardless of interest level) are passed to the AI
- The AI uses this information to tailor the briefing content to topics you care about
- For example, if you've indicated interest in "Tax Strategies", the briefing may include more tax-related insights

**3. Content Ranking and Scoring**

- Explainers and lessons that match your topic preferences receive higher scores in the ranking algorithm
- Content matching your preferences gets a +10 point boost in relevance scoring
- This means preferred topics appear higher in search results and recommendations

**4. Recommended Topics**

- The system may suggest additional topics based on your existing preferences and portfolio holdings
- These recommendations help you discover new areas of interest

#### Best Practices

- **Be Specific**: Use specific topic names (e.g., "Dividend Investing" rather than just "Investing")
- **Set High Interest**: Mark topics you want to see in your feed as "High" interest
- **Keep Updated**: Regularly review and update your preferences as your interests evolve
- **Use Medium/Low**: Topics set to Medium or Low still influence briefing generation, so include topics you want mentioned even if you don't want them in your feed

## Content Delivery Channels

Content is delivered through multiple channels (as specified in functional requirements):

1. **Web Portal**: Current implementation - users access content via the web application
2. **Email**: Planned - weekly briefings delivered via email
3. **Mobile App**: Planned - native mobile application
4. **Audio**: Planned - text-to-speech audio briefings

## Weekly Workflow

The application follows a weekly content generation cycle:

1. **Data Refresh**: Market and portfolio data is updated
2. **Candidate Generation**: Briefings are drafted per client segment
3. **Validation**: ✅ Automatic checks for restricted terms and compliance guardrails
4. **Risk Scoring**: ✅ Basic risk scoring (0-100) determines if advisor review is needed
5. **Advisor Review**: ✅ **IMPLEMENTED** - Advisors review, approve, reject, or request changes with comments
6. **Delivery**: Content is pushed to clients via selected channels
7. **Feedback Loop**: Engagement data is captured to update preferences (Sprint 4)

## Current Implementation Status

### ✅ Implemented Features

**Core Platform:**

- Multi-tenant architecture with theme configuration
- User authentication via Azure AD
- Client-facing dashboard and content views
- Content generation (briefings, explainers, lessons) with RAG via Azure AI Search
- Enhanced markdown rendering for lessons and explainers with improved typography and readability
- Personalization based on user preferences, generation, language, and sophistication level
- Portfolio data integration with Addepar
- Weekly briefings Azure Function (scheduled)
- Database schema with user roles

**Sprint 1 - Advisor Review & Citations:**

- ✅ **Advisor review/approval workflow** - Review queue, approve/reject/request-changes with comments
- ✅ **Citation tracking system** - Extract, store, and validate citations from RAG search results
- ✅ **Basic compliance guardrails** - Restricted terms checking, mandatory disclosure injection, risk scoring (0-100)
- ✅ **Content versioning** - Track content revisions and versions
- ✅ **Review API** - Full CRUD operations for content reviews with status workflow

**Sprint 2 - Compliance Engine & Risk Scoring:**

- ✅ **Policy Rules Engine** - Tenant-specific policy configuration (prohibited terms, required disclosures, content restrictions, risk thresholds)
- ✅ **Multi-Factor Risk Scoring** - Content sensitivity, citation confidence, user profile risk, historical patterns with automated routing
- ✅ **Compliance Dashboard** - Policy configuration UI, violation reports, risk score visualization
- ✅ **Disclosure Management** - Context-aware disclosure selection and automatic injection (8 disclosure templates)
- ✅ **Content Validation Pipeline** - Pre/post-generation validation, fact checking, citation verification, hallucination detection
- ✅ **Audit Logging System** - Comprehensive logging to Azure Blob Storage with retention policies (365 days)

**Sprint 3 - Data Ingestion & Content Sources:**

- ✅ **Market Data Ingestion** - Automated ingestion from Alpha Maven API with scheduled Azure Function
- ✅ **Content Source Management** - RSS feed ingestion with reliability scoring
- ✅ **Vector Indexing Pipeline** - Automatic indexing of ingested content to Azure AI Search with metadata
- ✅ **House Views Integration** - Tenant-specific investment philosophy automatically included in briefing generation
- ✅ **Source Management UI** - Configure and monitor data sources via `/sources` page
- ✅ **Ingestion Scheduler** - Timer-triggered Azure Function (runs every 6 hours) for automated data collection
- ✅ **Market Data in Briefings** - Recent market data automatically included in market briefing generation
- ✅ **Content Sources in RAG** - Ingested RSS feeds and content sources automatically used in RAG search with tenant filtering

### 🚧 Planned Features (Sprint 4+)

- Content analytics and engagement tracking (Sprint 4)
- Multi-channel delivery (email, mobile app, audio) (Sprint 5)
- Interactive Q&A with guardrails (Sprint 6)
- A/B testing framework (Sprint 6)

See [Technical Implementation Plan](../.cursor/plans/technical-implementation-plan-fc164b9a.plan.md) for detailed roadmap.

## Getting Started

### For Clients

1. Sign in using your Azure AD credentials
2. Complete your profile settings (language, generation, sophistication level)
3. Set your topic preferences
4. Explore your personalized dashboard
5. Read weekly briefings and educational lessons

### For Advisors

✅ **Advisor review workflow, compliance engine, and data ingestion are now fully available!** Advisors can:

1. **Access the review queue** (`/reviews`) to see pending content awaiting review
2. **Review content** - View full content preview, see version information, and review history
3. **Take action** - Approve, reject, or request changes with optional comments
4. **Filter reviews** - View by status (pending, approved, rejected, changes requested)
5. **Track versions** - See content version numbers and review history
6. **Configure compliance policies** (`/compliance`) - Set up prohibited terms, required disclosures, content restrictions, and risk thresholds
7. **View risk scores** - See multi-factor risk scoring breakdown (content sensitivity, citations, user profile, historical patterns)
8. **Monitor violations** - View policy violations and compliance reports
9. **Manage disclosures** - Configure context-aware disclosure templates
10. **Manage data sources** (`/sources`) - Configure RSS feeds and market data ingestion
11. **Monitor ingestion** - View ingestion status, last run times, and source reliability metrics
12. **Create house views** - Define tenant-specific investment philosophy that automatically influences all briefings

**How Sprint 3 Features Enhance Content:**

- **Market Data**: Briefings now include real-time market data from Alpha Maven (prices, changes, trends)
- **House Views**: All briefings automatically incorporate your firm's investment philosophy and house views
- **Content Sources**: RAG search now uses ingested RSS feeds and content sources, providing more relevant and up-to-date citations
- **Automated Ingestion**: Data is automatically collected every 6 hours via Azure Function, keeping content fresh

**Coming Later:**

- Monitor content analytics and client engagement (Sprint 4)
- Advanced audit log search interface (basic logging implemented)

## Additional Resources

- [Functional Requirements](./FUNCTIONAL_REQUIREMENTS.md) - Complete feature specifications
- [Technical Implementation Plan](../.cursor/plans/technical-implementation-plan.md) - Development roadmap
- [Setup Guide](../SETUP.md) - Environment setup and configuration
- [Theme Configuration](./THEME_CONFIGURATION.md) - Multi-tenant branding setup
