// ============================================
// Main Leaderboard Application
// ============================================

(async function() {
  try {
  // Load data
  const data = await DataManager.loadCompanies();
  if (!data) {
    document.getElementById('leaderboard').innerHTML = '<p class="loading">Failed to load data</p>';
    return;
  }
  await DataManager.loadNews();

  // State
  let currentCategory = 'all';
  let currentSort = 'aiCapex';
  let currentSearch = '';
  let leaderboardExpanded = false;
  const INITIAL_SHOW = 10;

  // Render hero stats
  renderHeroStats();

  // Render stat cards
  renderStatCards();

  // Render leaderboard
  renderLeaderboard();

  // Render news ticker
  renderNewsTicker();

  // Render news box
  renderNewsBox();

  // Setup event listeners
  setupFilters();

  // ---- Hero Stats ----
  function renderHeroStats() {
    const totalSpend = DataManager.getTotalAISpend();
    const totalCompanies = DataManager.companies.length;
    const publicCompanies = DataManager.companies.filter(c => c.isPublic).length;

    document.getElementById('total-spend').textContent = `$${totalSpend.toFixed(0)}B+`;
    document.getElementById('total-companies').textContent = totalCompanies;
    document.getElementById('total-public').textContent = publicCompanies;

    // Animate counter
    animateCounter('total-spend', totalSpend, '$', 'B+');
  }

  function animateCounter(elementId, target, prefix = '', suffix = '') {
    const el = document.getElementById(elementId);
    const duration = 2000;
    const start = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(target * eased);
      el.textContent = `${prefix}${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ---- Stat Cards ----
  function renderStatCards() {
    const topSpender = DataManager.getTopSpender();
    const fastestGrower = DataManager.getFastestGrower();
    const totalSpend = DataManager.getTotalAISpend();
    const top3 = DataManager.sortBy('aiCapex').slice(0, 3);
    const top3Total = top3.reduce((s, c) => s + (c.aiCapex || 0), 0);
    const top3Pct = Math.round((top3Total / totalSpend) * 100);

    document.getElementById('stat-top-spender').innerHTML = `
      <div class="stat-value">${Format.billions(topSpender.aiCapex)}</div>
      <div class="stat-label">Largest AI Spender</div>
      <div class="stat-detail">${topSpender.name}</div>
    `;
    document.getElementById('stat-fastest').innerHTML = `
      <div class="stat-value">+${fastestGrower.yoyChange}%</div>
      <div class="stat-label">Fastest YoY Growth</div>
      <div class="stat-detail">${fastestGrower.name}</div>
    `;
    document.getElementById('stat-total').innerHTML = `
      <div class="stat-value">${Format.billions(totalSpend)}</div>
      <div class="stat-label">Total AI CapEx</div>
      <div class="stat-detail">${DataManager.companies.length} companies tracked</div>
    `;
    document.getElementById('stat-concentration').innerHTML = `
      <div class="stat-value">${top3Pct}%</div>
      <div class="stat-label">Top 3 Concentration</div>
      <div class="stat-detail">${top3.map(c => c.name).join(', ')}</div>
    `;
  }

  // ---- Leaderboard ----
  function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    const companies = DataManager.filterAndSort(currentCategory, currentSort, currentSearch);
    const maxValue = Math.max(...companies.map(c => c[currentSort] || 0));

    container.innerHTML = companies.map((company, index) => {
      const value = company[currentSort];
      const barWidth = value ? (value / maxValue * 100) : 0;
      const isTop3 = index < 3;
      const displayRank = index + 1;

      const yoyClass = company.yoyChange > 0 ? 'positive' : company.yoyChange < 0 ? 'negative' : 'neutral';
      const yoyText = company.yoyChange !== null ? Format.percent(company.yoyChange) : 'N/A';
      const yoyArrow = company.yoyChange > 0 ? '↑' : company.yoyChange < 0 ? '↓' : '—';

      const amountDisplay = currentSort === 'employees'
        ? Format.compact(value)
        : currentSort === 'yoyChange'
          ? Format.percent(value)
          : Format.billions(value);

      // Confidence indicator
      const confidenceField = currentSort === 'yoyChange' ? 'totalCapex' : currentSort;
      const confidence = company.confidence ? company.confidence[confidenceField] : 'verified';
      const isEstimated = confidence === 'estimated' || confidence === 'unverified';
      const confidencePrefix = isEstimated ? '~' : '';
      const confidenceClass = isEstimated ? 'estimated' : '';
      const confidenceTooltip = confidence === 'estimated' ? 'Analyst estimate'
        : confidence === 'unverified' ? 'Unverified' : '';

      const sortLabel = {
        aiCapex: 'AI CapEx',
        totalCapex: 'Total CapEx',
        rdSpend: 'R&D',
        marketCap: 'Market Cap',
        yoyChange: 'YoY Growth',
        employees: 'Employees',
      }[currentSort] || '';

      const isHidden = !leaderboardExpanded && index >= INITIAL_SHOW;
      return `
        <a href="${DataManager.getCompanyUrl(company)}"
           class="leaderboard-row${isHidden ? ' leaderboard-hidden' : ''}"
           data-index="${index}"
           style="transition-delay: ${Math.min(index, INITIAL_SHOW) * 40}ms">
          <div class="rank ${isTop3 ? 'top3' : ''}">${displayRank}</div>
          <div class="company-logo" style="background: ${company.color}15">
            <img src="https://logo.clearbit.com/${company.domain}"
                 alt="${company.name}"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <span class="fallback" style="display:none; color:${company.color}">${company.name[0]}</span>
          </div>
          <div class="company-info">
            <div class="company-header">
              <span class="company-name">${company.name}</span>
              <span class="company-ticker">${company.ticker !== 'PRIVATE' ? company.ticker : ''}</span>
              <span class="category-badge ${company.category}">${DataManager.getCategoryLabel(company.category)}</span>
              ${company.fundingRaised ? `<span class="funding-badge">$${company.fundingRaised}B raised</span>` : ''}
            </div>
            <div class="bar-container">
              <div class="bar-fill" data-width="${barWidth}"
                   style="background: linear-gradient(90deg, ${company.gradient[0]}, ${company.gradient[1]});">
              </div>
            </div>
          </div>
          <div class="amount-section">
            <div class="amount ${confidenceClass}" ${confidenceTooltip ? `title="${confidenceTooltip}"` : ''}>${confidencePrefix}${amountDisplay}</div>
            <div class="amount-label">${sortLabel}${isEstimated ? ' <span class="est-badge">est.</span>' : ''}</div>
          </div>
          <div class="yoy-badge ${yoyClass}">${yoyArrow} ${yoyText}</div>
        </a>
      `;
    }).join('');

    // Add "See More" button if there are hidden rows
    if (companies.length > INITIAL_SHOW) {
      const remaining = companies.length - INITIAL_SHOW;
      container.innerHTML += `
        <button class="leaderboard-see-more" id="leaderboard-toggle">
          <span id="leaderboard-toggle-text">${leaderboardExpanded ? 'Show Less' : `See More (${remaining} more)`}</span>
          <svg class="toggle-chevron ${leaderboardExpanded ? 'expanded' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      `;

      document.getElementById('leaderboard-toggle')?.addEventListener('click', () => {
        leaderboardExpanded = !leaderboardExpanded;
        if (typeof gtag === 'function') gtag('event', leaderboardExpanded ? 'see_more' : 'see_less');
        const hiddenRows = container.querySelectorAll('.leaderboard-row');
        hiddenRows.forEach((row, i) => {
          if (i >= INITIAL_SHOW) {
            row.classList.toggle('leaderboard-hidden', !leaderboardExpanded);
            if (leaderboardExpanded) {
              row.classList.add('visible');
              const bar = row.querySelector('.bar-fill');
              if (bar) setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, i * 30);
            }
          }
        });
        const btn = document.getElementById('leaderboard-toggle');
        const text = document.getElementById('leaderboard-toggle-text');
        const chevron = btn.querySelector('.toggle-chevron');
        text.textContent = leaderboardExpanded ? 'Show Less' : `See More (${remaining} more)`;
        chevron.classList.toggle('expanded', leaderboardExpanded);
      });
    }

    // Trigger animations
    requestAnimationFrame(() => {
      const rows = container.querySelectorAll('.leaderboard-row');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const bar = entry.target.querySelector('.bar-fill');
            if (bar) {
              setTimeout(() => {
                bar.style.width = bar.dataset.width + '%';
              }, 200);
            }
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      rows.forEach(row => observer.observe(row));
    });
  }

  // ---- News Ticker ----
  function renderNewsTicker() {
    const ticker = document.getElementById('news-scroll');
    if (!ticker) return;

    if (DataManager.news.length === 0) {
      // Show sample news when no live data
      const sampleNews = [
        { title: 'Amazon capex hits $131.8B in 2025, vast majority for AI/AWS', source: 'CNBC', date: '2026-02' },
        { title: 'Alphabet spends $91.4B on infrastructure, mostly AI/cloud', source: 'Reuters', date: '2026-02' },
        { title: 'Microsoft guided $80B for AI data centers in FY2025', source: 'CNBC', date: '2025-01' },
        { title: 'Meta AI capex soars 80% to $72.2B, primarily for GPU clusters', source: 'TechCrunch', date: '2026-01' },
        { title: 'Oracle capex triples to $21.2B driven by Stargate/OCI buildout', source: 'Fortune', date: '2025-12' },
        { title: 'Nvidia FY2026 revenue reaches $215.9B on Blackwell demand', source: 'CNBC', date: '2026-02' },
        { title: 'OpenAI raises $110B at $840B valuation, largest private round ever', source: 'TechCrunch', date: '2026-02' },
        { title: 'Anthropic hits $20B ARR pace, raises $30B Series G at $380B', source: 'Entrepreneur', date: '2026-02' },
      ];

      const newsHTML = sampleNews.map(n => `
        <div class="news-item">
          <span class="news-date">${n.date}</span>
          <span>${n.title}</span>
          <span style="color: var(--text-muted)">— ${n.source}</span>
        </div>
      `).join('');

      ticker.innerHTML = newsHTML + newsHTML; // duplicate for seamless loop
      return;
    }

    const newsHTML = DataManager.news.slice(0, 20).map(n => `
      <div class="news-item">
        <span class="news-date">${n.date || ''}</span>
        <a href="${n.url || '#'}" target="_blank" rel="noopener">${n.title}</a>
        <span style="color: var(--text-muted)">— ${n.source || ''}</span>
      </div>
    `).join('');

    ticker.innerHTML = newsHTML + newsHTML;
  }

  // ---- News Box ----
  function renderNewsBox() {
    const newsList = document.getElementById('news-list');
    const newsCount = document.getElementById('news-count');
    if (!newsList) return;

    const sampleNews = [
      { title: 'Amazon capex hits $131.8B in 2025, vast majority for AI/AWS', source: 'CNBC', date: '2026-02-06', url: '#', companies: ['Amazon'] },
      { title: 'Alphabet spends $91.4B on infrastructure, mostly AI/cloud', source: 'Reuters', date: '2026-02-04', url: '#', companies: ['Alphabet'] },
      { title: 'Microsoft guided $80B for AI data centers in FY2025', source: 'CNBC', date: '2025-01-29', url: '#', companies: ['Microsoft'] },
      { title: 'Meta AI capex soars 80% to $72.2B, primarily for GPU clusters', source: 'TechCrunch', date: '2026-01-29', url: '#', companies: ['Meta'] },
      { title: 'Oracle capex triples to $21.2B driven by Stargate/OCI buildout', source: 'Fortune', date: '2025-12-09', url: '#', companies: ['Oracle'] },
      { title: 'Nvidia FY2026 revenue reaches $130.5B on Blackwell demand', source: 'CNBC', date: '2026-02-26', url: '#', companies: ['Nvidia'] },
      { title: 'OpenAI raises $110B at $840B valuation, largest private round ever', source: 'TechCrunch', date: '2026-02-18', url: '#', companies: ['OpenAI'] },
      { title: 'Anthropic hits $20B ARR pace, raises $30B Series G at $380B', source: 'Entrepreneur', date: '2026-02-24', url: '#', companies: ['Anthropic'] },
    ];

    const allNews = DataManager.news.length > 0 ? DataManager.news : sampleNews;
    const news = allNews.slice(0, 10); // Only show top 10

    if (newsCount) {
      newsCount.textContent = `${allNews.length} articles`;
    }

    function formatNewsDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      const months = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    }

    function truncateSummary(summary, title) {
      if (!summary || summary === title || title.startsWith(summary.substring(0, 30))) return '';
      return summary.length > 120 ? summary.substring(0, 120) + '...' : summary;
    }

    newsList.innerHTML = news.map(n => `
      <a href="${n.url || '#'}" target="_blank" rel="noopener" class="news-item-card">
        <div class="news-meta">
          <span class="news-date">${formatNewsDate(n.date)}</span>
          <span class="news-source">${n.source || ''}</span>
        </div>
        <div class="news-content">
          <div class="news-title">${n.title}</div>
          ${truncateSummary(n.summary, n.title) ? `<div class="news-summary">${truncateSummary(n.summary, n.title)}</div>` : ''}
          ${n.companies && n.companies.length > 0 ? `<div class="news-companies">${n.companies.map(c => `<a href="/company/${DataManager.getSlugByName(c)}" class="company-pill">${c}</a>`).join('')}</div>` : ''}
        </div>
      </a>
    `).join('');
  }

  // ---- CSV Export ----
  function setupCSVExport() {
    const btn = document.getElementById('csv-export-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const companies = DataManager.filterAndSort(currentCategory, currentSort, currentSearch);
      const headers = ['Rank','Company','Ticker','Category','AI CapEx ($B)','Total CapEx ($B)','R&D Spend ($B)','Revenue ($B)','Market Cap ($B)','Employees','YoY Growth (%)','Source'];
      const rows = companies.map((c, i) => [
        i + 1,
        `"${c.name}"`,
        c.ticker,
        c.category,
        c.aiCapex ?? '',
        c.totalCapex ?? '',
        c.rdSpend ?? '',
        c.revenue ?? '',
        c.marketCap ? (c.marketCap / 1e9).toFixed(1) : '',
        c.employees ?? '',
        c.yoyChange ?? '',
        `"${(c.source || '').replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aisight-leaderboard-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      if (typeof gtag === 'function') gtag('event', 'csv_export', { category: currentCategory, sort: currentSort });
    });
  }
  setupCSVExport();

  // ---- Filters ----
  function setupFilters() {
    // Category buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        if (typeof gtag === 'function') gtag('event', 'filter', { category: currentCategory });
        renderLeaderboard();
      });
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (typeof gtag === 'function') gtag('event', 'sort', { field: currentSort });
        renderLeaderboard();
      });
    }

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentSearch = e.target.value;
          if (typeof gtag === 'function' && currentSearch.length > 2) gtag('event', 'search', { search_term: currentSearch });
          renderLeaderboard();
        }, 200);
      });
    }
  }
  } catch(e) { console.error('APP.JS ERROR:', e); document.getElementById('leaderboard').innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>'; }
})();
