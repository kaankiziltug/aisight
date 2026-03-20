// ============================================
// Data Loading & Utility Functions
// ============================================

const DataManager = {
  companies: [],
  news: [],
  metadata: {},

  async loadCompanies() {
    try {
      const response = await fetch('/data/companies.json');
      const data = await response.json();
      this.companies = data.companies;
      this.metadata = data.metadata;
      return data;
    } catch (error) {
      console.error('Failed to load companies data:', error);
      return null;
    }
  },

  async loadNews() {
    try {
      const response = await fetch('/data/news.json');
      this.news = await response.json();
      return this.news;
    } catch (error) {
      console.warn('No news data available:', error);
      this.news = [];
      return [];
    }
  },

  getCompanyByTicker(ticker) {
    return this.companies.find(c => c.ticker === ticker);
  },

  getCompanyByName(name) {
    return this.companies.find(c => c.name.toLowerCase() === name.toLowerCase());
  },

  getByCategory(category) {
    if (category === 'all') return this.companies;
    return this.companies.filter(c => c.category === category);
  },

  sortBy(field, ascending = false) {
    const sorted = [...this.companies].filter(c => c[field] !== null && c[field] !== undefined);
    sorted.sort((a, b) => {
      const valA = a[field] ?? 0;
      const valB = b[field] ?? 0;
      return ascending ? valA - valB : valB - valA;
    });
    return sorted;
  },

  filterAndSort(category, sortField, searchQuery = '') {
    let filtered = category === 'all'
      ? [...this.companies]
      : this.companies.filter(c => c.category === category);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortField === 'capexToRevenue' || sortField === 'aiCapexPctOfTotal') {
        valA = a.calculatedMetrics?.[sortField] ?? -1;
        valB = b.calculatedMetrics?.[sortField] ?? -1;
      } else {
        valA = a[sortField] ?? -1;
        valB = b[sortField] ?? -1;
      }
      return valB - valA;
    });

    return filtered;
  },

  getTotalAISpend() {
    return this.companies.reduce((sum, c) => sum + (c.aiCapex || 0), 0);
  },

  getTopSpender() {
    return this.companies.reduce((max, c) =>
      (c.aiCapex || 0) > (max.aiCapex || 0) ? c : max
    );
  },

  getFastestGrower() {
    return this.companies
      .filter(c => c.yoyChange !== null)
      .reduce((max, c) => (c.yoyChange > max.yoyChange ? c : max));
  },

  getMaxAICapex() {
    return Math.max(...this.companies.map(c => c.aiCapex || 0));
  },

  // Slug mapping for clean URLs
  _slugMap: {
    'AMZN': 'amazon', 'GOOGL': 'alphabet', 'MSFT': 'microsoft', 'META': 'meta',
    'TSM': 'tsmc', '005930.KS': 'samsung', 'ORCL': 'oracle', 'INTC': 'intel',
    '0700.HK': 'tencent', 'BABA': 'alibaba', 'NVDA': 'nvidia', 'AAPL': 'apple',
    'TSLA': 'tesla', 'AVGO': 'broadcom', 'BIDU': 'baidu', 'IBM': 'ibm',
    'DELL': 'dell', 'QCOM': 'qualcomm', 'CSCO': 'cisco', 'HPE': 'hpe',
    'NOW': 'servicenow', 'AMD': 'amd', 'PLTR': 'palantir', 'SIE.DE': 'siemens',
    'CRM': 'salesforce', 'SAP': 'sap', 'ACN': 'accenture', 'UBER': 'uber',
    'ADBE': 'adobe', 'BKNG': 'booking', 'INFY': 'infosys', 'SPOT': 'spotify',
    'SNOW': 'snowflake', 'SHOP': 'shopify'
  },
  _privateSlugMap: {
    'ByteDance': 'bytedance', 'OpenAI': 'openai', 'Anthropic': 'anthropic', 'Databricks': 'databricks'
  },

  getCompanySlug(company) {
    if (company.ticker === 'PRIVATE') {
      return this._privateSlugMap[company.name] || company.name.toLowerCase().replace(/\s+/g, '-');
    }
    return this._slugMap[company.ticker] || company.ticker.toLowerCase();
  },

  getCompanyUrl(company) {
    return '/company/' + this.getCompanySlug(company);
  },

  getTickerByName(name) {
    const c = this.companies.find(c => c.name.toLowerCase() === name.toLowerCase());
    return c ? c.ticker : null;
  },

  getSlugByName(name) {
    const c = this.companies.find(c => c.name.toLowerCase() === name.toLowerCase());
    return c ? this.getCompanySlug(c) : name.toLowerCase().replace(/\s+/g, '-');
  },

  getNewsForCompany(companyName) {
    return this.news.filter(n =>
      n.title?.toLowerCase().includes(companyName.toLowerCase()) ||
      n.companies?.includes(companyName)
    );
  },

  getCategoryLabel(category) {
    const labels = {
      bigtech: 'Big Tech',
      chip: 'Chip & Hardware',
      cloud: 'Cloud / SaaS',
      china: 'China / Asia',
      ainative: 'AI-Native',
      other: 'Other'
    };
    return labels[category] || category;
  },

  getCategoryEmoji(category) {
    const emojis = {
      bigtech: '',
      chip: '',
      cloud: '',
      china: '',
      ainative: '',
      other: ''
    };
    return emojis[category] || '';
  }
};

// Formatting Utilities
const Format = {
  billions(value) {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`;
    if (value >= 1) return `$${value.toFixed(1)}B`;
    return `$${(value * 1000).toFixed(0)}M`;
  },

  compact(value) {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString();
  },

  percent(value) {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value}%`;
  },

  marketCap(value) {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}T`;
    return `$${value}B`;
  }
};
