<!-- fc164b9a-ecfb-4426-ac17-0d31d91459c1 881e3a70-2a1d-477c-aef8-2b98c56f23c3 -->
# Technical Implementation Plan for Insight Studio

## Executive Summary

This document outlines the technical implementation plan for Insight Studio, an AI-powered personalized briefings and education hub for wealth management firms. The plan builds upon the existing MVP codebase and delivers all capabilities specified in the functional requirements document over a structured sprint-based timeline.

### Current State (MVP)

The existing codebase provides:

- Multi-tenant architecture with theme configuration
- User authentication via Azure AD
- Basic content generation (briefings, explainers, lessons) with RAG via Azure AI Search
- Personalization based on user preferences, generation, language, and sophistication level
- Portfolio data integration with Addepar
- Weekly briefings Azure Function (scheduled)
- Database schema with Prisma ORM

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

## Sprint 1: MVP Completion - Advisor Review & Citations (Weeks 1-2)

### Objectives

Complete core MVP gaps: advisor review workflow, citation tracking, and basic compliance guardrails.

### Database Schema Updates

**New Models** (`prisma/schema.prisma`):

- `ContentReview`: id, contentId, contentType, status, reviewerId, reviewedAt, comments, version
- `ContentSource`: id, type, title, url, date, reliabilityScore, tags, tenantId
- `Citation`: id, contentId, contentType, sourceId, text, confidenceScore, position
- `ContentVersion`: id, contentId, contentType, version, content, generatedAt, status

**Schema Changes**:

- Add `status`, `version`, `reviewerId`, `reviewedAt` to `Briefing` model
- Add `citations` JSON field to `Briefing`, `Explainer`, `Lesson`
- Add `riskScore`, `requiresReview` flags

### Implementation Tasks

1. **Citation Tracking System**

   - File: `lib/compliance/citations.ts`
   - Extract citations from RAG search results
   - Store citations with source references in database
   - Validate citation links and confidence scores

2. **Content Review Models & API**

   - File: `app/api/reviews/route.ts`
   - CRUD operations for content reviews
   - Status workflow: `draft` → `pending_review` → `approved` → `published`
   - Version tracking for content revisions

3. **Advisor Review UI**

   - File: `app/(dashboard)/reviews/page.tsx`
   - Review queue showing pending content
   - Review interface with approve/reject/request-changes actions
   - Side-by-side comparison for revisions

4. **Basic Compliance Guardrails**

   - File: `lib/compliance/guardrails.ts`
   - Restricted terms list checking
   - Mandatory disclosure injection
   - Risk scoring algorithm (0-100 based on content analysis)

5. **Database Migration**

   - Create Prisma migration for new models
   - Update existing briefings with default status values

### Deliverables

- Advisor review workflow functional
- Citations tracked and displayed in content
- Basic compliance checks running
- Content versioning system in place

---

## Sprint 2: Compliance Engine & Risk Scoring (Weeks 3-4)

### Objectives

Build comprehensive compliance engine with policy rules, automated risk scoring, and disclosure management.

### Implementation Tasks

1. **Policy Rules Engine**

   - File: `lib/compliance/policy-engine.ts`
   - Tenant-specific policy configuration
   - Rule evaluation engine (prohibited terms, required disclosures, content restrictions)
   - Policy violation detection and reporting

2. **Risk Scoring System**

   - File: `lib/compliance/risk-scoring.ts`
   - Multi-factor risk calculation:
     - Content sensitivity (market stress, product mentions)
     - Citation confidence scores
     - User profile risk level
     - Historical content patterns
   - Automatic routing to advisor review based on thresholds

3. **Disclosure Management**

   - File: `lib/compliance/disclosures.ts`
   - Disclosure template library
   - Context-aware disclosure selection
   - Automatic injection into generated content

4. **Compliance Dashboard**

   - File: `app/(dashboard)/compliance/page.tsx`
   - Policy configuration UI
   - Risk score visualization
   - Violation reports and audit logs

5. **Content Validation Pipeline**

   - File: `lib/compliance/validation.ts`
   - Pre-generation validation (input sanitization)
   - Post-generation validation (fact checking, citation verification)
   - Automated testing for hallucinations

6. **Audit Logging**

   - File: `lib/compliance/audit.ts`
   - Log all prompts, inputs, outputs, and reviewer actions
   - Store in Azure Blob Storage with retention policies
   - Searchable audit trail interface

### Deliverables

- Policy rules engine operational
- Automated risk scoring and routing
- Disclosure management system
- Comprehensive audit logging

---

## Sprint 3: Data Ingestion & Content Sources (Weeks 5-6)

### Objectives

Build data ingestion pipeline for market/macro data and content source management.

### Database Schema Updates

**New Models**:

- `MarketData`: id, type, source, data, date, tenantId
- `ContentIngestion`: id, sourceType, status, lastRun, nextRun, config
- `SourceMetadata`: id, sourceId, key, value

### Implementation Tasks

1. **Market Data Ingestion**

   - File: `lib/ingestion/market-data.ts`
   - Integrate with market data APIs (Alpha Vantage, Yahoo Finance, or custom feeds)
   - Scheduled ingestion via Azure Function
   - Data normalization and storage

2. **Content Source Management**

   - File: `lib/ingestion/content-sources.ts`
   - RSS feed ingestion for research/news
   - PDF/document parsing and indexing
   - Source reliability scoring

3. **Vector Indexing Pipeline**

   - File: `lib/ingestion/indexing.ts`
   - Embed content with metadata (date, source, asset class)
   - Update Azure AI Search index
   - Hybrid search optimization (keyword + semantic)

4. **Ingestion Scheduler**

   - File: `azure-functions/data-ingestion/index.ts`
   - Timer-triggered Azure Function
   - Configurable ingestion schedules per source type
   - Error handling and retry logic

5. **Source Management UI**

   - File: `app/(dashboard)/sources/page.tsx`
   - Configure data sources
   - Monitor ingestion status
   - View source reliability metrics

6. **House Views Integration**

   - File: `lib/ingestion/house-views.ts`
   - Tenant-specific house view storage
   - Integration with RAG prompts
   - Version management for house views

### Deliverables

- Automated market data ingestion
- Content source management system
- Vector indexing pipeline operational
- House views integrated into generation

---

## Sprint 4: Analytics & Engagement Tracking (Weeks 7-8)

### Objectives

Implement content analytics, engagement tracking, and preference learning system.

### Database Schema Updates

**New Models**:

- `ContentAnalytics`: id, contentId, contentType, userId, eventType, timestamp, metadata
- `EngagementMetrics`: id, contentId, opens, dwellTime, completionRate, lastEngaged
- `UserBehavior`: id, userId, eventType, contentId, timestamp, metadata

### Implementation Tasks

1. **Analytics Event Tracking**

   - File: `lib/analytics/tracking.ts`
   - Client-side event tracking (opens, clicks, scroll depth, time on page)
   - Server-side event logging
   - Integration with Application Insights

2. **Engagement Metrics Calculation**

   - File: `lib/analytics/metrics.ts`
   - Calculate engagement scores
   - Track completion rates
   - Identify popular topics and formats

3. **Preference Learning System**

   - File: `lib/personalization/learning.ts`
   - Analyze user behavior patterns
   - Update user preferences based on engagement
   - Topic interest level adjustments

4. **Analytics Dashboard**

   - File: `app/(dashboard)/analytics/page.tsx`
   - Content performance metrics
   - User engagement visualization
   - Topic popularity trends
   - Advisor efficiency metrics (prep time saved)

5. **Feedback Loop Integration**

   - File: `app/api/analytics/route.ts`
   - API endpoints for tracking events
   - Real-time preference updates
   - A/B test variant tracking

6. **Reporting System**

   - File: `lib/analytics/reporting.ts`
   - Weekly/monthly engagement reports
   - KPI tracking (open rates, completion, action uptake)
   - Export capabilities

### Deliverables

- Comprehensive analytics tracking
- Engagement metrics dashboard
- Preference learning system operational
- Feedback loop integrated

---

## Sprint 5: Multi-Channel Delivery (Weeks 9-10)

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

## Sprint 6: Interactive Q&A & A/B Testing (Weeks 11-12)

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

### To-dos

- [ ] Implement citation tracking system with source references and confidence scores
- [ ] Create content review database models and API endpoints
- [ ] Build advisor review UI with approve/reject/request-changes workflow
- [ ] Implement basic compliance guardrails (restricted terms, disclosures)
- [ ] Build policy rules engine with tenant-specific configuration
- [ ] Implement multi-factor risk scoring system with automated routing
- [ ] Create comprehensive audit logging system for compliance
- [ ] Build market data ingestion pipeline with scheduled Azure Function
- [ ] Implement vector indexing pipeline for RAG content with metadata
- [ ] Implement analytics event tracking and engagement metrics
- [ ] Build preference learning system based on user engagement
- [ ] Implement email delivery system with personalized templates
- [ ] Build audio generation system using Azure Cognitive Services Speech
- [ ] Create multi-channel delivery orchestrator with format conversion
- [ ] Implement interactive Q&A system with RAG-powered answers and guardrails
- [ ] Build A/B testing framework with variant assignment and tracking