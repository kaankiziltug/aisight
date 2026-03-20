// ============================================
// SEC EDGAR + FMP Capex Data Fetcher
// ============================================
// Run: node fetch-capex.js
// Recommended: Run quarterly after earnings season

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPANIES_FILE = join(__dirname, '..', 'data', 'companies.json');

const FMP_API_KEY = process.env.FMP_API_KEY;
const SEC_USER_AGENT = 'AISpendingTracker admin@example.com'; // SEC requires user-agent

// CIK numbers for SEC EDGAR (Central Index Key)
const TICKER_TO_CIK = {
  'AMZN': '0001018724',
  'MSFT': '0000789019',
  'GOOGL': '0001652044',
  'META': '0001326801',
  'AAPL': '0000320193',
  'TSLA': '0001318605',
  'ORCL': '0001341439',
  'NVDA': '0001045810',
  'AMD': '0000002488',
  'INTC': '0000050863',
  'CRM': '0001108524',
  'AVGO': '0001649338',
  'NOW': '0001373715',
  'ADBE': '0000796343',
  'IBM': '0000051143',
  'PLTR': '0001321655',
  'SNOW': '0001640147',
  'CSCO': '0000858877',
  'QCOM': '0000804328',
  'UBER': '0001543151',
  'ACN': '0001281761',
  'SAP': '0001000184',
  'DELL': '0001571996',
  'HPE': '0001645590',
  'SHOP': '0001594805',
  'SPOT': '0001639920',
  'BKNG': '0001075531',
  'INFY': '0001067491',
};

// Fetch company financials from SEC EDGAR
async function fetchSECData(ticker) {
  const cik = TICKER_TO_CIK[ticker];
  if (!cik) {
    console.warn(`  No CIK for ${ticker}, skipping SEC fetch`);
    return null;
  }

  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': SEC_USER_AGENT }
    });

    if (!response.ok) {
      console.error(`  SEC EDGAR error for ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const facts = data.facts?.['us-gaap'] || {};

    // Extract Capital Expenditures
    const capexFact = facts['PaymentsToAcquirePropertyPlantAndEquipment'] ||
                      facts['CapitalExpenditureDiscontinuedOperations'] ||
                      facts['PaymentsForCapitalImprovements'];

    // Extract R&D
    const rdFact = facts['ResearchAndDevelopmentExpense'] ||
                   facts['ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost'];

    // Extract Revenue
    const revFact = facts['RevenueFromContractWithCustomerExcludingAssessedTax'] ||
                    facts['Revenues'] ||
                    facts['SalesRevenueNet'];

    // Extract Employees
    const empFact = facts['EntityNumberOfEmployees'];

    return {
      capex: extractAnnualValues(capexFact, 'USD'),
      rdSpend: extractAnnualValues(rdFact, 'USD'),
      revenue: extractAnnualValues(revFact, 'USD'),
      employees: extractAnnualValues(empFact, 'pure'),
    };
  } catch (error) {
    console.error(`  SEC fetch failed for ${ticker}:`, error.message);
    return null;
  }
}

function extractAnnualValues(fact, unit) {
  if (!fact?.units?.[unit]) return {};

  const entries = fact.units[unit]
    .filter(e => e.form === '10-K' && !e.frame?.includes('Q'))
    .sort((a, b) => b.end.localeCompare(a.end)); // Most recent first

  const result = {};
  for (const entry of entries) {
    const year = parseInt(entry.end.substring(0, 4));
    if (!result[year] && year >= 2020) {
      // Convert from raw USD to billions
      result[year] = unit === 'pure' ? entry.val : entry.val / 1e9;
    }
  }
  return result;
}

// Get the most recent annual value (by date, not by magnitude)
function getLatestValue(values) {
  const years = Object.keys(values).map(Number).sort((a, b) => b - a);
  return years.length > 0 ? values[years[0]] : null;
}

// Fetch from Financial Modeling Prep (freemium)
async function fetchFMPData(ticker) {
  if (!FMP_API_KEY) {
    return null;
  }

  try {
    // Fetch key metrics
    const url = `https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?period=annual&limit=5&apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) return null;

    return {
      marketCap: data[0]?.marketCap ? data[0].marketCap / 1e9 : null,
      peRatio: data[0]?.peRatio || null,
    };
  } catch (error) {
    console.error(`  FMP fetch failed for ${ticker}:`, error.message);
    return null;
  }
}

// A6: Yahoo Finance — free market cap fallback (no API key needed)
async function fetchYahooMarketCap(ticker) {
  // Yahoo Finance v8 chart endpoint (public, free)
  const cleanTicker = ticker.replace('.KS', '.KS').replace('.HK', '.HK').replace('.DE', '.DE');
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}?range=1d&interval=1d`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice || meta.previousClose;
    // Yahoo doesn't directly give marketCap in chart endpoint, but we can use quote endpoint
    return { price };
  } catch (error) {
    return null;
  }
}

async function fetchYahooQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const price = data.quoteSummary?.result?.[0]?.price;
    if (!price) return null;
    const marketCap = price.marketCap?.raw;
    return marketCap ? Math.round(marketCap / 1e9) : null;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('Fetching financial data for AI Spending Leaderboard...\n');

  const companiesData = JSON.parse(readFileSync(COMPANIES_FILE, 'utf8'));
  let updatedCount = 0;

  for (const company of companiesData.companies) {
    if (!company.isPublic || company.ticker === 'PRIVATE') {
      console.log(`Skipping ${company.name} (private)`);
      continue;
    }

    console.log(`Fetching data for ${company.name} (${company.ticker})...`);

    // Fetch SEC data (US companies only)
    if (!company.ticker.includes('.')) {
      const secData = await fetchSECData(company.ticker);
      if (secData) {
        const latestCapex = getLatestValue(secData.capex);
        if (latestCapex && latestCapex > 0) {
          const rounded = Math.round(latestCapex * 10) / 10;
          console.log(`  Total CapEx (SEC): $${rounded}B [current: $${company.totalCapex}B]`);
        }
        const latestRD = getLatestValue(secData.rdSpend);
        if (latestRD && latestRD > 0) {
          console.log(`  R&D (SEC): $${Math.round(latestRD * 10) / 10}B [current: $${company.rdSpend}B]`);
        }
        const latestRev = getLatestValue(secData.revenue);
        if (latestRev && latestRev > 0) {
          console.log(`  Revenue (SEC): $${Math.round(latestRev * 10) / 10}B [current: $${company.revenue}B]`);
        }
        const latestEmp = getLatestValue(secData.employees);
        if (latestEmp && latestEmp > 0) {
          console.log(`  Employees (SEC): ${latestEmp.toLocaleString()} [current: ${company.employees?.toLocaleString()}]`);
        }
      }
    }

    // Fetch market cap: try FMP first, fallback to Yahoo Finance
    let marketCapUpdated = false;
    const fmpData = await fetchFMPData(company.ticker);
    if (fmpData?.marketCap) {
      const rounded = Math.round(fmpData.marketCap);
      console.log(`  Market Cap (FMP): $${rounded}B`);
      if (company.marketCap && Math.abs(rounded - company.marketCap) / company.marketCap > 0.05) {
        console.log(`  >> Updating marketCap: $${company.marketCap}B → $${rounded}B`);
        company.marketCap = rounded;
        updatedCount++;
        marketCapUpdated = true;
      }
    }

    // A6: Yahoo Finance fallback for market cap (free, no key)
    if (!marketCapUpdated) {
      const yahooMcap = await fetchYahooQuote(company.ticker);
      if (yahooMcap && yahooMcap > 0) {
        console.log(`  Market Cap (Yahoo): $${yahooMcap}B`);
        if (company.marketCap && Math.abs(yahooMcap - company.marketCap) / company.marketCap > 0.05) {
          console.log(`  >> Updating marketCap (Yahoo): $${company.marketCap}B → $${yahooMcap}B`);
          company.marketCap = yahooMcap;
          updatedCount++;
        } else if (!company.marketCap) {
          company.marketCap = yahooMcap;
          updatedCount++;
        }
      }
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  // Auto-calculate yoyChange from historical data ONLY if not already set manually
  // Manual yoyChange values from earnings calls are more accurate than historical array calculations
  console.log('\nChecking YoY changes...');
  for (const company of companiesData.companies) {
    if (company.yoyChange !== null && company.yoyChange !== undefined) continue; // Keep manual values
    if (!company.historical?.aiCapex || company.historical.aiCapex.length < 2) continue;
    const aiCapexArr = company.historical.aiCapex;
    const current = aiCapexArr[aiCapexArr.length - 1];
    const previous = aiCapexArr[aiCapexArr.length - 2];
    if (current !== null && previous !== null && previous > 0) {
      const calculated = Math.round((current - previous) / previous * 100);
      console.log(`  ${company.name}: yoyChange auto-calculated as ${calculated}%`);
      company.yoyChange = calculated;
    }
  }

  // Cross-validate: compare FMP market cap vs Yahoo Finance
  console.log('\nCross-validating market caps (FMP vs Yahoo)...');
  let crossValidated = 0;
  for (const company of companiesData.companies) {
    if (!company.isPublic || company.ticker === 'PRIVATE') continue;
    if (!FMP_API_KEY) break;

    const fmpData = await fetchFMPData(company.ticker);
    const yahooMcap = await fetchYahooQuote(company.ticker);

    if (fmpData?.marketCap && yahooMcap && yahooMcap > 0) {
      const fmpVal = Math.round(fmpData.marketCap);
      const diff = Math.abs(fmpVal - yahooMcap) / Math.max(fmpVal, yahooMcap);
      if (diff > 0.15) {
        console.log(`  ⚠ ${company.name}: FMP=$${fmpVal}B vs Yahoo=$${yahooMcap}B (${(diff * 100).toFixed(0)}% diff)`);
        // Use the more conservative (lower) value when there's large discrepancy
        company.marketCap = Math.min(fmpVal, yahooMcap);
        // Mark as estimated when sources disagree
        if (company.confidence) company.confidence.marketCap = 'estimated';
      } else {
        // Sources agree — use FMP as primary, mark as verified
        company.marketCap = fmpVal;
        if (company.confidence) company.confidence.marketCap = 'verified';
      }
      crossValidated++;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`  Cross-validated ${crossValidated} companies`);

  // Auto-assign confidence levels based on data availability
  console.log('\nAuto-assigning confidence levels...');
  for (const company of companiesData.companies) {
    if (!company.confidence) company.confidence = {};

    // If we have SEC EDGAR data, mark totalCapex/revenue/rdSpend/employees as verified
    const cik = TICKER_TO_CIK[company.ticker];
    if (cik) {
      if (company.totalCapex) company.confidence.totalCapex = company.confidence.totalCapex || 'verified';
      if (company.revenue) company.confidence.revenue = company.confidence.revenue || 'verified';
      if (company.rdSpend) company.confidence.rdSpend = company.confidence.rdSpend || 'verified';
      if (company.employees) company.confidence.employees = company.confidence.employees || 'verified';
    }

    // AI CapEx is always estimated unless manually marked as verified
    if (company.aiCapex && !company.confidence.aiCapex) {
      company.confidence.aiCapex = 'estimated';
    }
  }

  // Calculate derived metrics for each company
  console.log('\nCalculating derived metrics...');
  for (const company of companiesData.companies) {
    const metrics = {};
    if (company.aiCapex && company.totalCapex) {
      metrics.aiCapexPctOfTotal = Math.round(company.aiCapex / company.totalCapex * 1000) / 10;
    }
    if (company.aiCapex && company.revenue) {
      metrics.capexToRevenue = Math.round(company.aiCapex / company.revenue * 1000) / 10;
    }
    if (company.aiCapex && company.marketCap) {
      metrics.capitalIntensity = Math.round(company.aiCapex / company.marketCap * 1000) / 10;
    }
    if (company.revenue && company.employees) {
      metrics.revenuePerEmployee = Math.round(company.revenue / company.employees * 1e6 * 10) / 10; // $K per employee
    }
    if (Object.keys(metrics).length > 0) {
      company.calculatedMetrics = metrics;
    }
  }

  // Update metadata
  companiesData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

  // Save
  writeFileSync(COMPANIES_FILE, JSON.stringify(companiesData, null, 2));
  console.log(`\nDone! Updated ${updatedCount} companies.`);
  console.log(`Data saved to ${COMPANIES_FILE}`);
}

main().catch(console.error);
