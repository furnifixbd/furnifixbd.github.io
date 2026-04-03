/* ============================================================
   FURNI FIX — script.js
   Navbar scroll | Scroll reveal | WhatsApp form | Counter anim
   ============================================================ */

'use strict';

/* ── GOOGLE SHEETS URL ────────────────────────────────────── */
/*  STEP: Paste your Apps Script deployment URL here           */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyalUaNeUoy3SyxidO3qsvXYGo7GPJOrmEb8-UIJ0i6GTNsvc6is5yb6zizuA4p11Ri/exec';


/* ── HELPERS ─────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── YEAR ─────────────────────────────────────────────────── */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── PROGRESS BAR ─────────────────────────────────────────── */
const progressBar = $('#progress-bar');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = pct + '%';
}

/* ── NAVBAR SCROLL STATE ──────────────────────────────────── */
const navbar = $('#navbar');
function updateNavbar() {
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

/* ── SCROLL TO TOP ────────────────────────────────────────── */
const scrollTopBtn = $('#scroll-top');
function updateScrollTop() {
  if (!scrollTopBtn) return;
  if (window.scrollY > 400) {
    scrollTopBtn.classList.add('show');
  } else {
    scrollTopBtn.classList.remove('show');
  }
}
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── SCROLL EVENT (throttled) ─────────────────────────────── */
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateNavbar();
      updateScrollTop();
      updateProgress();
      revealOnScroll();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Run on load
updateNavbar();
updateScrollTop();
updateProgress();

/* ── MOBILE MENU ──────────────────────────────────────────── */
const hamburger = $('#hamburger');
const mobileMenu = $('#mobile-menu');
const mobileClose = $('#mobile-close');
const mobileLinks = $$('.mobile-link');

function openMobileMenu() {
  mobileMenu.classList.add('open');
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (hamburger) hamburger.addEventListener('click', openMobileMenu);
if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileMenu();
});

/* ── SMOOTH SCROLL ────────────────────────────────────────── */
$$('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const href = anchor.getAttribute('href');
    if (href === '#' || href === '#!') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navH = navbar ? navbar.offsetHeight : 80;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── SCROLL REVEAL ────────────────────────────────────────── */
const revealClasses = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale'];
const revealEls = $$(revealClasses.join(','));

function revealOnScroll() {
  const vh = window.innerHeight;
  revealEls.forEach((el, i) => {
    if (el.classList.contains('visible')) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < vh - 80) {
      // staggered delay via CSS custom property or data attribute
      const delay = parseFloat(el.style.getPropertyValue('--delay') || el.getAttribute('data-delay') || 0);
      setTimeout(() => el.classList.add('visible'), delay * 1000);
    }
  });
}

// Initial reveal (elements already in view on load)
window.addEventListener('load', () => {
  revealOnScroll();
});
// Also run on DOMContentLoaded in case images haven't loaded
revealOnScroll();

/* ── ANIMATED STAT COUNTERS ───────────────────────────────── */
const statNums = $$('.stat-num');
let countersStarted = false;

function animateCounter(el) {
  const raw = el.textContent.trim();
  const suffix = raw.replace(/[\d.]/g, '');
  const target = parseFloat(raw);
  if (isNaN(target)) return;

  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease out quad
    const ease = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(ease * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = raw; // ensure final value exact
  }
  requestAnimationFrame(step);
}

function tryStartCounters() {
  if (countersStarted) return;
  const aboutSection = $('#about');
  if (!aboutSection) return;
  const rect = aboutSection.getBoundingClientRect();
  if (rect.top < window.innerHeight - 100) {
    countersStarted = true;
    statNums.forEach(el => animateCounter(el));
  }
}

window.addEventListener('scroll', tryStartCounters, { passive: true });
window.addEventListener('load', tryStartCounters);

/* ── SERVICE CARD STAGGER ─────────────────────────────────── */
// Apply incremental animation delays to each service card
$$('.service-card').forEach((card, i) => {
  card.style.setProperty('--delay', (i * 0.1) + 's');
  card.style.transitionDelay = (i * 0.08) + 's';
});
$$('.why-card').forEach((card, i) => {
  card.style.setProperty('--delay', (i * 0.08) + 's');
});
$$('.test-card').forEach((card, i) => {
  card.style.setProperty('--delay', (i * 0.12) + 's');
});

/* ── CONTACT FORM + WHATSAPP ──────────────────────────────── */
const form = $('#contact-form');
const fields = {
  name: { el: $('#name'), error: $('#name-error'), validate: v => v.trim().length >= 2 },
  phone: { el: $('#phone'), error: $('#phone-error'), validate: v => v.trim().length >= 8 },
  furniture: { el: $('#furniture'), error: $('#furniture-error'), validate: v => v.trim().length >= 2 },
  problem: { el: $('#problem'), error: $('#problem-error'), validate: v => v.trim().length >= 10 }
};

function showError(field) {
  field.el.classList.add('error');
  field.error.classList.add('show');
}
function clearError(field) {
  field.el.classList.remove('error');
  field.error.classList.remove('show');
}

// Live validation on blur
Object.values(fields).forEach(field => {
  if (!field.el) return;
  field.el.addEventListener('blur', () => {
    if (!field.validate(field.el.value)) {
      showError(field);
    } else {
      clearError(field);
    }
  });
  field.el.addEventListener('input', () => {
    if (field.validate(field.el.value)) {
      clearError(field);
    }
  });
});


/* ── THANK YOU MODAL ──────────────────────────────────────── */
const tyModal  = $('#thankyou-modal');
const tyClose  = $('#ty-close');

function openThankyou() {
  if (!tyModal) return;
  tyModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  tyModal.focus();
}

function closeThankyou() {
  if (!tyModal) return;
  tyModal.classList.remove('open');
  document.body.style.overflow = '';
}

if (tyClose) tyClose.addEventListener('click', closeThankyou);

// Close when clicking the dark backdrop
if (tyModal) {
  tyModal.addEventListener('click', e => {
    if (e.target === tyModal) closeThankyou();
  });
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && tyModal && tyModal.classList.contains('open')) {
    closeThankyou();
  }
});

/* ── CONTACT FORM ─────────────────────────────────────────── */

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;
    Object.values(fields).forEach(field => {
      if (!field.el) return;
      if (!field.validate(field.el.value)) {
        showError(field);
        valid = false;
      } else {
        clearError(field);
      }
    });

    if (!valid) return;

    const name      = fields.name.el.value.trim();
    const phone     = fields.phone.el.value.trim();
    const furniture = fields.furniture.el.value.trim();
    const problem   = fields.problem.el.value.trim();

    // Build date & time
    const now  = new Date();
    const date = now.toLocaleDateString('en-GB');
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // ── Send to Google Sheet ──────────────────────────────
    if (SHEET_URL && SHEET_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
      const params = new URLSearchParams({ date, time, name, phone, furniture, message: problem });
      fetch(`${SHEET_URL}?${params.toString()}`, { mode: 'no-cors' }).catch(() => {});
    }

    // ── Show animated Thank You popup ─────────────────────
    form.reset();
    openThankyou();
  });
}

/* ── BEFORE / AFTER SLIDER ───────────────────────────────── */
(function () {
  const slider  = document.getElementById('ba-slider');
  const after   = document.getElementById('ba-after');
  const handle  = document.getElementById('ba-handle');
  if (!slider || !after || !handle) return;

  let dragging = false;

  function setPosition(clientX) {
    const rect = slider.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.min(Math.max(pct, 0.04), 0.96);
    const rightPct = (1 - pct) * 100;
    after.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
    handle.style.left = (pct * 100) + '%';
  }

  // Mouse
  slider.addEventListener('mousedown', e => {
    dragging = true;
    setPosition(e.clientX);
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    setPosition(e.clientX);
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  // Touch
  slider.addEventListener('touchstart', e => {
    dragging = true;
    setPosition(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    setPosition(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchend', () => { dragging = false; });

  // Auto-demo on load: animate from right to left to hint interactivity
  let demoPct = 0.5;
  let demoDir = -1;
  let demoFrames = 0;
  const maxFrames = 60;

  function demoAnimate() {
    if (demoFrames >= maxFrames) {
      setPosition(slider.getBoundingClientRect().left + slider.offsetWidth * 0.5);
      return;
    }
    demoFrames++;
    demoPct += demoDir * 0.008;
    if (demoPct <= 0.15) { demoDir = 1; }
    if (demoPct >= 0.85) { demoDir = -1; }
    const rightPct = (1 - demoPct) * 100;
    after.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
    handle.style.left = (demoPct * 100) + '%';
    requestAnimationFrame(demoAnimate);
  }

  // Start demo after 1.2s
  setTimeout(() => {
    if (!dragging) requestAnimationFrame(demoAnimate);
  }, 1200);
})();

/* ── FAQ ACCORDION ────────────────────────────────────────── */
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all others
      items.forEach(i => {
        i.classList.remove('open');
        const b = i.querySelector('.faq-question');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        // Smooth scroll so the answer is visible
        setTimeout(() => {
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  });
})();

/* ── HERO PARALLAX ────────────────────────────────────────── */
const heroBgImg = $('.hero-bg img');
if (heroBgImg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBgImg.style.transform = `translateY(${y * 0.25}px)`;
  }, { passive: true });
}
