// ============================================
// Company Detail Page Logic
// ============================================

(async function() {
  // Get company from URL — supports both clean URLs (/company/amazon) and legacy (?ticker=AMZN)
  const params = new URLSearchParams(window.location.search);
  const ticker = params.get('ticker');
  const nameParam = params.get('name');

  // Extract slug from clean URL path: /company/amazon → "amazon"
  const pathMatch = window.location.pathname.match(/^\/company\/([^/]+)$/);
  const slug = pathMatch ? pathMatch[1] : null;

  if (!ticker && !slug) {
    window.location.href = '/';
    return;
  }

  // Load data
  await DataManager.loadCompanies();
  await DataManager.loadNews();

  // Find company: try slug first, then ticker
  let company;
  if (slug) {
    // Reverse lookup: find company whose slug matches
    company = DataManager.companies.find(c => DataManager.getCompanySlug(c) === slug);
  } else if (ticker === 'PRIVATE' && nameParam) {
    company = DataManager.companies.find(c => c.name === nameParam);
  } else {
    company = DataManager.getCompanyByTicker(decodeURIComponent(ticker));
  }

  if (!company) {
    document.getElementById('detail-content').innerHTML =
      '<div class="loading">Company not found</div>';
    return;
  }

  // Set dynamic SEO meta tags
  document.title = `${company.name} AI CapEx & Spending Analysis 2026 | AISight`;

  const metaDesc = `${company.name} AI spending breakdown: ${company.aiCapex ? '$' + company.aiCapex + 'B AI CapEx' : ''}${company.totalCapex ? ', $' + company.totalCapex + 'B total CapEx' : ''}${company.revenue ? ', $' + company.revenue + 'B revenue' : ''}. Charts, trends, and latest news.`;
  let descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) { descMeta.content = metaDesc; } else { descMeta = document.createElement('meta'); descMeta.name = 'description'; descMeta.content = metaDesc; document.head.appendChild(descMeta); }

  const ogTitle = `${company.name} AI Spending Analysis 2026 | AISight`;
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', ogTitle);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', ogTitle);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', metaDesc);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', metaDesc);
  // Clean URL for SEO
  const companySlug = DataManager.getCompanySlug(company);
  const cleanUrl = `https://aisight.fyi/company/${companySlug}`;
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', cleanUrl);

  // Update canonical to clean URL
  let canonEl = document.querySelector('link[rel="canonical"]');
  if (canonEl) { canonEl.href = cleanUrl; } else { canonEl = document.createElement('link'); canonEl.rel = 'canonical'; canonEl.href = cleanUrl; document.head.appendChild(canonEl); }

  // Structured Data for company
  const companySchema = document.createElement('script');
  companySchema.type = 'application/ld+json';
  companySchema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": company.name,
    "tickerSymbol": company.ticker !== 'PRIVATE' ? company.ticker : undefined,
    "url": cleanUrl,
    "description": metaDesc
  });
  document.head.appendChild(companySchema);

  // Render all sections
  renderHeader(company);
  renderStats(company);
  renderCharts(company);
  renderNews(company);

  // ---- Header ----
  function renderHeader(c) {
    const logoContainer = document.getElementById('detail-logo');
    logoContainer.innerHTML = `
      <img src="https://logo.clearbit.com/${c.domain}"
           alt="${c.name}"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="fallback" style="display:none; color:${c.color}; font-size:2rem; font-weight:700;">${c.name[0]}</span>
    `;
    logoContainer.style.background = `${c.color}15`;

    document.getElementById('detail-name').textContent = c.name;
    document.getElementById('detail-ticker').textContent = c.ticker !== 'PRIVATE' ? c.ticker : 'Private';

    const badgeEl = document.getElementById('detail-category');
    badgeEl.textContent = DataManager.getCategoryLabel(c.category);
    badgeEl.className = `category-badge ${c.category}`;

    if (c.note) {
      document.getElementById('detail-note').textContent = c.note;
    }
  }

  // ---- Stats Row ----
  function renderStats(c) {
    const statsContainer = document.getElementById('detail-stats-grid');
    const stats = [
      { label: 'AI CapEx', value: c.aiCapex ? Format.billions(c.aiCapex) : 'N/A' },
      { label: 'Total CapEx', value: c.totalCapex ? Format.billions(c.totalCapex) : 'N/A' },
      { label: 'R&D Spend', value: c.rdSpend ? Format.billions(c.rdSpend) : 'N/A' },
      { label: 'Revenue', value: c.revenue ? Format.billions(c.revenue) : 'N/A' },
      { label: 'Market Cap', value: c.marketCap ? Format.marketCap(c.marketCap) : 'N/A' },
      { label: 'Employees', value: c.employees ? Format.compact(c.employees) : 'N/A' },
      { label: 'YoY Growth', value: c.yoyChange !== null ? Format.percent(c.yoyChange) : 'N/A' },
      { label: 'Source', value: c.source || 'N/A' },
    ];

    statsContainer.innerHTML = stats.map(s => `
      <div class="detail-stat">
        <div class="value">${s.value}</div>
        <div class="label">${s.label}</div>
      </div>
    `).join('');

    // Add funding badge for private companies
    if (c.fundingRaised) {
      statsContainer.innerHTML += `
        <div class="detail-stat" style="border-color: rgba(245, 158, 11, 0.3);">
          <div class="value" style="color: var(--accent-orange);">$${c.fundingRaised}B</div>
          <div class="label">Total Funding Raised</div>
        </div>
      `;
    }
  }

  // ---- Charts ----
  function renderCharts(c) {
    const hasHistorical = c.historical && c.historical.years;
    const hasCapex = c.aiCapex !== null;

    // Multi-axis chart
    if (hasHistorical) {
      Charts.createMultiAxisChart('chart-multiaxis', c);
    } else {
      document.getElementById('chart-multiaxis-card').style.display = 'none';
    }

    // Revenue vs AI chart
    if (hasHistorical && c.historical.aiCapex.some(v => v !== null)) {
      Charts.createRevenueVsAI('chart-revenue-ai', c);
    } else {
      document.getElementById('chart-revenue-ai-card').style.display = 'none';
    }

    // CapEx Donut
    if (hasCapex && c.totalCapex) {
      Charts.createCapexDonut('chart-capex-donut', c);
    } else {
      document.getElementById('chart-capex-donut-card').style.display = 'none';
    }

    // Sector Comparison
    if (hasCapex) {
      Charts.createSectorComparison('chart-sector', c, DataManager.companies);
    } else {
      document.getElementById('chart-sector-card').style.display = 'none';
    }
  }

  // ---- News ----
  function renderNews(c) {
    const newsList = document.getElementById('company-news');
    const companyNews = DataManager.getNewsForCompany(c.name);

    if (companyNews.length === 0) {
      // Show sample news based on company
      const sampleNews = [
        { title: `${c.name} increases AI infrastructure spending to ${Format.billions(c.aiCapex)}`, source: c.source, date: DataManager.metadata.lastUpdated },
        { title: `${c.name} AI strategy: ${c.note}`, source: 'Earnings Call', date: '2025' },
      ];

      if (c.yoyChange) {
        sampleNews.push({
          title: `${c.name} AI spending grows ${c.yoyChange}% year-over-year`,
          source: 'Analyst Report',
          date: '2025'
        });
      }

      newsList.innerHTML = sampleNews.map(n => `
        <li>
          <span class="news-source">${n.source}</span>
          <span class="news-title">${n.title}</span>
        </li>
      `).join('');
      return;
    }

    newsList.innerHTML = companyNews.map(n => {
      const hasSummary = n.summary && n.summary !== n.title && !n.title.startsWith((n.summary || '').substring(0, 30));
      return `
        <li>
          <span class="news-source">${n.source || ''}</span>
          <span class="news-title">
            ${n.url ? `<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>` : n.title}
          </span>
          ${hasSummary ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0; line-height: 1.4;">${n.summary}</p>` : ''}
        </li>
      `;
    }).join('');
  }
})();
