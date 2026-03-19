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

// Company names to match in articles
const companiesData = JSON.parse(readFileSync(COMPANIES_FILE, 'utf8'));
const COMPANY_NAMES = companiesData.companies.map(c => c.name);

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
  const mentioned = [];
  const lowerText = text.toLowerCase();
  for (const name of COMPANY_NAMES) {
    if (lowerText.includes(name.toLowerCase())) {
      mentioned.push(name);
    }
  }
  return mentioned;
}

function extractSource(title) {
  // Google News titles often end with " - Source Name"
  const match = title?.match(/\s-\s([^-]+)$/);
  return match ? match[1].trim() : '';
}

function deduplicateNews(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title.toLowerCase().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log('Fetching AI spending news...');
  let allArticles = [];

  // Fetch from Google News RSS (free, no limits)
  for (const query of SEARCH_QUERIES) {
    console.log(`  Google News: "${query}"`);
    const articles = await fetchGoogleNews(query);
    allArticles.push(...articles);
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 1000));
  }

  // Fetch from NewsAPI (100 req/day free)
  for (const query of SEARCH_QUERIES.slice(0, 2)) {
    console.log(`  NewsAPI: "${query}"`);
    const articles = await fetchNewsAPI(query);
    allArticles.push(...articles);
    await new Promise(r => setTimeout(r, 500));
  }

  // Deduplicate
  allArticles = deduplicateNews(allArticles);

  // Sort by date (newest first)
  allArticles.sort((a, b) => b.date.localeCompare(a.date));

  // Keep only last 100 articles
  allArticles = allArticles.slice(0, 100);

  // Load existing news and merge
  let existingNews = [];
  try {
    existingNews = JSON.parse(readFileSync(NEWS_FILE, 'utf8'));
  } catch (e) {
    // File doesn't exist or is empty
  }

  // Merge: add new articles, keep total under 200
  const merged = deduplicateNews([...allArticles, ...existingNews]).slice(0, 200);

  // Save
  writeFileSync(NEWS_FILE, JSON.stringify(merged, null, 2));
  console.log(`Saved ${merged.length} news articles to ${NEWS_FILE}`);
  console.log(`  New articles: ${allArticles.length}`);
  console.log(`  Companies mentioned: ${[...new Set(allArticles.flatMap(a => a.companies))].join(', ')}`);
}

main().catch(console.error);
