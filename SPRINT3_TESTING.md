# Sprint 3 Testing Guide

This guide provides step-by-step instructions for testing all Sprint 3 functionality.

## Prerequisites

1. ✅ Database migration applied (`npx prisma db push`)
2. ✅ Environment variable `ALPHA_MAVEN_API_KEY` set
3. ✅ Azure AI Search configured and accessible
4. ✅ Development server running

---

## Test 1: Database Migration Verification

### Steps

1. **Check tables exist:**

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('market_data', 'content_ingestion', 'source_metadata', 'house_views')
```

2. **Verify schema:**

```bash
npx prisma studio
```

**Expected Result:** All four tables visible in Prisma Studio with correct columns.

---

## Test 2: Market Data Ingestion

### Manual Test via API

Create a test file `test-market-data.ts`:

```typescript
import { ingestMarketData, getMarketData } from "./lib/ingestion/market-data";

async function test() {
  try {
    console.log("Testing market data ingestion...");
    const result = await ingestMarketData();
    console.log("✅ Ingestion result:", result);

    const data = await getMarketData({ limit: 5 });
    console.log("✅ Retrieved data:", data.length, "items");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

test();
```

**Run:**

```bash
npx ts-node test-market-data.ts
```

**Expected:** Market data fetched from Alpha Maven and stored in database.

### Via Sources UI

1. Navigate to `/sources`
2. Click "Add Ingestion"
3. Select "Market Data"
4. Configure and save
5. Verify ingestion runs (check `content_ingestion` table)

---

## Test 3: RSS Feed Ingestion

### Via Sources UI

1. Navigate to `/sources`
2. Click "Add Source"
3. Enter RSS feed URL (e.g., `https://feeds.finance.yahoo.com/rss/2.0/headline`)
4. Fill in title and tags
5. Submit
6. Verify source appears in list
7. Check `content_sources` table for ingested items

**Expected:** RSS feed items parsed and stored as `ContentSource` records.

### Verify Indexing

After ingestion, verify items are indexed:

- Check Azure AI Search index for new documents
- Search should return ingested content

---

## Test 4: House Views Integration

### Create House View

**Via Database:**

```sql
INSERT INTO house_views (id, tenant_id, title, content, version, is_active, created_at, updated_at)
VALUES (
  NEWID(),
  'your-tenant-id-here',
  'Our Investment Philosophy',
  'We believe in long-term value investing with a focus on quality companies that demonstrate sustainable competitive advantages. Our approach emphasizes diversification across asset classes and geographic regions.',
  1,
  1,
  GETDATE(),
  GETDATE()
);
```

**Or via API (if endpoint exists):**

```bash
POST /api/house-views
{
  "title": "Our Investment Philosophy",
  "content": "We believe in long-term value investing..."
}
```

### Test in Briefing Generation

1. Generate a market briefing via UI or API
2. Check console logs for: `[Briefings] Found house view: ...`
3. Verify house view content appears in generated briefing

**Expected:** House view content is included in the briefing prompt and influences the generated content.

---

## Test 5: Market Data in Briefings

### Prerequisites

- Market data must be ingested (Test 2)
- At least one market data point in the past week

### Steps

1. Generate a market briefing:

```bash
POST /api/briefings
{
  "type": "market"
}
```

2. Check console logs for:

   - `[Briefings] Found X market data points`
   - Market data summary in logs

3. Verify generated briefing includes market data context

**Expected:** Briefing includes recent market data (prices, changes) in the context.

---

## Test 6: Content Sources in RAG Search

### Prerequisites

- RSS feed ingested (Test 3)
- Content sources indexed in Azure AI Search

### Steps

1. Generate an explainer or lesson on a topic related to ingested content
2. Check citations in the generated content
3. Verify citations reference ingested content sources

**Expected:** RAG search returns indexed content sources, and citations link to them.

---

## Test 7: Vector Indexing Pipeline

### Test Indexing Function

Create `test-indexing.ts`:

```typescript
import { indexContent } from "./lib/ingestion/indexing";

async function test() {
  try {
    await indexContent({
      id: "test-123",
      content:
        "The S&P 500 reached new highs this week, driven by strong earnings reports from technology companies.",
      title: "Market Update - Tech Earnings",
      type: "research",
      metadata: {
        date: new Date(),
        source: "test",
        tenantId: "your-tenant-id",
      },
    });
    console.log("✅ Indexing test passed");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

test();
```

**Expected:** Content is embedded and indexed in Azure AI Search.

---

## Test 8: Ingestion Scheduler Azure Function

### Local Testing

1. **Start Azure Functions:**

```bash
cd azure-functions/data-ingestion
func start
```

2. **Create test ingestion config:**

```sql
INSERT INTO content_ingestion (id, source_type, status, config, next_run, created_at, updated_at)
VALUES (
  NEWID(),
  'market_data',
  'active',
  '{"tenantId": "your-tenant-id", "schedule": "daily"}',
  GETDATE(), -- Run immediately
  GETDATE(),
  GETDATE()
);
```

3. **Verify function runs and processes ingestion**

**Expected:** Function triggers, processes ingestion config, updates `lastRun` and `nextRun`.

### Production Testing

1. Deploy function to Azure
2. Verify timer trigger is configured
3. Monitor Function App logs for scheduled runs

---

## Test 9: End-to-End Integration Test

### Complete Flow

1. **Setup:**

   - ✅ Market data ingested
   - ✅ RSS feed ingested and indexed
   - ✅ House view created
   - ✅ Content sources indexed

2. **Generate Briefing:**

   ```bash
   POST /api/briefings
   {
     "type": "market"
   }
   ```

3. **Verify:**

   - ✅ Console shows house view found
   - ✅ Console shows market data found
   - ✅ Briefing generated successfully
   - ✅ Citations reference ingested sources
   - ✅ Content quality reflects house view and market data

4. **Check Database:**

   ```sql
   -- Verify briefing created
   SELECT * FROM briefings ORDER BY generated_at DESC;

   -- Verify citations created
   SELECT * FROM citations WHERE content_id = 'briefing-id';

   -- Verify review created if risk score high
   SELECT * FROM content_reviews WHERE content_id = 'briefing-id';
   ```

---

## Troubleshooting

### Market Data Not Appearing

- **Check API key:** Verify `ALPHA_MAVEN_API_KEY` is set
- **Check database:** `SELECT COUNT(*) FROM market_data;`
- **Check date range:** Ensure market data is within past 7 days
- **Check logs:** Look for errors in console

### House View Not Appearing

- **Verify active:** `SELECT * FROM house_views WHERE is_active = 1 AND tenant_id = '...';`
- **Check tenant ID:** Ensure tenant ID matches
- **Check logs:** Look for `[Briefings] Found house view` message

### Content Sources Not in RAG

- **Verify indexed:** Check Azure AI Search index
- **Check tenant filter:** Ensure `tenantId` is included in search
- **Check metadata:** Verify `tenantId` is set in indexed documents

### Ingestion Scheduler Not Running

- **Check status:** `SELECT * FROM content_ingestion WHERE status = 'active';`
- **Check next_run:** Ensure `next_run <= GETDATE()`
- **Check function logs:** Review Azure Function logs for errors

---

## Success Criteria

All tests should pass:

- [ ] Database migration applied successfully
- [ ] Market data ingestion works
- [ ] RSS feed ingestion works
- [ ] House views appear in briefings
- [ ] Market data appears in briefings
- [ ] Content sources appear in RAG search results
- [ ] Vector indexing works
- [ ] Ingestion scheduler runs on schedule
- [ ] End-to-end content generation includes all Sprint 3 features

---

## Next Steps

Once all tests pass:

1. ✅ Mark Sprint 3 as fully integrated
2. ⏳ Begin Sprint 4: Analytics & Engagement Tracking
3. 📊 Monitor production ingestion
4. 🔍 Review content quality improvements
