#!/usr/bin/env node
// Generate weekly changelog from companies.json changes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMPANIES_PATH = path.join(__dirname, '..', 'data', 'companies.json');
const WEEKLY_PATH = path.join(__dirname, '..', 'data', 'weekly.json');

function generateWeekly() {
  const data = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  // Load previous weekly if exists
  let prevWeekly = {};
  try {
    prevWeekly = JSON.parse(fs.readFileSync(WEEKLY_PATH, 'utf8'));
  } catch {}

  // Compare with stored snapshots
  const prevSnapshot = prevWeekly.snapshot || {};
  const changes = [];

  for (const company of data.companies) {
    const prev = prevSnapshot[company.ticker];
    if (!prev) {
      changes.push({ company: company.name, type: 'new', detail: 'New company added' });
      continue;
    }
    if (prev.marketCap && company.marketCap && Math.abs(company.marketCap - prev.marketCap) / prev.marketCap > 0.05) {
      const pct = ((company.marketCap - prev.marketCap) / prev.marketCap * 100).toFixed(1);
      changes.push({ company: company.name, type: 'marketcap', detail: `Market cap ${pct > 0 ? '+' : ''}${pct}% ($${prev.marketCap}B → $${company.marketCap}B)` });
    }
    if (prev.aiCapex !== company.aiCapex && company.aiCapex) {
      changes.push({ company: company.name, type: 'capex', detail: `AI CapEx updated: $${prev.aiCapex}B → $${company.aiCapex}B` });
    }
  }

  // Load news count
  let newsCount = 0;
  try {
    const news = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'news.json'), 'utf8'));
    newsCount = news.filter(n => {
      const d = new Date(n.date);
      return d >= weekStart;
    }).length;
  } catch {}

  // Create snapshot for next week
  const snapshot = {};
  for (const c of data.companies) {
    snapshot[c.ticker] = { marketCap: c.marketCap, aiCapex: c.aiCapex };
  }

  const weekly = {
    generated: now.toISOString(),
    weekOf: weekStart.toISOString().split('T')[0],
    summary: {
      totalChanges: changes.length,
      newsArticles: newsCount,
      companiesTracked: data.companies.length,
    },
    changes,
    snapshot,
  };

  fs.writeFileSync(WEEKLY_PATH, JSON.stringify(weekly, null, 2));
  console.log(`Weekly report generated: ${changes.length} changes, ${newsCount} news articles`);
}

generateWeekly();
