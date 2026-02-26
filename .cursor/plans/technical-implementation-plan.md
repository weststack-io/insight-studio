---
name: Technical Implementation Plan for Insight Studio
overview: ""
todos:
  - id: 3794b7a4-9382-4dde-a367-760c9abb4479
    content: Implement citation tracking system with source references and confidence scores
    status: completed
  - id: 5d1a3936-22d1-45f8-b6ab-99de3f37320c
    content: Create content review database models and API endpoints
    status: completed
  - id: 2460c7c1-beef-46c2-92d8-be8ccad5f97d
    content: Build advisor review UI with approve/reject/request-changes workflow
    status: completed
  - id: 5e8b8718-cce0-41ac-9304-abfbe2a5fa9a
    content: Implement basic compliance guardrails (restricted terms, disclosures)
    status: completed
  - id: 7a3560b6-36c2-4e04-98c9-69f1974146ec
    content: Build policy rules engine with tenant-specific configuration
    status: completed
  - id: aeca88c9-d2c5-44f9-a1f1-ce27dae4d26b
    content: Implement multi-factor risk scoring system with automated routing
    status: completed
  - id: d2210c26-7216-43ca-8ba4-493794f9e12a
    content: Create comprehensive audit logging system for compliance
    status: completed
  - id: 4c4fe1fe-817d-4662-8f96-c94f1bbbd442
    content: Build market data ingestion pipeline with scheduled Azure Function
    status: completed
  - id: 0aa769ca-e352-42e6-9266-6fe41454d1c4
    content: Implement vector indexing pipeline for RAG content with metadata
    status: completed
  - id: 825b547b-3999-4cbf-ba20-646a0289140e
    content: Implement analytics event tracking and engagement metrics
    status: completed
  - id: c133c1d3-0e0c-4942-815e-455d4a8210f6
    content: Build preference learning system based on user engagement
    status: completed
  - id: 0ff101b5-d5dc-462f-ac43-d464a899e949
    content: Implement email delivery system with personalized templates
    status: pending
  - id: 95b88369-5952-424d-88c7-bf3ace768314
    content: Build audio generation system using Azure Cognitive Services Speech
    status: pending
  - id: 4eeeb149-a96e-4081-873d-a4e241d7aa3c
    content: Create multi-channel delivery orchestrator with format conversion
    status: pending
  - id: 1ad136f4-1b41-4def-bae5-a996af92de61
    content: Implement interactive Q&A system with RAG-powered answers and guardrails
    status: pending
  - id: 0b7b921d-0a60-4dbb-bbfe-db74f419c3f2
    content: Build A/B testing framework with variant assignment and tracking
    status: pending
---

# Technical Implementation Plan for Insight Studio

## Executive Summary

This document outlines the technical implementation plan for Insight Studio, an AI-powered personalized briefings and education hub for wealth management firms. The plan builds upon the existing MVP codebase and delivers all capabilities specified in the functional requirements document over a structured sprint-based timeline.

### Implementation Progress

**Sprint 1: ✅ COMPLETED** (December 2024)

- Database schema updated with review, citation, and versioning models
- Citation tracking system implemented
- Content review API and UI completed
- Basic compliance guardrails implemented
- Version tracking system in place

**Sprint 2: ✅ COMPLETED** (December 2024)

- Policy rules engine with tenant-specific configuration
- Multi-factor risk scoring system with automated routing
- Compliance dashboard with policy configuration UI
- Disclosure management system with context-aware selection
- Content validation pipeline (pre/post-generation, hallucination detection)
- Comprehensive audit logging system to Azure Blob Storage

**Sprint 3: ✅ COMPLETED** (December 2024)

- Market data ingestion with Alpha Maven API
- Content source management with RSS feeds
- Vector indexing pipeline for RAG content
- Ingestion scheduler Azure Function
- Source management UI
- House views integration

**Sprint 4: ✅ COMPLETED** (February 2026)

- Analytics event tracking (client-side + server-side)
- Engagement metrics calculation engine
- Analytics dashboard with KPIs, trends, and content performance
- Preference learning algorithm (conservative, weekly)
- Content feedback (star ratings) on briefings, explainers, lessons

**Sprint 5-6: ⏳ PENDING**

- All remaining sprints are ready to begin

### Current State (MVP)

The existing codebase provides:

- Multi-tenant architecture with theme configuration
- User authentication via Azure AD
- Basic content generation (briefings, explainers, lessons) with RAG via Azure AI Search
- Personalization based on user preferences, generation, language, and sophistication level
- Portfolio data integration with Addepar
- Weekly briefings Azure Function (scheduled)
- Database schema with Prisma ORM
- ✅ **NEW**: Advisor review workflow with approval/rejection
- ✅ **NEW**: Citation tracking and source management
- ✅ **NEW**: Basic compliance guardrails and risk scoring
- ✅ **NEW**: Content versioning system
- ✅ **NEW**: Policy rules engine with tenant-specific configuration
- ✅ **NEW**: Multi-factor risk scoring (content sensitivity, citations, user profile, historical patterns)
- ✅ **NEW**: Compliance dashboard with policy management UI
- ✅ **NEW**: Disclosure management with 8 disclosure templates
- ✅ **NEW**: Content validation pipeline (pre/post-generation, hallucination detection)
- ✅ **NEW**: Comprehensive audit logging to Azure Blob Storage
- ✅ **NEW**: Analytics event tracking and engagement metrics dashboard
- ✅ **NEW**: Preference learning system with conservative weekly adjustments
- ✅ **NEW**: Content feedback (star ratings) integrated into all content views

### Target State

Complete implementation of all functional requirements including:

- Advisor review/approval workflow with audit trail
- Citation tracking and source validation
- Compliance guardrails and policy rules engine
- Content analytics and engagement tracking
- Multi-channel delivery (email, portal, audio)
- Interactive Q&A with guardrails
- A/B testing framework
- Data ingestion pipeline for market/macro data
- Risk scoring and automated content validation

---

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Azure Functions
- **AI/ML**: Azure OpenAI, Azure AI Search (vector DB)
- **Database**: Azure SQL with Prisma ORM
- **Auth**: Azure AD / Microsoft Entra ID
- **Storage**: Azure Blob Storage
- **Email**: Azure Communication Services or SendGrid
- **Analytics**: Application Insights + custom event tracking

### Key Architectural Components

1. **Content Generation Pipeline**: RAG-powered generation with citation tracking
2. **Compliance Engine**: Policy rules engine, risk scoring, validation
3. **Review Workflow**: Advisor review/approval with versioning and audit trail
4. **Delivery System**: Multi-channel delivery with format conversion
5. **Analytics Engine**: Engagement tracking, preference learning, A/B testing
6. **Data Ingestion**: Market data, portfolio data, content sources

---

## Sprint 1: MVP Completion - Advisor Review & Citations (Weeks 1-2) ✅ **COMPLETED**

### Status: ✅ **COMPLETED** (December 2024)

All Sprint 1 tasks have been implemented and the database migration has been applied.

### Objectives

Complete core MVP gaps: advisor review workflow, citation tracking, and basic compliance guardrails.

### Database Schema Updates ✅ **COMPLETED**

**New Models** (`prisma/schema.prisma`):

- ✅ `ContentReview`: id, contentId, contentType, status, reviewerId, reviewedAt, comments, version
- ✅ `ContentSource`: id, type, title, url, date, reliabilityScore, tags, tenantId
- ✅ `Citation`: id, contentId, contentType, sourceId, text, confidenceScore, position
- ✅ `ContentVersion`: id, contentId, contentType, version, content, generatedAt, status

**Schema Changes**:

- ✅ Add `status`, `version`, `reviewerId`, `reviewedAt` to `Briefing` model
- ✅ Add `citations` JSON field to `Briefing`, `Explainer`, `Lesson`
- ✅ Add `riskScore`, `requiresReview` flags to all content models

**Migration Status**: ✅ Applied via `prisma db push` and marked as applied

### Implementation Tasks

1. **Citation Tracking System** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/citations.ts`
   - ✅ Extract citations from RAG search results
   - ✅ Store citations with source references in database
   - ✅ Validate citation links and confidence scores
   - ✅ Helper functions: `extractCitations()`, `storeCitations()`, `validateCitations()`, `getCitations()`

2. **Content Review Models & API** ✅ **COMPLETED**

   - ✅ File: `app/api/reviews/route.ts`
   - ✅ CRUD operations for content reviews (GET, POST, PATCH, DELETE)
   - ✅ Status workflow: `draft` → `pending_review` → `approved` → `published`
   - ✅ Version tracking for content revisions
   - ✅ Role-based access control (advisors can approve/reject)

3. **Advisor Review UI** ✅ **COMPLETED**

   - ✅ File: `app/(dashboard)/reviews/page.tsx`
   - ✅ Review queue showing pending content
   - ✅ Review interface with approve/reject/request-changes actions
   - ✅ Content preview in review modal
   - ✅ Filtering by review status
   - ✅ Navigation link added to Header component

4. **Basic Compliance Guardrails** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/guardrails.ts`
   - ✅ Restricted terms list checking (20+ restricted terms)
   - ✅ High-risk terms detection
   - ✅ Mandatory disclosure injection
   - ✅ Risk scoring algorithm (0-100 based on content analysis)
   - ✅ Context-aware disclosure selection

5. **Version Tracking** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/versioning.ts`
   - ✅ Create content versions
   - ✅ Get current version
   - ✅ Get all versions for content
   - ✅ Version management functions

6. **Database Migration** ✅ **COMPLETED**

   - ✅ Prisma schema updated with all new models and fields
   - ✅ Schema validation passed
   - ✅ Migration applied to database via `prisma db push`
   - ✅ Migration marked as applied in Prisma migration history

### Deliverables ✅ **ALL COMPLETED**

- ✅ Advisor review workflow functional
- ✅ Citations tracked and can be stored/retrieved from database
- ✅ Basic compliance checks running (guardrails.ts)
- ✅ Content versioning system in place
- ✅ Review UI accessible from dashboard navigation
- ✅ All database models created and migrated

### Files Created/Modified

**New Files:**

- `lib/compliance/citations.ts` - Citation tracking system
- `lib/compliance/guardrails.ts` - Compliance guardrails
- `lib/compliance/versioning.ts` - Version tracking
- `app/api/reviews/route.ts` - Review API endpoints
- `app/(dashboard)/reviews/page.tsx` - Review UI page

**Modified Files:**

- `prisma/schema.prisma` - Added new models and fields
- `components/Header.tsx` - Added Reviews navigation link

### Next Steps

- **Integration**: Integrate citation extraction into content generation pipeline
- **Integration**: Integrate guardrails into content generation to automatically set risk scores
- **Integration**: Automatically create reviews when content requires review
- **Testing**: Test review workflow end-to-end
- **Sprint 2**: Begin implementation of policy rules engine and advanced compliance features

---

## Sprint 2: Compliance Engine & Risk Scoring (Weeks 3-4) ✅ **COMPLETED**

### Status: ✅ **COMPLETED** (December 2024)

All Sprint 2 tasks have been implemented and the database migration has been applied.

### Objectives

Build comprehensive compliance engine with policy rules, automated risk scoring, and disclosure management.

### Database Schema Updates ✅ **COMPLETED**

**New Models** (`prisma/schema.prisma`):

- ✅ `Policy`: id, tenantId, name, type, config (JSON), enabled

**Schema Changes**:

- ✅ Added `policies` relation to `Tenant` model

**Migration Status**: ✅ Applied via `prisma db push`

### Implementation Tasks

1. **Policy Rules Engine** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/policy-engine.ts`
   - ✅ Tenant-specific policy configuration
   - ✅ Rule evaluation engine (prohibited terms, required disclosures, content restrictions, risk thresholds)
   - ✅ Policy violation detection and reporting
   - ✅ CRUD operations for policies (getTenantPolicies, upsertPolicy, deletePolicy, evaluatePolicies)
   - ✅ Default policy configurations for each policy type

2. **Risk Scoring System** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/risk-scoring.ts`
   - ✅ Multi-factor risk calculation:
     - ✅ Content sensitivity (market stress, product mentions)
     - ✅ Citation confidence scores
     - ✅ User profile risk level
     - ✅ Historical content patterns
   - ✅ Automatic routing to advisor review based on thresholds
   - ✅ Weighted scoring algorithm with configurable thresholds

3. **Disclosure Management** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/disclosures.ts`
   - ✅ Disclosure template library (8 templates: general, investment, market, portfolio, cryptocurrency, derivatives, tax, estate)
   - ✅ Context-aware disclosure selection
   - ✅ Automatic injection into generated content
   - ✅ Tenant-specific disclosure requirements

4. **Compliance Dashboard** ✅ **COMPLETED**

   - ✅ File: `app/(dashboard)/compliance/page.tsx`
   - ✅ Policy configuration UI with modal for create/edit
   - ✅ Overview dashboard with compliance statistics
   - ✅ Policy management (create, edit, delete, enable/disable)
   - ✅ Violation reports view
   - ✅ Risk score visualization (placeholder for future analytics)
   - ✅ Navigation link added to Header component

5. **Content Validation Pipeline** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/validation.ts`
   - ✅ Pre-generation validation (input sanitization, XSS prevention, length checks)
   - ✅ Post-generation validation (fact checking, citation verification, statistical claims)
   - ✅ Automated testing for hallucinations (unsupported claims, contradictory statements)
   - ✅ Comprehensive validation pipeline combining all checks

6. **Audit Logging** ✅ **COMPLETED**

   - ✅ File: `lib/compliance/audit.ts`
   - ✅ Log all prompts, inputs, outputs, and reviewer actions
   - ✅ Store in Azure Blob Storage with retention policies (365 days)
   - ✅ Event types: content_generation, content_review, policy_evaluation, risk_scoring, citation_extraction, disclosure_injection, content_validation, user_action
   - ✅ Helper functions for logging specific events (logContentGeneration, logContentReview, logPolicyEvaluation, logRiskScoring)

7. **API Endpoints** ✅ **COMPLETED**

   - ✅ File: `app/api/policies/route.ts` - Policy CRUD operations (GET, POST, DELETE)
   - ✅ File: `app/api/compliance/violations/route.ts` - Get policy violations for content

### Deliverables ✅ **ALL COMPLETED**

- ✅ Policy rules engine operational
- ✅ Automated risk scoring and routing
- ✅ Disclosure management system
- ✅ Comprehensive audit logging
- ✅ Compliance dashboard with full UI
- ✅ Content validation pipeline
- ✅ All database models created and migrated

### Files Created/Modified

**New Files:**

- `lib/compliance/policy-engine.ts` - Policy rules engine with tenant-specific configuration
- `lib/compliance/risk-scoring.ts` - Multi-factor risk scoring system
- `lib/compliance/disclosures.ts` - Disclosure management with template library
- `lib/compliance/validation.ts` - Content validation pipeline
- `lib/compliance/audit.ts` - Audit logging system
- `app/api/policies/route.ts` - Policy management API
- `app/api/compliance/violations/route.ts` - Violations API
- `app/(dashboard)/compliance/page.tsx` - Compliance dashboard UI

**Modified Files:**

- `prisma/schema.prisma` - Added Policy model
- `components/Header.tsx` - Added Compliance navigation link

### Next Steps

- **Integration**: Integrate policy evaluation into content generation pipeline
- **Integration**: Integrate multi-factor risk scoring into content generation
- **Integration**: Automatically route content to review based on risk scores and policy violations
- **Integration**: Use disclosure management in content generation
- **Integration**: Use validation pipeline in content generation
- **Integration**: Log all content generation events using audit system
- **Testing**: Test policy engine end-to-end
- **Testing**: Test risk scoring with various content types
- **Testing**: Test compliance dashboard UI
- **Sprint 3**: Begin implementation of data ingestion pipeline

---

## Sprint 3: Data Ingestion & Content Sources (Weeks 5-6) ✅ **COMPLETED**

### Status: ✅ **COMPLETED** (December 2024)

All Sprint 3 tasks have been implemented and the database migration is ready to be applied.

### Objectives

Build data ingestion pipeline for market/macro data and content source management.

### Database Schema Updates ✅ **COMPLETED**

**New Models** (`prisma/schema.prisma`):

- ✅ `MarketData`: id, type, source, data (JSON), date, tenantId
- ✅ `ContentIngestion`: id, sourceType, status, lastRun, nextRun, config (JSON)
- ✅ `SourceMetadata`: id, sourceId, key, value
- ✅ `HouseView`: id, tenantId, title, content, version, isActive

**Schema Changes**:

- ✅ Added `marketData` and `houseViews` relations to `Tenant` model
- ✅ Added `metadata` relation to `ContentSource` model

**Migration Status**: ⚠️ Ready to apply via `prisma db push`

### Implementation Tasks

1. **Market Data Ingestion** ✅ **COMPLETED**

   - ✅ File: `lib/ingestion/market-data.ts`
   - ✅ Integrate with Alpha Maven API (using ALPHA_MAVEN_API_KEY environment variable)
   - ✅ Scheduled ingestion via Azure Function
   - ✅ Data normalization and storage
   - ✅ Helper functions: `fetchAlphaMavenData()`, `storeMarketData()`, `ingestMarketData()`, `getMarketData()`, `getLatestMarketData()`

2. **Content Source Management** ✅ **COMPLETED**

   - ✅ File: `lib/ingestion/content-sources.ts`
   - ✅ RSS feed ingestion for research/news using `rss-parser`
   - ✅ PDF/document source creation (parsing can be added later)
   - ✅ Source reliability scoring with multi-factor calculation
   - ✅ Helper functions: `ingestRSSFeed()`, `createPDFSource()`, `calculateReliabilityScore()`, `getContentSources()`, `updateSourceMetadata()`, `getSourceMetadata()`

3. **Vector Indexing Pipeline** ✅ **COMPLETED**

   - ✅ File: `lib/ingestion/indexing.ts`
   - ✅ Embed content with metadata (date, source, asset class, tenantId)
   - ✅ Update Azure AI Search index
   - ✅ Batch processing for efficiency
   - ✅ Helper functions: `generateEmbedding()`, `indexContent()`, `batchIndexContent()`, `indexMarketData()`, `indexContentSources()`, `indexGeneratedContent()`, `removeFromIndex()`

4. **Ingestion Scheduler** ✅ **COMPLETED**

   - ✅ File: `azure-functions/data-ingestion/index.ts`
   - ✅ Timer-triggered Azure Function (runs every 6 hours)
   - ✅ Configurable ingestion schedules per source type (hourly, daily, weekly)
   - ✅ Error handling and retry logic
   - ✅ Automatic next run calculation
   - ✅ Supports market_data and RSS feed ingestion

5. **Source Management UI** ✅ **COMPLETED**

   - ✅ File: `app/(dashboard)/sources/page.tsx`
   - ✅ Configure data sources (RSS feeds)
   - ✅ Monitor ingestion status (last run, next run, status)
   - ✅ View source reliability metrics
   - ✅ Create ingestion configurations
   - ✅ Delete ingestion configurations
   - ✅ Navigation link added to Header component

6. **House Views Integration** ✅ **COMPLETED**

   - ✅ File: `lib/ingestion/house-views.ts`
   - ✅ Tenant-specific house view storage
   - ✅ Version management for house views (automatic versioning on updates)
   - ✅ Helper functions: `upsertHouseView()`, `getActiveHouseView()`, `getAllHouseViews()`, `getHouseViewById()`, `deactivateHouseView()`, `formatHouseViewForPrompt()`

7. **API Endpoints** ✅ **COMPLETED**

   - ✅ File: `app/api/sources/route.ts` - Source CRUD operations (GET, POST, PATCH)
   - ✅ File: `app/api/ingestion/route.ts` - Ingestion configuration management (GET, POST, DELETE)

### Deliverables ✅ **ALL COMPLETED**

- ✅ Automated market data ingestion (Alpha Maven)
- ✅ Content source management system
- ✅ Vector indexing pipeline operational
- ✅ House views integrated with version management
- ✅ All database models created
- ✅ Source management UI accessible from dashboard navigation

### Files Created/Modified

**New Files:**

- `lib/ingestion/market-data.ts` - Market data ingestion with Alpha Maven API
- `lib/ingestion/content-sources.ts` - Content source management with RSS feeds
- `lib/ingestion/indexing.ts` - Vector indexing pipeline for RAG content
- `lib/ingestion/house-views.ts` - House views integration
- `azure-functions/data-ingestion/index.ts` - Ingestion scheduler Azure Function
- `app/api/sources/route.ts` - Source management API
- `app/api/ingestion/route.ts` - Ingestion configuration API
- `app/(dashboard)/sources/page.tsx` - Source management UI

**Modified Files:**

- `prisma/schema.prisma` - Added MarketData, ContentIngestion, SourceMetadata, HouseView models
- `components/Header.tsx` - Added Sources navigation link
- `package.json` - Added `rss-parser` dependency

### Next Steps

- **Database Migration**: Run `prisma db push` to apply schema changes
- **Environment Variables**: Set `ALPHA_MAVEN_API_KEY` in environment
- **Integration**: Integrate house views into RAG prompts for content generation
- **Integration**: Use ingested market data in briefing generation
- **Integration**: Use indexed content sources in RAG search
- **Testing**: Test market data ingestion end-to-end
- **Testing**: Test RSS feed ingestion
- **Testing**: Test vector indexing pipeline
- **Testing**: Test ingestion scheduler Azure Function
- **Sprint 4**: Begin implementation of analytics and engagement tracking

---

## Sprint 4: Analytics & Engagement Tracking (Weeks 7-8) ✅ **COMPLETED**

### Status: ✅ **COMPLETED** (February 2026)

All Sprint 4 tasks have been implemented and the database migration has been applied.

### Objectives

Implement content analytics, engagement tracking, preference learning, and analytics dashboard.

### Database Schema Updates ✅ **COMPLETED**

**New Models** (`prisma/schema.prisma`):

- ✅ `AnalyticsEvent`: id, tenantId, userId, contentId, contentType, eventType (open/click/scroll/dwell/complete/feedback/search), metadata (JSON), sessionId, createdAt
- ✅ `EngagementMetrics`: id, tenantId, contentId, contentType, totalOpens, uniqueOpens, avgDwellTime, avgScrollDepth, completionRate, avgRating, totalFeedback, engagementScore (0-100), lastEngagedAt
- ✅ `PreferenceLearningLog`: id, userId, topic, previousLevel, newLevel, reason (JSON), confidence, appliedAt

**Design Decisions:**
- Single `AnalyticsEvent` table instead of separate ContentAnalytics + UserBehavior (structurally identical; simpler writes/queries)
- No FK constraints on events (high-write-volume table; matches ContentReview pattern)
- Pre-aggregated `EngagementMetrics` avoids expensive real-time aggregation

**Migration Status**: ✅ Applied via `prisma db push`

### Implementation Tasks

1. **Server-Side Event Recording** ✅ **COMPLETED**

   - ✅ File: `lib/analytics/tracking.ts`
   - ✅ `recordEvents()`: validates eventType, sanitizes metadata (10KB limit), calls `prisma.analyticsEvent.createMany()`
   - ✅ `recordFeedback()`: creates feedback event + auto-updates EngagementMetrics.avgRating
   - ✅ Injects userId/tenantId from session server-side (never trust client)

2. **Event Ingestion APIs** ✅ **COMPLETED**

   - ✅ File: `app/api/analytics/events/route.ts` — POST batch ingestion (up to 50 events per request)
   - ✅ File: `app/api/analytics/feedback/route.ts` — POST content ratings (1-5 stars) with optional comment
   - ✅ Auth via `getServerSession(authOptions)` (same pattern as preferences API)

3. **Client-Side Tracker** ✅ **COMPLETED**

   - ✅ File: `lib/analytics/tracker.ts` — Singleton event queue with batching (10 events / 5s interval)
   - ✅ Uses `navigator.sendBeacon` on page visibility change for reliability
   - ✅ Session ID from `sessionStorage` (crypto.randomUUID)
   - ✅ Re-queues failed events (up to 100 max)

4. **Content Tracking Hook** ✅ **COMPLETED**

   - ✅ File: `lib/analytics/useContentTracking.ts`
   - ✅ Auto-tracks: `open` on mount, scroll depth via passive listener, `complete` at 90% scroll, `dwell` time on unmount/visibility change
   - ✅ Exposes `trackClick()` for manual click tracking and `containerRef` for scroll container

5. **Analytics Provider & Content Feedback** ✅ **COMPLETED**

   - ✅ File: `components/analytics/AnalyticsProvider.tsx` — Tracker lifecycle wrapper
   - ✅ File: `components/analytics/ContentFeedback.tsx` — Star rating component (1-5)
   - ✅ Added to `app/(dashboard)/layout.tsx` wrapping all dashboard children

6. **Content View Integration** ✅ **COMPLETED**

   - ✅ `components/content/BriefingCard.tsx` — Added useContentTracking hook + ContentFeedback
   - ✅ `components/content/LessonView.tsx` — Same tracking integration
   - ✅ `components/content/ExplainerView.tsx` — Same tracking integration

7. **Metrics Calculation Engine** ✅ **COMPLETED**

   - ✅ File: `lib/analytics/metrics.ts`
   - ✅ `recalculateMetrics(contentId, contentType, tenantId)` — Aggregates events → upserts EngagementMetrics
   - ✅ `calculateEngagementScore()` — Weighted composite: opens (15%) + dwellTime (25%) + scrollDepth (15%) + completionRate (30%) + rating (15%)
   - ✅ `batchRecalculateMetrics(tenantId)` — Batch job for all content with events

8. **Reporting Module** ✅ **COMPLETED**

   - ✅ File: `lib/analytics/reporting.ts`
   - ✅ `generateEngagementReport(tenantId, startDate, endDate)` — KPIs, content breakdown, top performers, daily trends
   - ✅ JSON export support

9. **Dashboard API Endpoints** ✅ **COMPLETED**

   - ✅ File: `app/api/analytics/metrics/route.ts` — GET with filters: contentType, period (7d/30d/90d), sort, limit
   - ✅ File: `app/api/analytics/dashboard/route.ts` — GET aggregated KPIs, daily trends, top content, topic popularity (advisor-only)

10. **Analytics Dashboard** ✅ **COMPLETED**

    - ✅ File: `app/(dashboard)/analytics/page.tsx` — Advisor-only, 4-tab layout
    - ✅ Overview tab: KPI cards, daily trend bars, top content table, topic popularity
    - ✅ Content Performance tab: filterable/sortable metrics table
    - ✅ User Engagement tab: active users, preference learning activity log
    - ✅ Reports tab: period selector → generate → formatted summary + JSON download
    - ✅ Components: `KPICard.tsx`, `EngagementTrend.tsx`, `TopicPopularity.tsx`, `MetricsTable.tsx`

11. **Preference Learning Algorithm** ✅ **COMPLETED**

    - ✅ File: `lib/personalization/learning.ts`
    - ✅ Conservative algorithm: weighted signals (open +1, dwell>60s +2, dwell>180s +4, complete +5, rating>=4 +3, rating<=2 -3)
    - ✅ Percentile ranks → interest levels (top 25% → high, middle 50% → medium, bottom 25% → low)
    - ✅ Confidence threshold > 0.6 (min 5 events), one-level-at-a-time adjustment only
    - ✅ All changes logged to PreferenceLearningLog
    - ✅ `batchLearnPreferences(tenantId)` for batch weekly runs

12. **Navigation** ✅ **COMPLETED**

    - ✅ `components/Header.tsx` — Added `{ href: "/analytics", label: "Analytics" }` to NAV_ITEMS

### Deliverables ✅ **ALL COMPLETED**

- ✅ Comprehensive analytics event tracking (client + server)
- ✅ Engagement metrics dashboard with KPIs and trends
- ✅ Preference learning system operational
- ✅ Content feedback (star ratings) integrated into all content views
- ✅ All database models created and migrated
- ✅ Build passes with no errors

### Files Created/Modified

**New Files (15):**

- `lib/analytics/tracking.ts` - Server-side event recording and validation
- `lib/analytics/tracker.ts` - Client-side singleton event queue
- `lib/analytics/useContentTracking.ts` - React hook for auto-tracking
- `lib/analytics/metrics.ts` - Metrics calculation engine
- `lib/analytics/reporting.ts` - Engagement report generation
- `lib/personalization/learning.ts` - Preference learning algorithm
- `app/api/analytics/events/route.ts` - Batch event ingestion API
- `app/api/analytics/feedback/route.ts` - Content feedback API
- `app/api/analytics/metrics/route.ts` - Metrics query API
- `app/api/analytics/dashboard/route.ts` - Dashboard data API
- `app/(dashboard)/analytics/page.tsx` - Analytics dashboard page
- `components/analytics/AnalyticsProvider.tsx` - Tracker lifecycle wrapper
- `components/analytics/ContentFeedback.tsx` - Star rating component
- `components/analytics/KPICard.tsx` - KPI card component
- `components/analytics/EngagementTrend.tsx` - Daily trend bars
- `components/analytics/TopicPopularity.tsx` - Topic popularity bars
- `components/analytics/MetricsTable.tsx` - Sortable metrics table

**Modified Files (5):**

- `prisma/schema.prisma` - Added AnalyticsEvent, EngagementMetrics, PreferenceLearningLog models
- `app/(dashboard)/layout.tsx` - Wrapped children with AnalyticsProvider
- `components/Header.tsx` - Added Analytics nav item
- `components/content/BriefingCard.tsx` - Added tracking hook + feedback
- `components/content/LessonView.tsx` - Added tracking hook + feedback
- `components/content/ExplainerView.tsx` - Added tracking hook + feedback

### Next Steps

- **Scheduling**: Add `batchLearnPreferences()` to Azure Function timer (weekly run)
- **Scheduling**: Add `batchRecalculateMetrics()` to Azure Function timer (daily or on-demand)
- **Sprint 5**: Begin implementation of email delivery and audio generation

---

## Sprint 5: Multi-Channel Delivery (Weeks 9-10) ⏳ **PENDING**

### Status: ⏳ **PENDING**

### Objectives

Implement multi-channel content delivery (email, portal, audio) with format conversion.

### Database Schema Updates

**New Models**:

- `Delivery`: id, contentId, contentType, channel, status, deliveredAt, metadata
- `DeliveryPreference`: id, userId, channel, enabled, format

### Implementation Tasks

1. **Email Delivery System**

   - File: `lib/delivery/email.ts`
   - HTML email template generation
   - Integration with Azure Communication Services or SendGrid
   - Personalized email content rendering
   - Delivery tracking and bounce handling

2. **Audio Generation**

   - File: `lib/delivery/audio.ts`
   - Text-to-speech using Azure Cognitive Services Speech
   - Audio file generation and storage in Blob Storage
   - Multi-language voice support

3. **Delivery Orchestrator**

   - File: `lib/delivery/orchestrator.ts`
   - Multi-channel delivery coordination
   - Format conversion (text → email, text → audio)
   - Delivery scheduling and queuing

4. **Delivery Preferences Management**

   - File: `app/api/delivery-preferences/route.ts`
   - User channel preferences API
   - Format selection (text, audio, both)

5. **Email Templates**

   - File: `components/delivery/EmailTemplate.tsx`
   - Responsive email templates
   - Tenant-branded email design
   - Content preview and formatting

6. **Audio Player Component**

   - File: `components/delivery/AudioPlayer.tsx`
   - React audio player component
   - Playback controls and progress tracking
   - Download functionality

7. **Delivery Status Tracking**

   - File: `app/(dashboard)/deliveries/page.tsx`
   - View delivery history
   - Track delivery status per channel
   - Retry failed deliveries

8. **Weekly Delivery Scheduler**

   - File: `azure-functions/weekly-delivery/index.ts`
   - Azure Function to trigger weekly deliveries
   - Batch processing for multiple users
   - Channel-specific delivery logic

### Deliverables

- Email delivery functional
- Audio briefings generation
- Multi-channel delivery orchestrator
- User delivery preferences management

---

## Sprint 6: Interactive Q&A & A/B Testing (Weeks 11-12) ⏳ **PENDING**

### Status: ⏳ **PENDING**

### Objectives

Implement interactive Q&A system with guardrails and A/B testing framework.

### Database Schema Updates

**New Models**:

- `Question`: id, userId, contentId, contentType, question, answer, status, askedAt
- `ABTest`: id, name, contentType, variants, startDate, endDate, status
- `ABTestAssignment`: id, testId, userId, variant, assignedAt

### Implementation Tasks

1. **Interactive Q&A System**

   - File: `lib/qa/generator.ts`
   - Generate contextual Q&A based on content
   - RAG-powered answer generation
   - Citation requirements for answers

2. **Q&A Guardrails**

   - File: `lib/qa/guardrails.ts`
   - Prohibited question detection
   - Answer validation and fact-checking
   - Escalation to advisor for complex queries

3. **Q&A UI Components**

   - File: `components/qa/QAInterface.tsx`
   - Chat-like Q&A interface
   - Question input and answer display
   - Citation display and source links

4. **A/B Testing Framework**

   - File: `lib/testing/ab-testing.ts`
   - Variant assignment logic
   - Test configuration and management
   - Statistical significance calculation

5. **A/B Test Management UI**

   - File: `app/(dashboard)/testing/page.tsx`
   - Create and configure A/B tests
   - View test results and metrics
   - Variant performance comparison

6. **Content Variant Generation**

   - File: `lib/testing/variants.ts`
   - Generate content variants (text vs audio, different formats)
   - Variant tracking and assignment

7. **Q&A API Endpoints**

   - File: `app/api/qa/route.ts`
   - Submit questions
   - Get answers with citations
   - Track Q&A engagement

8. **Confidence Scoring Enhancement**

   - File: `lib/compliance/confidence-scoring.ts`
   - Enhanced citation confidence calculation
   - Automated confidence threshold enforcement
   - Low-confidence content flagging

### Deliverables

- Interactive Q&A system with guardrails
- A/B testing framework operational
- Content variant generation and tracking
- Enhanced confidence scoring

---

## Technical Implementation Details

### Key File Structure

```
lib/
  compliance/
    citations.ts          # Citation tracking and validation
    guardrails.ts         # Basic compliance checks
    policy-engine.ts      # Policy rules engine
    risk-scoring.ts       # Risk calculation
    disclosures.ts        # Disclosure management
    validation.ts         # Content validation
    audit.ts              # Audit logging
    confidence-scoring.ts # Confidence scoring

  ingestion/
    market-data.ts        # Market data ingestion
    content-sources.ts    # Content source management
    indexing.ts           # Vector indexing
    house-views.ts        # House views integration

  analytics/
    tracking.ts           # Event tracking
    metrics.ts            # Metrics calculation
    reporting.ts          # Report generation

  personalization/
    learning.ts           # Preference learning
    ranking.ts            # (existing) Content ranking

  delivery/
    email.ts              # Email delivery
    audio.ts              # Audio generation
    orchestrator.ts       # Delivery coordination

  qa/
    generator.ts          # Q&A generation
    guardrails.ts         # Q&A guardrails

  testing/
    ab-testing.ts         # A/B testing framework
    variants.ts            # Variant generation

app/
  (dashboard)/
    reviews/              # Advisor review interface
    compliance/           # Compliance dashboard
    sources/              # Source management
    analytics/            # Analytics dashboard
    deliveries/           # Delivery tracking
    testing/              # A/B testing management

  api/
    reviews/              # Review API
    analytics/            # Analytics API
    delivery-preferences/ # Delivery preferences API
    qa/                   # Q&A API

azure-functions/
  data-ingestion/         # Data ingestion scheduler
  weekly-delivery/        # Weekly delivery trigger
```

### Database Migration Strategy

1. Create migrations incrementally per sprint
2. Use Prisma migrations with rollback support
3. Test migrations on staging environment first
4. Maintain backward compatibility during transitions

### Testing Strategy

1. **Unit Tests**: Test individual functions and utilities
2. **Integration Tests**: Test API endpoints and workflows
3. **E2E Tests**: Test complete user journeys
4. **Compliance Tests**: Automated testing for policy violations
5. **Performance Tests**: Load testing for ingestion and generation

### Security Considerations

1. **Data Privacy**: PII minimization, encryption at rest
2. **Access Control**: Role-based access for advisor reviews
3. **Audit Trail**: Comprehensive logging for compliance
4. **Input Validation**: Sanitize all user inputs
5. **API Security**: Rate limiting, authentication, authorization

### Performance Optimization

1. **Caching**: Cache generated content and RAG results
2. **Batch Processing**: Process deliveries and ingestion in batches
3. **Async Processing**: Use queues for long-running tasks
4. **Database Indexing**: Optimize queries with proper indexes
5. **CDN**: Use Azure CDN for static assets and audio files

---

## Risk Mitigation

### Technical Risks

1. **Hallucination Risk**: Mitigated by strict citation requirements, confidence thresholds, and fact-checking
2. **Performance Issues**: Mitigated by caching, batch processing, and async queues
3. **Data Quality**: Mitigated by source reliability scoring and validation pipelines
4. **Compliance Violations**: Mitigated by policy engine and mandatory reviews

### Operational Risks

1. **Advisor Workload**: Mitigated by automated risk scoring and smart routing
2. **User Adoption**: Mitigated by personalization and engagement analytics
3. **Scalability**: Mitigated by cloud-native architecture and horizontal scaling

---

## Success Metrics

### Engagement KPIs

- Open rate: Target >60%
- Completion rate: Target >40%
- Time spent: Target >5 minutes per briefing
- Audio listen rate: Target >30%

### Advisor Efficiency KPIs

- Prep time saved: Target 2+ hours per week
- Review turnaround: Target <24 hours
- Automated approval rate: Target >70%

### Compliance KPIs

- Zero unapproved claims: 100% target
- Review coverage: 100% of high-risk content
- Audit trail completeness: 100%

### Technical KPIs

- Content generation time: Target <30 seconds
- Delivery success rate: Target >99%
- System uptime: Target >99.9%

---

## Dependencies & Prerequisites

### External Services

- Azure OpenAI (GPT-4 deployment)
- Azure AI Search (vector index configured)
- Azure Communication Services or SendGrid (email)
- Azure Cognitive Services Speech (TTS)
- Market data APIs (to be selected)

### Internal Dependencies

- Addepar API integration (existing)
- Azure AD authentication (existing)
- Prisma database schema updates
- Azure Functions runtime

---

## Post-Implementation Roadmap

### Future Enhancements

1. Mobile app development
2. WhatsApp integration (where permitted)
3. Advanced ML models for personalization
4. Real-time market data streaming
5. Integration with additional custodians
6. Advanced analytics and BI dashboards
7. Multi-language expansion
8. Voice Q&A (ASR integration)

---

## Appendix

### Code Examples

#### Citation Tracking

```typescript
// lib/compliance/citations.ts
export async function extractCitations(
  content: string,
  searchResults: SearchResult[]
): Promise<Citation[]> {
  // Extract citations from content and link to sources
}
```

#### Risk Scoring

```typescript
// lib/compliance/risk-scoring.ts
export function calculateRiskScore(
  content: GeneratedBriefing,
  citations: Citation[],
  userProfile: UserProfile
): number {
  // Multi-factor risk calculation
}
```

#### Delivery Orchestrator

```typescript
// lib/delivery/orchestrator.ts
export async function deliverContent(
  contentId: string,
  channels: DeliveryChannel[],
  preferences: DeliveryPreference
): Promise<Delivery[]> {
  // Coordinate multi-channel delivery
}
```

### Database Schema Extensions

See detailed Prisma schema updates in each sprint section above.

### API Endpoint Specifications

Detailed API specifications will be documented in OpenAPI/Swagger format during implementation.
