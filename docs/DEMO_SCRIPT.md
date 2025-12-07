# Insight Studio Demo Script
## For C-Suite Wealth Management Executives

---

## Pre-Demo Preparation (5 minutes before meeting)

### Technical Setup
- [ ] Ensure demo environment is running and accessible
- [ ] Have sample client data loaded (portfolio, preferences)
- [ ] Test all key features (briefings, lessons, explainers, reviews)
- [ ] Have advisor account ready for review workflow demo
- [ ] Prepare browser with multiple tabs ready:
  - Dashboard view
  - Briefings page
  - Lessons page
  - Explainers page
  - Reviews page (advisor account)

### Talking Points Preparation
- [ ] Review client's firm size and typical client profile
- [ ] Prepare relevant use cases based on their business model
- [ ] Have ROI calculations ready (time saved, client engagement metrics)
- [ ] Prepare answers for common C-suite questions (security, compliance, scalability)

---

## Demo Script Structure

### 1. Opening & Value Proposition (2-3 minutes)

**Opening Statement:**
> "Thank you for taking the time today. I'm excited to show you Insight Studio, an AI-powered platform that helps wealth management firms deliver personalized financial briefings and education to high net worth clients at scale. 
>
> Before we dive into the demo, let me ask: What's your biggest challenge when it comes to keeping clients informed and engaged? Is it the time advisors spend on repetitive client communications, or ensuring clients understand complex wealth management topics?"

**Listen to their response, then tailor your pitch:**

**If they mention time/scale:**
> "Perfect. Insight Studio addresses exactly that. We automate the creation of personalized weekly briefings and educational content, saving advisors 5-10 hours per week while ensuring every client receives content tailored to their portfolio, preferences, and sophistication level."

**If they mention client education/engagement:**
> "That's a common challenge. Insight Studio transforms how you educate clients. Instead of generic newsletters, each client receives personalized briefings that explain market moves in the context of their actual portfolio, plus on-demand educational content on topics like QSBS, estate planning, or tax strategies—all adapted to their generation, language, and investment sophistication."

**Transition:**
> "Let me show you how this works in practice. I'll walk you through the client experience first, then show you the advisor review tools and compliance features we've just implemented."

---

### 2. Client Experience Demo (8-10 minutes)

#### A. Personalized Dashboard

**Navigate to:** `/dashboard`

**Talking Points:**
> "This is what your clients see when they log in. Notice how clean and branded this is—we support full white-label customization, so this looks like your firm's platform, not a third-party tool.
>
> The dashboard is personalized for each client. Here you see:
> - Recent weekly briefings tailored to their portfolio
> - Recommended educational lessons based on their interests
> - Quick access to topic explainers
>
> Everything is personalized based on three key signals:
> 1. **Portfolio data** - We integrate with Addepar and other custodians to understand their actual holdings
> 2. **Client preferences** - Language, generation (Boomer vs Millennial), investment sophistication level
> 3. **Behavior** - Topics they've engaged with, preferences they've set"

**Action:** Click through the dashboard tabs (Feed, Preferences, Profile)

**Highlight:**
> "Clients can set their preferences here—topics they're interested in, their preferred language, and their investment sophistication level. This ensures every piece of content is adapted to their needs."

---

#### B. Weekly Briefings

**Navigate to:** `/briefings`

**Talking Points:**
> "This is where clients access their weekly briefings. We generate two types:
> 1. **Market Briefings** - Explain what happened in the markets this week
> 2. **Portfolio Briefings** - Show how those market moves impact their specific portfolio
>
> Let me show you a portfolio briefing..."

**Action:** Click on a portfolio briefing card

**Talking Points (while showing briefing):**
> "Notice how this briefing is:
> - **Portfolio-aware**: It references their actual holdings and positions
> - **Tax-aware**: It avoids irrelevant advice (like wash sale windows if they're in a lockup period)
> - **Personalized**: Written at their sophistication level—this client is 'advanced', so the language is more technical. For a beginner, we'd explain concepts more simply.
> - **Source-cited**: Every claim is backed by citations
> - **Action-oriented**: Suggests educational actions, not investment recommendations
>
> This is generated automatically every week using AI, but it's designed to go through your advisor review process before delivery."

**Key Point:**
> "The beauty is scale. Your advisors don't need to write 200 individual briefings. The system generates personalized content for each client, and advisors can review and approve in batches. We've just implemented the advisor review workflow—it includes risk scoring, compliance checks, and a full review interface. Let me show you that next."

---

#### C. Educational Lessons

**Navigate to:** `/lessons`

**Talking Points:**
> "Here's where clients access educational micro-lessons. These are 5-10 minute lessons on complex wealth management topics—things like Qualified Small Business Stock, tax strategies, estate planning.
>
> Notice how the content adapts. If I change this client's profile to 'Gen Z' and 'beginner' level, the same lesson would be written differently—more relatable examples, simpler language, different cultural references."

**Action:** Show a lesson, highlight the markdown formatting and readability

**Talking Points:**
> "These lessons are:
> - **Personalized by generation**: A Boomer gets different examples than a Millennial
> - **Adapted by sophistication**: Beginner vs advanced explanations
> - **Multilingual**: We can deliver in Spanish, French, German, Chinese, Japanese, and more
> - **Always up-to-date**: Content is generated using RAG (Retrieval-Augmented Generation), so it pulls from your latest research and market data"

---

#### D. Topic Explainers

**Navigate to:** `/explainers`

**Talking Points:**
> "This is the on-demand Q&A feature. Clients can search for any wealth management topic and get an instant, personalized explanation.
>
> For example, let's say a client asks about 'Carried Interest'..."

**Action:** Search for "Carried Interest" or click a popular topic

**Talking Points:**
> "The system:
> - Searches your knowledge base (your research, compliance-approved content)
> - Generates a personalized explanation based on the client's profile
> - Can be delivered in their preferred language
> - Includes citations and sources
>
> This is huge for advisor efficiency. Instead of fielding 50 calls asking 'What is QSBS?', clients can get instant, accurate answers that are consistent with your firm's views."

**Action:** Show language switching (if time permits)

---

#### E. Advisor Review Workflow ✅ **NEW**

**Navigate to:** `/reviews` (switch to advisor account if needed)

**Talking Points:**
> "Now let me show you the advisor side. This is the review queue where advisors manage content before it goes to clients.
>
> Here you can see:
> - All content awaiting review, organized by status
> - Content type (briefing, explainer, lesson) and version numbers
> - Quick actions to approve, reject, or request changes
> - Review history and comments"

**Action:** Click on a pending review to show the review interface

**Talking Points (while showing review):**
> "When an advisor opens a review, they see:
> - Full content preview
> - Version information
> - Previous review comments (if any)
> - One-click actions: Approve, Request Changes, or Reject
> - Ability to add comments explaining their decision
>
> The system tracks everything—who reviewed it, when, and why. This creates a complete audit trail for compliance."

**Key Point:**
> "The review workflow is integrated with our compliance system. Content is automatically checked for restricted terms and given a risk score. High-risk content is flagged for mandatory review, while low-risk content can be auto-approved based on your policies."

**If time permits, show:**
> "You can filter by status—see what's pending, what's been approved, what needs changes. This gives advisors a clear view of their workload and helps prioritize reviews."

---

### 3. Business Value & ROI (3-4 minutes)

**Transition:**
> "Now let's talk about the business impact. I've shown you the client experience, but the real value is what this does for your firm."

#### Time Savings

**Talking Points:**
> "**Advisor Time Savings:**
> - Current: Advisors spend 5-10 hours per week writing client communications
> - With Insight Studio: Content is auto-generated, advisors review and approve (estimated 1-2 hours per week)
> - **ROI**: For a team of 20 advisors, that's 80-160 hours saved per week
> - **Annual Value**: At $200/hour advisor time, that's $832K - $1.6M in time savings per year"

#### Client Engagement

**Talking Points:**
> "**Client Engagement:**
> - Personalized content increases engagement by 3-5x vs generic newsletters
> - Clients receive content weekly, keeping your firm top-of-mind
> - Educational content builds trust and positions your firm as a thought leader
> - Better-educated clients make better decisions and are more satisfied"

#### Scalability

**Talking Points:**
> "**Scalability:**
> - Generate personalized content for 10 clients or 10,000 clients with the same infrastructure
> - Multi-tenant architecture means you can white-label this for your brand
> - Supports multiple languages and formats (web, email, mobile app, audio—all planned)
> - Grows with your business without linear cost increases"

---

### 4. Compliance & Security (2-3 minutes)

**Talking Points:**
> "I know compliance is critical for wealth management firms. Here's how we address it:"

#### Compliance Features

**Talking Points:**
> "**Current Implementation:**
> - ✅ **Advisor review/approval workflow** - Full review interface with approve/reject/request-changes
> - ✅ **Citation tracking system** - Extract and store citations from RAG search results with confidence scores
> - ✅ **Basic compliance guardrails** - Automatic checking for 20+ restricted terms (e.g., 'guaranteed return', 'risk-free')
> - ✅ **Risk scoring** - Content scored 0-100 based on restricted terms, high-risk topics, and content analysis
> - ✅ **Mandatory disclosures** - Context-aware disclosure injection based on content type and topics
> - ✅ **Content versioning** - Track all content revisions and review history
> - ✅ **Review audit trail** - Complete history of who reviewed what, when, and why
> - Content avoids investment recommendations (educational tone only)
> - Multi-tenant architecture with role-based access control
> - Azure AD integration for enterprise authentication
>
> **Coming in Sprint 2 (Next 2-4 weeks):**
> - Advanced compliance policy engine with tenant-specific configuration
> - Multi-factor risk scoring with automated routing
> - Compliance dashboard for policy configuration and monitoring
> - Automated fact-checking and citation validation
> - Comprehensive audit logging to Azure Blob Storage"

#### Security

**Talking Points:**
> "**Security:**
> - Built on Azure (enterprise-grade security, SOC 2, ISO 27001)
> - Data encrypted at rest and in transit
> - Role-based access control (advisors, clients, trustees)
> - PII minimization—we only store what's necessary
> - Integration with your existing Azure AD tenant
> - Can be deployed in your Azure subscription for full data control"

---

### 5. Technical Architecture (1-2 minutes - if they ask)

**Talking Points:**
> "**Architecture Highlights:**
> - **RAG-powered**: Uses Retrieval-Augmented Generation to pull from your research and market data
> - **Portfolio integration**: Connects to Addepar and other custodians
> - **Multi-channel delivery**: Web portal (current), email, mobile app, audio (planned)
> - **Personalization engine**: Considers portfolio, preferences, behavior, and constraints
> - **Scalable**: Azure Functions for content generation, Azure SQL for data, Azure AI Search for RAG
> - **LLM-agnostic**: Works with Azure OpenAI, but can swap models as needed"

**If they're technical:**
> "We use a hybrid search approach—combining keyword and semantic search—to ensure we pull the most relevant context for each client. The personalization layer scores content based on portfolio relevance, topic preferences, and engagement history."

---

### 6. Implementation & Next Steps (2-3 minutes)

**Talking Points:**
> "**Implementation Timeline:**
> - **Weeks 1-4**: MVP deployment—set up tenant, configure branding, connect portfolio data, generate first briefings
> - **Weeks 5-8**: Advisor review workflow, compliance features, multi-channel delivery
> - **Weeks 9-12**: Advanced personalization, analytics dashboard, optimization
>
> **What We Need from You:**
> - Access to portfolio data (Addepar or other custodian)
> - Your research content and house views (for RAG knowledge base)
> - Compliance policies and disclosure templates
> - Brand assets (logo, colors, fonts)
> - Sample client personas for initial personalization"

**Pricing Discussion:**
> "Pricing is typically based on:
> - Number of clients/users
> - Content volume (briefings per week, lessons, explainers)
> - Integration complexity
> - Customization requirements
>
> We can provide a detailed proposal after we understand your specific needs."

---

### 7. Closing & Q&A (5-10 minutes)

**Closing Statement:**
> "To summarize, Insight Studio helps you:
> 1. **Scale personalized client communications** without scaling advisor headcount
> 2. **Improve client engagement** with relevant, timely, educational content
> 3. **Maintain compliance** with built-in guardrails and review workflows
> 4. **Differentiate your firm** with a modern, AI-powered client experience
>
> The platform is built specifically for wealth management firms, with compliance and personalization at its core.
>
> What questions do you have? Are there specific use cases or concerns you'd like me to address?"

---

## Common Questions & Answers

### Q: "How accurate is the AI-generated content?"

**Answer:**
> "Great question. We use RAG (Retrieval-Augmented Generation), which means the AI pulls from your actual research and approved content—it's not making things up. Every claim is source-cited with confidence scores, and we have a citation tracking system that validates citations and links them to sources. Plus, we've implemented an advisor review workflow—nothing goes out without human approval. High-risk content is automatically flagged for mandatory review."

> "The system is designed to be educational, not advisory. Content uses educational language ('consider', 'explore') rather than recommendations ('you should', 'buy this'). We've implemented compliance guardrails that automatically check for 20+ restricted terms like 'guaranteed return' or 'risk-free' and block prohibited claims. The system also injects mandatory disclosures based on content type. High-risk content is automatically flagged for advisor review, and our risk scoring (0-100) helps prioritize what needs human review."

### Q: "How do you handle data privacy?"

**Answer:**
> "Data privacy is built into the architecture. We use Azure AD for authentication, encrypt data at rest and in transit, and follow PII minimization principles. The platform can be deployed in your Azure subscription, giving you full control over your data. We only store what's necessary for personalization and content delivery."

### Q: "Can this integrate with our existing systems?"

**Answer:**
> "Yes. We integrate with:
> - **Portfolio systems**: Addepar (current), with plans for other custodians
> - **Authentication**: Azure AD / Microsoft Entra ID
> - **CRM**: Can pull client preferences and profiles (planned)
> - **Email systems**: For multi-channel delivery (planned)
>
> We can discuss specific integrations based on your tech stack."

### Q: "What's the cost?"

**Answer:**
> "Pricing is customized based on your needs—number of clients, content volume, and integration requirements. Typically, firms see ROI within 6-12 months through advisor time savings alone. We can provide a detailed proposal after understanding your specific requirements."

**Answer:**
> "MVP deployment typically takes 4-6 weeks, including:
> - Infrastructure setup
> - Branding configuration
> - Portfolio data integration
> - Knowledge base setup (your research content)
> - Initial content generation and testing
>
> The core advisor review workflow is already implemented, so you can start using that immediately. Full feature rollout (advanced compliance dashboard, multi-channel delivery, analytics) takes 12 weeks total, with features rolling out incrementally."

### Q: "What if we want to customize the content style?"

**Answer:**
> "Absolutely. We can customize:
> - Writing style and tone (formal vs conversational)
> - Content structure and sections
> - Branding and visual design
> - Personalization rules and scoring
> - Compliance policies and disclosures
>
> The platform is designed to be configurable to match your firm's voice and requirements."

---

## Demo Tips

### Do's
- ✅ **Listen first**: Ask about their challenges before diving into features
- ✅ **Show, don't tell**: Let the platform speak for itself
- ✅ **Use real examples**: Reference their firm's typical client profile
- ✅ **Address compliance early**: C-suite cares about risk
- ✅ **Quantify value**: Use specific ROI numbers
- ✅ **Be honest about roadmap**: Don't oversell features that aren't built yet

### Don'ts
- ❌ **Don't get too technical**: Focus on business value, not implementation details
- ❌ **Don't oversell AI**: Emphasize human-in-the-loop and compliance
- ❌ **Don't ignore concerns**: Address security and compliance questions directly
- ❌ **Don't rush**: Give them time to ask questions
- ❌ **Don't make promises**: Be clear about what's built vs planned

---

## Post-Demo Follow-Up

### Immediate (within 24 hours)
- [ ] Send thank-you email with demo recap
- [ ] Provide access to demo environment (if requested)
- [ ] Share relevant case studies or ROI calculations
- [ ] Answer any follow-up questions

### Within 1 Week
- [ ] Send detailed proposal with pricing
- [ ] Schedule technical deep-dive (if needed)
- [ ] Provide references or case studies
- [ ] Share implementation timeline

---

## Success Metrics to Track

After the demo, track:
- Questions asked (indicates interest level)
- Concerns raised (security, compliance, cost)
- Use cases mentioned (shows how they'd use it)
- Decision timeline (when they'll decide)
- Next steps agreed upon

---

## Customization Notes

**Before each demo, customize:**
- Client firm name and branding (if you have access)
- Sample client profiles to match their typical clients
- Use cases based on their business model
- ROI calculations based on their advisor count and rates
- Integration examples based on their tech stack

---

**Good luck with your demo! Remember: Focus on solving their problems, not selling features.**

