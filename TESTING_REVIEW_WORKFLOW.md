# Testing Guide: Review Workflow

This guide explains how to test that the automatic review creation and review workflow is working correctly.

## Prerequisites

1. **User Roles**: You need at least two user accounts:

   - A regular user (to generate content)
   - An advisor user (to review content)

2. **Database Access**: Access to check the database directly (optional but helpful)

## Test Scenarios

### Scenario 1: Generate Content That Requires Review

The system automatically creates a review when content has a risk score ≥ 50. Risk scores are calculated based on:

- Restricted terms (each violation adds 20 points)
- High-risk terms (each term adds 5 points)
- Content sensitivity (market stress, product mentions)
- Citation confidence scores
- User profile risk level
- Historical content patterns

#### Test 1: Generate Briefing with High-Risk Content

1. **Navigate to Briefings page** (`/briefings`)
2. **Generate a market briefing** by clicking "Generate Market Briefing"
3. **Check the browser console** for logs like:

   ```
   [Briefings] Risk score calculated: { riskScore: X, requiresReview: true/false }
   [Briefings] Created review for briefing {id}
   ```

4. **Navigate to Reviews page** (`/reviews`)
5. **Verify**:
   - The briefing appears in the reviews list
   - Status shows "pending review"
   - Content preview is visible

#### Test 2: Generate Explainer with Restricted Terms

To force a high risk score, generate an explainer about topics that might contain restricted terms:

1. **Navigate to Explainers page** (`/explainers`)
2. **Generate an explainer** for a topic like:

   - "Investment Guarantees" (contains "guarantee")
   - "High-Risk Investment Strategies" (contains "high-risk")
   - "Cryptocurrency Trading" (contains "cryptocurrency")

3. **Check console logs** for risk score calculation
4. **Check Reviews page** - the explainer should appear if risk score ≥ 50

#### Test 3: Generate Lesson with High-Risk Terms

1. **Navigate to Lessons page** (`/lessons`)
2. **Generate a lesson** about topics like:

   - "Derivatives Trading"
   - "Leverage and Margin"
   - "Options Strategies"

3. **Verify** the lesson appears in reviews if it requires review

### Scenario 2: Verify Review Creation in Database

You can verify reviews are being created by checking the database:

```sql
-- Check all pending reviews
SELECT
  cr.id,
  cr.content_type,
  cr.status,
  cr.created_at,
  b.title AS briefing_title,
  e.topic AS explainer_topic,
  l.topic AS lesson_topic
FROM content_reviews cr
LEFT JOIN briefings b ON cr.content_id = b.id AND cr.content_type = 'briefing'
LEFT JOIN explainers e ON cr.content_id = e.id AND cr.content_type = 'explainer'
LEFT JOIN lessons l ON cr.content_id = l.id AND cr.content_type = 'lesson'
WHERE cr.status = 'pending_review'
ORDER BY cr.created_at DESC;

-- Check content with risk scores
SELECT
  id,
  type,
  risk_score,
  requires_review,
  status
FROM briefings
WHERE requires_review = 1
ORDER BY generated_at DESC;

-- Check citations were created
SELECT
  c.id,
  c.content_type,
  c.confidence_score,
  cs.title AS source_title
FROM citations c
LEFT JOIN content_sources cs ON c.source_id = cs.id
ORDER BY c.id DESC
LIMIT 10;
```

### Scenario 3: Test Review Workflow (Advisor Actions)

1. **Log in as an advisor user** (user with `role = "advisor"`)

2. **Navigate to Reviews page** (`/reviews`)

3. **View a pending review**:

   - Click the eye icon or click on a review card
   - Verify content preview is displayed correctly
   - Check that citations are shown (if any)

4. **Test Approve Action**:

   - Click the green checkmark (✓) or "Approve" button
   - Verify the review status changes to "approved"
   - Check that the content status is updated to "approved"

5. **Test Reject Action**:

   - Generate new content that requires review
   - Click the red X or "Reject" button
   - Verify the review status changes to "rejected"
   - Check that the content status is updated to "draft"

6. **Test Request Changes Action**:
   - Generate new content that requires review
   - Click the yellow edit icon or "Request Changes" button
   - Add optional comments
   - Verify the review status changes to "changes requested"
   - Check that the content status is updated to "draft"

### Scenario 4: Verify Risk Score Calculation

Check the console logs when generating content. You should see:

```
[Briefings] Risk score calculated: {
  riskScore: 65,
  requiresReview: true,
  factors: {
    contentSensitivity: 30,
    citationConfidence: 25,
    userProfileRisk: 10,
    historicalPatterns: 5,
    restrictedTerms: 0,
    highRiskTerms: 15
  }
}
```

### Scenario 5: Verify Citations Are Extracted

1. Generate content that uses search results
2. Check the database for citations:
   ```sql
   SELECT * FROM citations
   WHERE content_id = '<your-content-id>'
   ORDER BY position;
   ```
3. Verify citations are stored in the content's `citations` JSON field

### Scenario 6: Verify Audit Logging

Check that content generation is being logged:

1. Generate content
2. Check Azure Blob Storage for audit logs (if configured)
3. Or check the console for log messages:
   ```
   [Briefings] Logged content generation event
   ```

## Troubleshooting

### No Reviews Appearing?

1. **Check risk scores**: Content must have risk score ≥ 50 to require review

   ```sql
   SELECT id, risk_score, requires_review FROM briefings ORDER BY generated_at DESC LIMIT 5;
   ```

2. **Check if reviews were created**:

   ```sql
   SELECT * FROM content_reviews WHERE status = 'pending_review';
   ```

3. **Check user role**: Only advisors can see all reviews. Regular users only see reviews for their own content.

4. **Check console logs**: Look for errors during content generation

### Reviews Not Updating?

1. **Check advisor role**: Only users with `role = "advisor"` can approve/reject
2. **Check API response**: Open browser DevTools → Network tab → Check API responses
3. **Check database**: Verify the review status is actually updating

### Risk Score Always Low?

The risk score calculation considers multiple factors. To increase it:

1. **Use restricted terms** in content (see `lib/compliance/guardrails.ts` for list)
2. **Use high-risk terms** (cryptocurrency, derivatives, leverage, etc.)
3. **Generate longer content** (word count > 2000 adds 5 points)
4. **Use superlatives** (best, worst, amazing, incredible - each adds 3 points)
5. **Include statistics** (multiple percentages without citations adds 10 points)

## Quick Test Script

Here's a quick way to test the full workflow:

1. **Generate a briefing**:

   ```bash
   # In browser console or via API
   fetch('/api/briefings', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ type: 'market' })
   })
   ```

2. **Check if review was created**:

   ```bash
   fetch('/api/reviews?status=pending_review')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **Approve the review** (as advisor):
   ```bash
   fetch('/api/reviews', {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       reviewId: '<review-id>',
       status: 'approved'
     })
   })
   ```

## Expected Behavior Summary

✅ **Content Generation**:

- Risk score is calculated
- Citations are extracted and stored
- `riskScore` and `requiresReview` flags are set on content
- If `requiresReview = true`, a `ContentReview` is created with status `"pending_review"`

✅ **Reviews Page**:

- Shows all pending reviews (for advisors)
- Shows user's own reviews (for regular users)
- Displays content preview
- Shows review status badges

✅ **Review Actions** (Advisor only):

- Approve → Sets review status to "approved", content status to "approved"
- Reject → Sets review status to "rejected", content status to "draft"
- Request Changes → Sets review status to "changes_requested", content status to "draft"

✅ **Audit Trail**:

- All content generation events are logged
- Review actions are logged (via review API)

## Next Steps

If everything works:

- Test with different content types
- Test with different risk thresholds
- Test with multiple users and advisors
- Verify citations are being used correctly
- Check that audit logs are being stored properly
