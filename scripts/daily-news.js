// ============================================
// Daily News Fetcher - Google News RSS + NewsAPI
// ============================================
// Run: node daily-news.js
// Cron: 0 8 * * * cd /path/to/scripts && node daily-news.js

import RSSParser from 'rss-parser';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_FILE = join(__dirname, '..', 'data', 'news.json');
const COMPANIES_FILE = join(__dirname, '..', 'data', 'companies.json');

const parser = new RSSParser();

// AI spending related search queries
const SEARCH_QUERIES = [
  'AI spending capex',
  'artificial intelligence investment billion',
  'tech company AI infrastructure',
  'AI data center spending',
  'AI capital expenditure',
];

// Company matching: names, tickers, aliases
const companiesData = JSON.parse(readFileSync(COMPANIES_FILE, 'utf8'));
const COMPANY_NAMES = companiesData.companies.map(c => c.name);

// Extended aliases for better matching (alias → company name)
const COMPANY_ALIASES = {
  'aws': 'Amazon', 'amazon web services': 'Amazon',
  'google': 'Alphabet', 'google cloud': 'Alphabet', 'deepmind': 'Alphabet', 'waymo': 'Alphabet',
  'facebook': 'Meta', 'instagram': 'Meta', 'whatsapp': 'Meta', 'llama': 'Meta',
  'azure': 'Microsoft', 'github copilot': 'Microsoft', 'openai partner': 'Microsoft',
  'iphone': 'Apple', 'apple intelligence': 'Apple',
  'geforce': 'Nvidia', 'cuda': 'Nvidia', 'blackwell': 'Nvidia', 'hopper': 'Nvidia',
  'taiwan semiconductor': 'TSMC',
  'samsung electronics': 'Samsung', 'samsung elec': 'Samsung',
  'tiktok': 'ByteDance',
  'alibaba cloud': 'Alibaba',
  'wechat': 'Tencent',
  'chatgpt': 'OpenAI', 'gpt-4': 'OpenAI', 'gpt-5': 'OpenAI', 'dall-e': 'OpenAI', 'sora': 'OpenAI',
  'claude': 'Anthropic',
  'x.ai': 'Tesla', 'grok': 'Tesla',
  'gemini': 'Alphabet', 'bard': 'Alphabet',
  'copilot': 'Microsoft',
};

// Ticker → company name mapping
const TICKER_TO_NAME = {};
companiesData.companies.forEach(c => {
  if (c.ticker !== 'PRIVATE') {
    TICKER_TO_NAME[c.ticker.toLowerCase()] = c.name;
  }
});

async function fetchGoogleNews(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      title: item.title || '',
      url: item.link || '',
      date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : '',
      source: item.creator || extractSource(item.title),
      companies: findMentionedCompanies(item.title + ' ' + (item.contentSnippet || '')),
      summary: (item.contentSnippet || item.content || item.summary || '').replace(/<[^>]+>/g, '').substring(0, 500),
    }));
  } catch (error) {
    console.error(`Failed to fetch Google News for "${query}":`, error.message);
    return [];
  }
}

async function fetchNewsAPI(query) {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    console.warn('NEWSAPI_KEY not set in .env, skipping NewsAPI fetch');
    return [];
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      console.error('NewsAPI error:', data.message);
      return [];
    }

    return (data.articles || []).map(article => ({
      title: article.title || '',
      url: article.url || '',
      date: article.publishedAt ? article.publishedAt.split('T')[0] : '',
      source: article.source?.name || '',
      companies: findMentionedCompanies(article.title + ' ' + (article.description || '')),
      summary: (article.description || '').substring(0, 500),
    }));
  } catch (error) {
    console.error(`Failed to fetch NewsAPI for "${query}":`, error.message);
    return [];
  }
}

function findMentionedCompanies(text) {
  const mentioned = new Set();
  const lowerText = text.toLowerCase();

  // 1. Match exact company names
  for (const name of COMPANY_NAMES) {
    if (lowerText.includes(name.toLowerCase())) {
      mentioned.add(name);
    }
  }

  // 2. Match aliases (AWS→Amazon, Google→Alphabet, etc.)
  for (const [alias, companyName] of Object.entries(COMPANY_ALIASES)) {
    if (lowerText.includes(alias)) {
      mentioned.add(companyName);
    }
  }

  // 3. Match ticker symbols (word boundary: "AMZN" but not "SAMSUNG")
  for (const [ticker, companyName] of Object.entries(TICKER_TO_NAME)) {
    const regex = new RegExp(`\\b${ticker.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(text)) {
      mentioned.add(companyName);
    }
  }

  return [...mentioned];
}

function extractSource(title) {
  // Google News titles often end with " - Source Name"
  const match = title?.match(/\s-\s([^-]+)$/);
  return match ? match[1].trim() : '';
}

// Simple similarity check: normalized words overlap
function titleSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  return intersection / Math.min(wordsA.size, wordsB.size);
}

function deduplicateNews(articles) {
  const unique = [];
  const seenUrls = new Set();

  for (const article of articles) {
    // 1. Exact URL dedup
    const urlKey = article.url?.replace(/^https?:\/\/(www\.)?/, '').split('?')[0];
    if (urlKey && seenUrls.has(urlKey)) continue;
    if (urlKey) seenUrls.add(urlKey);

    // 2. Similarity dedup — if 70%+ word overlap with existing, skip
    const isDuplicate = unique.some(existing =>
      existing.date === article.date && titleSimilarity(existing.title, article.title) > 0.7
    );
    if (isDuplicate) continue;

    unique.push(article);
  }

  return unique;
}

// ---- A4: SEC EDGAR Recent Filings (8-K = material events for tracked companies) ----
// CIK numbers for our tracked companies
const TRACKED_CIKS = {
  '0001018724': 'Amazon', '0001652044': 'Alphabet', '0000789019': 'Microsoft',
  '0001326801': 'Meta', '0000320193': 'Apple', '0001318605': 'Tesla',
  '0001341439': 'Oracle', '0001045810': 'Nvidia', '0000002488': 'AMD',
  '0000050863': 'Intel', '0001108524': 'Salesforce', '0001649338': 'Broadcom',
  '0001373715': 'ServiceNow', '0000796343': 'Adobe', '0000051143': 'IBM',
  '0001321655': 'Palantir', '0000858877': 'Cisco', '0000804328': 'Qualcomm',
  '0001543151': 'Uber', '0001281761': 'Accenture', '0001571996': 'Dell Technologies',
  '0001645590': 'HPE', '0001594805': 'Shopify', '0001639920': 'Spotify',
};

async function fetchSECNews() {
  const articles = [];
  const startDate = getDateDaysAgo(14);

  // Query EDGAR for recent 8-K filings from tracked companies
  for (const [cik, companyName] of Object.entries(TRACKED_CIKS)) {
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AISight admin@aisight.fyi', 'Accept': 'application/json' }
      });
      if (!response.ok) continue;
      const data = await response.json();
      const recent = data.filings?.recent;
      if (!recent) continue;

      // Find recent 8-K filings
      for (let i = 0; i < Math.min(recent.form?.length || 0, 20); i++) {
        if (recent.form[i] !== '8-K') continue;
        const filingDate = recent.filingDate?.[i];
        if (!filingDate || filingDate < startDate) continue;

        const accession = recent.accessionNumber?.[i]?.replace(/-/g, '');
        const desc = recent.primaryDocDescription?.[i] || '8-K Material Event';

        articles.push({
          title: `${companyName}: ${desc}`,
          url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=8-K&dateb=&owner=include&count=5`,
          date: filingDate,
          source: 'SEC EDGAR',
          companies: [companyName],
          summary: `Official SEC 8-K filing from ${companyName} on ${filingDate}. ${desc}`,
        });
      }
      await new Promise(r => setTimeout(r, 150)); // SEC rate limit: 10 req/sec
    } catch (error) {
      // Silently skip failures
    }
  }
  return articles;
}

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// ---- A5: News Relevance/Quality Score ----
const AI_KEYWORDS = ['ai ', 'artificial intelligence', 'machine learning', 'gpu', 'data center', 'capex',
  'capital expenditure', 'infrastructure', 'spending', 'investment', 'billion', 'million',
  'neural', 'training', 'inference', 'compute', 'chip', 'semiconductor', 'cloud'];
const MONEY_REGEX = /\$[\d,.]+\s*[BMTbmt](?:illion)?|\d+\s*(?:billion|million|trillion)/i;

function scoreArticle(article) {
  const text = (article.title + ' ' + (article.summary || '')).toLowerCase();
  let score = 0;

  // Keyword relevance (max 0.5)
  const keywordHits = AI_KEYWORDS.filter(kw => text.includes(kw)).length;
  score += Math.min(keywordHits / AI_KEYWORDS.length * 2, 0.5);

  // Has dollar amount (+0.2)
  if (MONEY_REGEX.test(text)) score += 0.2;

  // Mentions tracked company (+0.2)
  if (article.companies && article.companies.length > 0) score += 0.2;

  // Source quality bonus (+0.1)
  const premiumSources = ['sec edgar', 'reuters', 'bloomberg', 'cnbc', 'wall street journal', 'financial times', 'techcrunch'];
  if (premiumSources.some(s => (article.source || '').toLowerCase().includes(s))) score += 0.1;

  return Math.round(Math.min(score, 1.0) * 100) / 100;
}

async function main() {
  console.log('Fetching AI spending news...\n');
  let allArticles = [];

  // Fetch from Google News RSS (free, no limits)
  for (const query of SEARCH_QUERIES) {
    console.log(`  Google News: "${query}"`);
    const articles = await fetchGoogleNews(query);
    allArticles.push(...articles);
    await new Promise(r => setTimeout(r, 1000));
  }

  // Fetch from NewsAPI (100 req/day free)
  for (const query of SEARCH_QUERIES.slice(0, 2)) {
    console.log(`  NewsAPI: "${query}"`);
    const articles = await fetchNewsAPI(query);
    allArticles.push(...articles);
    await new Promise(r => setTimeout(r, 500));
  }

  // A4: Fetch from SEC EDGAR (free, no key needed)
  console.log('  SEC EDGAR: 8-K filings...');
  const secArticles = await fetchSECNews();
  console.log(`    Found ${secArticles.length} SEC filings`);
  allArticles.push(...secArticles);

  // Deduplicate
  allArticles = deduplicateNews(allArticles);

  // A5: Score each article
  allArticles.forEach(a => { a.relevanceScore = scoreArticle(a); });

  // Sort: high-relevance first within same date, then by date
  allArticles.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
  });

  // Filter out very low relevance articles (score < 0.15)
  const beforeFilter = allArticles.length;
  allArticles = allArticles.filter(a => (a.relevanceScore || 0) >= 0.15);
  console.log(`\n  Relevance filter: ${beforeFilter} → ${allArticles.length} articles (removed ${beforeFilter - allArticles.length} low-quality)`);

  // Keep only last 100 articles
  allArticles = allArticles.slice(0, 100);

  // Load existing news and merge
  let existingNews = [];
  try {
    existingNews = JSON.parse(readFileSync(NEWS_FILE, 'utf8'));
  } catch (e) {
    // File doesn't exist or is empty
  }

  // Merge: add new articles, keep total under 250
  const merged = deduplicateNews([...allArticles, ...existingNews]).slice(0, 250);

  // Save
  writeFileSync(NEWS_FILE, JSON.stringify(merged, null, 2));
  console.log(`\nSaved ${merged.length} news articles to ${NEWS_FILE}`);
  console.log(`  New articles: ${allArticles.length}`);
  console.log(`  Companies mentioned: ${[...new Set(allArticles.flatMap(a => a.companies))].join(', ')}`);

  // Stats
  const avgScore = (allArticles.reduce((sum, a) => sum + (a.relevanceScore || 0), 0) / allArticles.length).toFixed(2);
  const taggedPct = Math.round(allArticles.filter(a => a.companies?.length > 0).length / allArticles.length * 100);
  console.log(`  Avg relevance: ${avgScore} | Tagged: ${taggedPct}%`);
}

main().catch(console.error);
