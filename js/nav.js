// ============================================
// Navigation & Newsletter & Theme
// ============================================

// Theme toggle (dark/light)
(function() {
  const saved = localStorage.getItem('aisight_theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else if (!saved && window.matchMedia('(prefers-color-scheme: light)').matches) {
    // respect system preference only if no saved pref
  }
})();

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('aisight_theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('aisight_theme', 'light');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  btn.innerHTML = isLight
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
}

// Mobile hamburger toggle
(function() {
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click (mobile)
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.top-nav')) navLinks.classList.remove('open');
  });

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
    updateThemeIcon();
  }
})();

// Newsletter form (Formspree-ready, fallback to localStorage)
(function() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const emailInput = document.getElementById('newsletter-email');
  const btn = document.getElementById('newsletter-btn');

  // Check if already subscribed
  if (localStorage.getItem('aisight_subscribed')) {
    form.innerHTML = '<p class="newsletter-success">You\'re subscribed! We\'ll keep you updated.</p>';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    btn.disabled = true;
    btn.textContent = 'Subscribing...';

    try {
      // Try Formspree (free tier: 50 submissions/month)
      // Replace YOUR_FORM_ID with actual Formspree form ID when ready
      const FORMSPREE_ID = window.AISIGHT_FORMSPREE_ID || null;

      if (FORMSPREE_ID) {
        const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email, _subject: 'New AISight subscriber' })
        });
        if (!response.ok) throw new Error('Formspree error');
      }

      // Store locally as backup / confirmation
      const subscribers = JSON.parse(localStorage.getItem('aisight_emails') || '[]');
      subscribers.push({ email, date: new Date().toISOString() });
      localStorage.setItem('aisight_emails', JSON.stringify(subscribers));
      localStorage.setItem('aisight_subscribed', '1');

      // Success UI
      form.innerHTML = '<p class="newsletter-success">You\'re in! We\'ll send you weekly AI spending insights.</p>';

      // GA4 event
      if (typeof gtag === 'function') gtag('event', 'newsletter_signup', { email_domain: email.split('@')[1] });

    } catch (error) {
      // Still save locally on error
      localStorage.setItem('aisight_subscribed', '1');
      form.innerHTML = '<p class="newsletter-success">Thanks for subscribing!</p>';
    }
  });
})();
