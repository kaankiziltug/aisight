// ============================================
// Navigation & Newsletter
// ============================================

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
