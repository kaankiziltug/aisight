# Hacker News — AISight Launch

---

## Option A: Show HN (Recommended — higher engagement)

**Title:**
Show HN: AISight – Track $473B in AI spending across 38 companies (free, updated 3x daily)

**Comment (post immediately after submitting):**

Hey HN,

I built AISight (https://aisight.fyi) to track AI capital expenditure — the actual money companies spend on GPUs, data centers, custom chips, and AI infrastructure.

**Why I built this:**
I kept seeing headlines like "Amazon to spend $100B on AI" and "Meta doubles AI budget" but couldn't find a single place that compared all these numbers side by side, with sources. So I built one.

**What it tracks:**
- 38 companies ranked by AI-specific CapEx
- Total CapEx, R&D, Revenue, Market Cap, Employees for each
- Historical trends (2022-2025)
- YoY growth rates
- Latest AI spending news from SEC filings + major outlets

**Interesting findings from the data:**
- Top 5 companies (Amazon, Alphabet, Microsoft, Meta, TSMC) control 77% of all AI spending
- Oracle's AI CapEx grew 194% YoY — the fastest of any company
- China's total AI CapEx (~$36B) is less than what Meta alone spends ($65B)
- Nvidia spends just $5B on its own AI CapEx but generates $130B in revenue from selling AI hardware

**Tech details (since this is HN):**
- Pure static site: HTML/CSS/JS, no framework
- Data from SEC EDGAR XBRL API (free, authoritative)
- Market cap from Financial Modeling Prep + Yahoo Finance fallback
- News from Google News RSS + SEC EDGAR 8-K filings
- GitHub Actions cron runs 3x/day → auto-commits data → Vercel deploys
- Total infrastructure cost: $0/month

**Data methodology:**
Where companies disclose AI-specific CapEx (like Meta's earnings call), I use their numbers. Where they don't (like Amazon saying "vast majority of $131.8B capex is AI/AWS"), I estimate based on management guidance and analyst reports. All estimates are clearly marked. Full methodology: https://aisight.fyi/about

**Features:**
- Compare up to 4 companies side-by-side: https://aisight.fyi/compare
- Industry trends and charts: https://aisight.fyi/trends
- CSV export for your own analysis
- Clean URLs, mobile responsive

I'd love feedback, especially on data accuracy. If you notice any numbers that are off, the /about page explains how to report corrections.

---

## Option B: Regular post (if Show HN doesn't fit)

**Title:**
The AI Arms Race in Numbers: 38 companies spending $473B on AI infrastructure

**Comment:**

I've been compiling data on AI capital expenditure from SEC filings and earnings calls. Some observations:

1. The spending is absurdly concentrated: 5 companies account for 77% of the $473B total.

2. The growth rates are accelerating: Microsoft +87% YoY, Meta +84%, Oracle +194%.

3. There's a massive gap between US and China AI spending. China's total (~$36B across ByteDance, Samsung, Tencent, Alibaba, Baidu) is less than Meta alone ($65B).

4. The "picks and shovels" asymmetry is extreme: TSMC spends $35B making everyone's chips. Nvidia spends $5B on capex but makes $130B selling GPUs. The margins are completely different from the hyperscalers who are spending 14-32% of revenue on AI infrastructure.

I put all of this into an interactive tracker if anyone wants to explore: https://aisight.fyi

---

## Option C: As a comment/reply (use when relevant HN discussions come up)

**Template for replying to AI spending discussions:**

"I track this data at aisight.fyi — [specific data point relevant to the discussion]. The numbers come from SEC 10-K filings and earnings calls. [Add specific insight]"

**Examples:**

When someone discusses Amazon's spending:
> Amazon's AI CapEx is ~$100B this year, which is 76% of their total $131.8B capex. That's $274M per day on AI infrastructure. I track all 38 major AI spenders at aisight.fyi if anyone wants to compare.

When someone discusses the AI bubble:
> The top 5 AI spenders (Amazon, Alphabet, Microsoft, Meta, TSMC) are committing $365B this year — 77% of all tracked AI spending. Oracle grew 194% YoY. Whether this is a bubble or not, the capital commitment is unprecedented. Full data: aisight.fyi/trends

When someone discusses China vs US AI:
> The gap is striking when you look at CapEx data. China/Asia total: ~$36B. Meta alone: $65B. Even ByteDance at $21B (the largest Chinese AI spender) is less than a quarter of Amazon's $100B. I track this at aisight.fyi — you can compare any companies side-by-side.

---

## HN Posting Strategy:

**Timing:**
- Best days: Tuesday, Wednesday, Thursday
- Best time: 8-10 AM EST (when US + EU are both online)
- Avoid: Weekends, Mondays, Fridays (lower engagement)

**Do's:**
- Post the Show HN, then immediately add your detailed comment
- Respond to EVERY comment in the first 2 hours (critical for ranking)
- Be technical — HN values implementation details
- Acknowledge limitations ("estimates are clearly marked")
- Be humble — "I'd love feedback on accuracy"

**Don'ts:**
- Don't use marketing language ("revolutionary", "game-changing")
- Don't ask for upvotes
- Don't post the same link twice within 30 days
- Don't get defensive about data criticism — update and thank them

**If it gains traction:**
- Expect 200-500 comments about methodology, specific companies, data accuracy
- Have the /about page ready for methodology questions
- Be ready to update data in real-time if someone finds an error
- This is your #1 credibility builder — treat every comment as an opportunity

**Follow-up posts (future weeks):**
- "AISight Update: Q1 2026 earnings data added" (when new data comes in)
- A standalone blog post analyzing a specific trend, link on HN as regular post
