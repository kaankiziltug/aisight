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

  // BreadcrumbList Schema
  const breadcrumbSchema = document.createElement('script');
  breadcrumbSchema.type = 'application/ld+json';
  breadcrumbSchema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://aisight.fyi/" },
      { "@type": "ListItem", "position": 2, "name": DataManager.getCategoryLabel(company.category), "item": `https://aisight.fyi/?category=${company.category}` },
      { "@type": "ListItem", "position": 3, "name": company.name, "item": cleanUrl }
    ]
  });
  document.head.appendChild(breadcrumbSchema);

  // Populate breadcrumb UI
  const bcCategory = document.getElementById('breadcrumb-category');
  const bcCompany = document.getElementById('breadcrumb-company');
  if (bcCategory) bcCategory.textContent = DataManager.getCategoryLabel(company.category);
  if (bcCompany) bcCompany.textContent = company.name;

  // Populate share buttons
  const shareBar = document.getElementById('share-bar');
  if (shareBar) {
    const shareText = `${company.name}'s AI spending: ${company.aiCapex ? '$' + company.aiCapex + 'B AI CapEx' : 'See details'} — via @AISight`;
    const shareUrl = cleanUrl;
    shareBar.innerHTML = `
      <span class="share-label">Share</span>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" class="share-btn twitter" title="Share on X/Twitter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" class="share-btn linkedin" title="Share on LinkedIn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
    `;
  }

  // GA4: track company page view
  if (typeof gtag === 'function') gtag('event', 'company_view', { company_name: company.name, ticker: company.ticker });

  // Render all sections
  renderHeader(company);
  renderStats(company);
  renderPeerComparison(company);
  renderCharts(company);
  renderNews(company);

  // ---- Peer Comparison ----
  function renderPeerComparison(c) {
    const container = document.getElementById('peer-comparison');
    if (!container) return;
    const peers = DataManager.getByCategory(c.category).filter(p => p.ticker !== c.ticker && p.aiCapex);
    if (peers.length === 0) { container.style.display = 'none'; return; }

    const metrics = [
      { key: 'aiCapex', label: 'AI CapEx', format: v => Format.billions(v) },
      { key: 'yoyChange', label: 'YoY Growth', format: v => Format.percent(v) },
      { key: 'capexToRevenue', label: 'CapEx/Revenue', format: v => v ? v.toFixed(1) + '%' : 'N/A', calc: true },
    ];

    const catAvg = (key, calc) => {
      const vals = peers.map(p => calc ? p.calculatedMetrics?.[key] : p[key]).filter(v => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    container.innerHTML = `
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px;">vs ${DataManager.getCategoryLabel(c.category)} Peers</h3>
      <div style="display:grid;grid-template-columns:repeat(${metrics.length},1fr);gap:12px;">
        ${metrics.map(m => {
          const val = m.calc ? c.calculatedMetrics?.[m.key] : c[m.key];
          const avg = catAvg(m.key, m.calc);
          const max = Math.max(val || 0, avg || 0);
          const valPct = max ? ((val || 0) / max * 100) : 0;
          const avgPct = max ? (avg / max * 100) : 0;
          return `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;">
              <div style="font-size:0.7rem;color:var(--muted-foreground);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">${m.label}</div>
              <div style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px;"><span>${c.name}</span><span style="font-weight:600;">${m.format(val)}</span></div>
                <div style="height:6px;background:var(--secondary);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${valPct}%;background:var(--primary);border-radius:3px;"></div></div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px;color:var(--muted-foreground);"><span>Category Avg</span><span>${m.format(avg)}</span></div>
                <div style="height:6px;background:var(--secondary);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${avgPct}%;background:var(--muted-foreground);border-radius:3px;opacity:0.5;"></div></div>
              </div>
            </div>`;
        }).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
        ${peers.slice(0, 6).map(p => `<a href="${DataManager.getCompanyUrl(p)}" style="font-size:0.75rem;padding:4px 10px;border-radius:100px;border:1px solid var(--border);color:var(--muted-foreground);text-decoration:none;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--violet-600)';this.style.color='var(--foreground)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted-foreground)'">${p.name}</a>`).join('')}
      </div>
    `;
  }

  // ---- Header ----
  function renderHeader(c) {
    const logoContainer = document.getElementById('detail-logo');
    logoContainer.innerHTML = `
      <img src="https://unavatar.io/${c.domain}?fallback=false"
           alt="${c.name}" loading="lazy" width="64" height="64"
           onerror="this.src='https://www.google.com/s2/favicons?domain=${c.domain}&sz=128'; this.onerror=function(){this.style.display='none'; this.nextElementSibling.style.display='flex';}">
      <span class="fallback" style="display:none">${c.name[0]}</span>
    `;

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

    // Add guidance info
    if (c.guidance) {
      const g = c.guidance;
      statsContainer.innerHTML += `
        <div class="detail-stat" style="border-color: rgba(124, 58, 237, 0.3);">
          <div class="value" style="color: var(--violet-400);">$${g.totalCapex.min}-${g.totalCapex.max}B</div>
          <div class="label">${g.year} CapEx Guidance</div>
        </div>
      `;
    }

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
