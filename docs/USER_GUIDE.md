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

**Capabilities** (Planned):
- Review and approve generated briefings, lessons, and explainers
- Redline content and request revisions
- Access compliance dashboard and risk scoring
- Configure policy rules and disclosures
- Monitor content analytics and client engagement
- Manage content versioning and audit trails

**Current Status**: Advisor review workflow is planned but not yet implemented. See [Technical Implementation Plan](../.cursor/plans/technical-implementation-plan-fc164b9a.plan.md) for roadmap.

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
  - What happened in the markets
  - Why it matters to their portfolio
  - Portfolio impact (tax-aware)
  - Suggested actions (educational tone)
  - Source citations

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
  - Set interest levels for different topics
  - Update language preferences
  - Adjust content format preferences

#### 6. **Profile Settings**
- **Location**: `/dashboard` → Profile tab
- **Features**:
  - View and update language preference
  - Set generation (Gen X, Millennial, Gen Z, Boomer)
  - Configure investment sophistication level (beginner, intermediate, advanced)
  - View role and email (read-only)

### For Wealth Advisors (Planned)

#### 1. **Review Queue** (Planned)
- **Location**: `/reviews` (to be implemented)
- **Features**:
  - View pending content awaiting review
  - Filter by content type, risk score, or client
  - See content status (draft, pending_review, approved, published)

#### 2. **Content Review Interface** (Planned)
- **Features**:
  - Side-by-side comparison of content versions
  - Approve, reject, or request changes
  - Add comments and redlines
  - View citations and confidence scores
  - See risk scoring and compliance flags

#### 3. **Compliance Dashboard** (Planned)
- **Location**: `/compliance` (to be implemented)
- **Features**:
  - Configure policy rules and restricted terms
  - View risk score visualizations
  - Access violation reports and audit logs
  - Manage disclosure templates

#### 4. **Content Analytics** (Planned)
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
3. **Validation**: Automatic checks for facts, sources, and restricted terms
4. **Risk Scoring**: Content is scored to determine if advisor review is needed
5. **Advisor Review**: (Planned) Advisors review, redline, approve, or request revisions
6. **Delivery**: Content is pushed to clients via selected channels
7. **Feedback Loop**: Engagement data is captured to update preferences

## Current Implementation Status

### ✅ Implemented Features

- Multi-tenant architecture with theme configuration
- User authentication via Azure AD
- Client-facing dashboard and content views
- Content generation (briefings, explainers, lessons) with RAG via Azure AI Search
- Enhanced markdown rendering for lessons and explainers with improved typography and readability
- Personalization based on user preferences, generation, language, and sophistication level
- Portfolio data integration with Addepar
- Weekly briefings Azure Function (scheduled)
- Database schema with user roles

### 🚧 Planned Features

- Advisor review/approval workflow with audit trail
- Citation tracking and source validation
- Compliance guardrails and policy rules engine
- Content analytics and engagement tracking
- Multi-channel delivery (email, mobile app, audio)
- Interactive Q&A with guardrails
- A/B testing framework
- Risk scoring and automated content validation

See [Technical Implementation Plan](../.cursor/plans/technical-implementation-plan-fc164b9a.plan.md) for detailed roadmap.

## Getting Started

### For Clients

1. Sign in using your Azure AD credentials
2. Complete your profile settings (language, generation, sophistication level)
3. Set your topic preferences
4. Explore your personalized dashboard
5. Read weekly briefings and educational lessons

### For Advisors

The advisor interface is currently in development. Once implemented, advisors will be able to:
1. Access the review queue to see pending content
2. Review and approve content before delivery
3. Configure compliance policies
4. Monitor content analytics

## Additional Resources

- [Functional Requirements](./FUNCTIONAL_REQUIREMENTS.md) - Complete feature specifications
- [Technical Implementation Plan](../.cursor/plans/technical-implementation-plan-fc164b9a.plan.md) - Development roadmap
- [Setup Guide](../SETUP.md) - Environment setup and configuration
- [Theme Configuration](./THEME_CONFIGURATION.md) - Multi-tenant branding setup

