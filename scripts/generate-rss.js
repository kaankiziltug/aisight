#!/usr/bin/env node
// Generate RSS feed from news.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NEWS_PATH = path.join(__dirname, '..', 'data', 'news.json');
const RSS_PATH = path.join(__dirname, '..', 'feed.xml');
const SITE_URL = 'https://aisight.fyi';

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function generateRSS() {
  let news = [];
  try {
    news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
  } catch (e) {
    console.log('No news.json found, generating empty feed');
  }

  const items = news.slice(0, 50).map(n => {
    const pubDate = n.date ? new Date(n.date + 'T12:00:00Z').toUTCString() : new Date().toUTCString();
    const companies = n.companies?.length ? ` [${n.companies.join(', ')}]` : '';
    return `    <item>
      <title>${escapeXml(n.title)}</title>
      <link>${escapeXml(n.url || SITE_URL + '/news')}</link>
      <description>${escapeXml((n.summary || n.title) + companies)}</description>
      <source url="${SITE_URL}">${escapeXml(n.source || 'AISight')}</source>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${escapeXml(n.url || n.title)}</guid>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AISight — AI Capital Expenditure Tracker</title>
    <link>${SITE_URL}</link>
    <description>Latest news and data on AI infrastructure spending across 38 companies. Updated 3x daily from SEC filings and earnings calls.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  fs.writeFileSync(RSS_PATH, rss);
  console.log(`RSS feed generated: ${news.slice(0, 50).length} items → feed.xml`);
}

generateRSS();
