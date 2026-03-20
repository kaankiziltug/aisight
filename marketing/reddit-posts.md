# Reddit Posts — AISight Launch (Topluluk Kurallarına Uygun)

---

## Post 1: r/dataisbeautiful

**Kurallar:** [OC] tag zorunlu, görsel/chart ŞART, kaynak+araç ilk yorumda, başlık sade olmalı

**Format:** Image post (leaderboard veya bar chart ekran görüntüsü)

**Title:**
[OC] AI Capital Expenditure by Company, 2025 — 38 companies, $473B total

**İlk yorum (post attıktan hemen sonra yaz):**

Sources: SEC EDGAR 10-K filings, company earnings calls, Financial Modeling Prep API

Tools: vanilla JS, ApexCharts, Vercel, GitHub Actions for daily automation

top 5 alone account for 77% of total spend. oracle had the wildest growth — went from $6B to $18B in a year (+194%).

interactive version with all 38 companies and historical data: aisight.fyi

---

## Post 2: r/technology

**Kurallar:** %10 self-promo limiti, sansasyonel başlık yasak, veri odaklı ol

**Title:**
AI infrastructure spending hit $473B in 2025 — here's where the money is going

**Body:**

been digging into SEC filings and earnings calls to figure out who's actually spending what on AI infrastructure. not revenue or market cap — actual capex on data centers, GPUs, custom chips.

the big picture:

- Amazon: $100B (mostly AWS + Trainium chips)
- Alphabet: $85B (+74% from last year)
- Microsoft: $80B (+87%)
- Meta: $65B (+84%)

those four alone = $330B. everyone else is splitting the remaining $143B.

fastest growers were oracle (+194%), palantir (+132%), and nvidia (+88%).

one thing that stood out: china's total AI capex (~$36B across ByteDance, Tencent, Alibaba, Baidu) is less than what Meta spends by itself.

I've been tracking all of this with data from SEC filings — full breakdown at aisight.fyi if anyone wants to dig into the numbers.

---

## Post 3: r/stocks

**Kurallar:** Min 75 comment karma, "financial advice" olmamalı, disclaimer ekle

**Title:**
AI CapEx data from SEC filings: 38 companies, $473B total — compiled the numbers

**Body:**

I wanted a single place to see who's actually spending on AI vs just talking about it, so I pulled the data from 10-K filings and earnings calls.

some things that jumped out:

Amazon is spending $100B/yr on AI. that's 14% of their revenue going straight into infrastructure. Meta's even more aggressive — 32% of revenue.

growth rates are nuts. Oracle went from $6B to $18B (+194%). Microsoft +87%. these aren't small adjustments.

the concentration is wild too — top 5 (Amazon, Alphabet, Microsoft, Meta, TSMC) account for 77% of all AI capex. if the AI bet doesn't pay off, they're the most exposed.

nvidia's position is interesting — $5B in their own capex but $130B in revenue from selling to everyone else. different game entirely.

I put all the data in one place with comparisons and historical trends: aisight.fyi — you can also download the raw data as CSV if you want to run your own models.

methodology and sources: aisight.fyi/about

*not financial advice — just publicly available data from SEC filings.*

---

## Post 4: r/MachineLearning

**Kurallar:** [P] tag zorunlu, self-promo sadece haftalık thread'de güvenli, teknik ton şart

**Format:** Haftalık "Self-Promotion" thread'ine yorum olarak yaz

**Yorum:**

[P] AISight — tracking AI infrastructure CapEx from SEC filings

compiled capital expenditure data for 38 companies focused specifically on AI-related spend (GPUs, data centers, custom silicon, training compute).

total tracked: $473B for 2025, roughly 2x from 2024.

couple interesting patterns in the data:
- spend concentration: top 5 = 77% of total
- nvidia asymmetry: $5B own capex vs $130B revenue selling compute to others
- china gap: total china/asia AI capex (~$36B) < meta alone ($65B)

data pipeline: SEC EDGAR XBRL API → node scripts → JSON → GitHub Actions 3x/day → Vercel

aisight.fyi

---

## Post 5: r/SideProject

**Kurallar:** Live demo zorunlu, tech stack açıkla, 24 saat yorumlara cevap ver

**Title:**
I built an AI spending tracker — vanilla JS, no backend, $0/month

**Body:**

tracks how much 38 tech companies spend on AI infrastructure. data comes from SEC filings and earnings calls, auto-updates 3x daily.

**stack:**
- vanilla HTML/CSS/JS (no frameworks)
- ApexCharts for charts
- GitHub Actions cron → fetches data → commits JSON → Vercel auto-deploys
- data sources: SEC EDGAR XBRL API (free), Yahoo Finance (free), FMP API (freemium)

**what it does:**
- leaderboard with search/filter/sort
- individual company pages with charts
- compare up to 4 companies side-by-side
- trend charts
- CSV export

monthly cost: $0

biggest lesson: you really don't need a backend for data-heavy sites. JSON files + GitHub Actions does the job.

live: aisight.fyi

happy to answer anything about the setup.

---

## Post 6: r/webdev

**Kurallar:** 9:1 katılım kuralı (önce 9 yorum yap), 100+ karma, tech odaklı

**Title:**
Built a data dashboard with zero frameworks — vanilla JS + GitHub Actions as backend

**Body:**

wanted to share the approach behind a project — a dashboard tracking financial data for 38 companies, auto-updated 3x daily.

**why no framework:** site is read-heavy, minimal interactivity. vanilla JS + fetch() handles everything. zero KB framework overhead.

**"backend" is GitHub Actions:** cron runs 3x/day, node scripts fetch from SEC EDGAR API + Yahoo Finance, write JSON files, commit to repo. Vercel auto-deploys on push.

**clean URLs on static HTML:** Vercel rewrites turn `/company/amazon` into `company.html?ticker=AMZN`. just a vercel.json config, no SSR needed.

**charts:** went with ApexCharts over D3. for financial data (bar, line, treemap, radar) it's way less code for the same result. responsive out of the box.

monthly cost: $0

site if curious: aisight.fyi

what would you have done differently?

---

## Posting Stratejisi

### ÖN HAZIRLIK (1-2 hafta ÖNCE):
1. Her subreddit'te 3-5 yorum yap (özellikle r/webdev ve r/stocks)
2. Karma'yı 200+ seviyesine çıkar
3. r/dataisbeautiful için chart ekran görüntüsü hazırla

### Lansman:

| Gün | Subreddit | Format | Saat (EST) |
|-----|-----------|--------|------------|
| Salı | r/dataisbeautiful | Image + [OC] | 10:00 |
| Çarşamba | r/SideProject | Text | 10:00 |
| Perşembe | r/stocks | Text | 08:00 |
| Cuma | r/technology | Text | 09:00 |
| 2. hafta Pzt | r/webdev | Text | 10:00 |
| Herhangi gün | r/MachineLearning | Self-promo thread yorumu | — |

### Her post sonrası:
- İlk 2 saat tüm yorumlara cevap ver
- Eleştirilere: "good point, I'll look into that"
- Veri sorusu: SEC EDGAR'ı açıkla, /about'a yönlendir
- "AI generated?" → "data is from SEC filings, I used AI for some of the boilerplate code"
- Asla savunmacı olma
