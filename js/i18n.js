// ============================================
// Internationalization (TR/EN)
// ============================================

const I18n = {
  translations: {},
  currentLang: 'en',

  async init() {
    try {
      const res = await fetch('/data/translations.json');
      this.translations = await res.json();
    } catch {
      console.warn('Failed to load translations');
    }

    // Detect language
    const saved = localStorage.getItem('aisight_lang');
    if (saved && this.translations[saved]) {
      this.currentLang = saved;
    } else if (navigator.language?.startsWith('tr')) {
      this.currentLang = 'tr';
    }

    this.applyToPage();
    this.setupToggle();
  },

  t(key) {
    return this.translations[this.currentLang]?.[key]
      || this.translations['en']?.[key]
      || key;
  },

  setLang(lang) {
    this.currentLang = lang;
    localStorage.setItem('aisight_lang', lang);
    this.applyToPage();
  },

  applyToPage() {
    // Apply to all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else {
        el.textContent = text;
      }
    });

    // Update lang toggle button
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = this.currentLang === 'en' ? 'TR' : 'EN';
  },

  setupToggle() {
    const btn = document.getElementById('lang-toggle');
    if (!btn) return;
    btn.textContent = this.currentLang === 'en' ? 'TR' : 'EN';
    btn.addEventListener('click', () => {
      this.setLang(this.currentLang === 'en' ? 'tr' : 'en');
      // Reload page to re-render dynamic content
      window.location.reload();
    });
  }
};

// Auto-init
I18n.init();
