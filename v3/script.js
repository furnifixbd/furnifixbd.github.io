/* ============================================================
   FURNI FIX — script.js
   Navbar scroll | Scroll reveal | WhatsApp form | Counter anim
   Language Toggle (Bangla ↔ English) | BA Slideshow
   ============================================================ */

'use strict';

/* ── GOOGLE SHEETS URL ────────────────────────────────────── */
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
      tryStartCounters();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

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

if (hamburger) hamburger.addEventListener('click', () => {
  if (mobileMenu.classList.contains('open')) closeMobileMenu();
  else openMobileMenu();
});
if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
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
  revealEls.forEach(el => {
    if (el.classList.contains('visible')) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < vh - 80) {
      const delay = parseFloat(el.style.getPropertyValue('--delay') || el.getAttribute('data-delay') || 0);
      setTimeout(() => el.classList.add('visible'), delay * 1000);
    }
  });
}
window.addEventListener('load', revealOnScroll);
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
    const ease = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(ease * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = raw;
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
window.addEventListener('load', tryStartCounters);

/* ── SERVICE CARD STAGGER ─────────────────────────────────── */
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
  name:      { el: $('#name'),      error: $('#name-error'),      validate: v => v.trim().length >= 2 },
  phone:     { el: $('#phone'),     error: $('#phone-error'),     validate: v => v.trim().length >= 8 },
  furniture: { el: $('#furniture'), error: $('#furniture-error'), validate: v => v.trim().length >= 2 },
  problem:   { el: $('#problem'),   error: $('#problem-error'),   validate: v => v.trim().length >= 10 }
};

function showError(field) {
  field.el.classList.add('error');
  field.error.classList.add('show');
}
function clearError(field) {
  field.el.classList.remove('error');
  field.error.classList.remove('show');
}

Object.values(fields).forEach(field => {
  if (!field.el) return;
  field.el.addEventListener('blur', () => {
    if (!field.validate(field.el.value)) showError(field);
    else clearError(field);
  });
  field.el.addEventListener('input', () => {
    if (field.validate(field.el.value)) clearError(field);
  });
});

/* ── THANK YOU MODAL ──────────────────────────────────────── */
const tyModal = $('#thankyou-modal');
const tyClose = $('#ty-close');

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
if (tyModal) {
  tyModal.addEventListener('click', e => {
    if (e.target === tyModal) closeThankyou();
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && tyModal && tyModal.classList.contains('open')) closeThankyou();
});

/* ── CONTACT FORM SUBMIT ──────────────────────────────────── */
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    Object.values(fields).forEach(field => {
      if (!field.el) return;
      if (!field.validate(field.el.value)) { showError(field); valid = false; }
      else clearError(field);
    });
    if (!valid) return;

    const name      = fields.name.el.value.trim();
    const phone     = fields.phone.el.value.trim();
    const furniture = fields.furniture.el.value.trim();
    const problem   = fields.problem.el.value.trim();

    const now  = new Date();
    const date = now.toLocaleDateString('en-GB');
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (SHEET_URL && SHEET_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
      const params = new URLSearchParams({ date, time, name, phone, furniture, message: problem });
      fetch(`${SHEET_URL}?${params.toString()}`, { mode: 'no-cors' }).catch(() => {});
    }

    form.reset();
    openThankyou();
  });
}

/* ── BEFORE / AFTER SLIDESHOW ─────────────────────────────── */
(function () {
  const slideshow = document.querySelector('.ba-slideshow');
  if (!slideshow) return;

  const containers = slideshow.querySelectorAll('.ba-container');
  const dots       = slideshow.querySelectorAll('.ba-dot');
  if (!containers.length) return;

  let activeIdx = 0;
  let timers    = [];

  function clearTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
  }

  function activateDot(idx) {
    dots.forEach((d, i) => {
      d.classList.toggle('ba-dot-active', i === idx);
      d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
  }

  function startCycle() {
    clearTimers();
    const afterEl = containers[activeIdx].querySelector('.ba-after');
    if (afterEl) afterEl.classList.remove('ba-show');

    // Show "before" for 2.5 s, then fade in "after"
    timers.push(setTimeout(() => {
      if (afterEl) afterEl.classList.add('ba-show');

      // After the 1.4 s fade + 1.6 s hold → next slide
      timers.push(setTimeout(() => {
        goToSlide((activeIdx + 1) % containers.length);
      }, 3000));
    }, 2500));
  }

  function goToSlide(idx) {
    clearTimers();
    containers[activeIdx].classList.remove('ba-active');
    activeIdx = idx;
    const afterEl = containers[activeIdx].querySelector('.ba-after');
    if (afterEl) afterEl.classList.remove('ba-show');
    containers[activeIdx].classList.add('ba-active');
    activateDot(activeIdx);
    startCycle();
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (i !== activeIdx) goToSlide(i);
    });
  });

  // Boot
  activateDot(0);
  startCycle();
})();

/* ── FAQ ACCORDION ────────────────────────────────────────── */
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => {
        i.classList.remove('open');
        const b = i.querySelector('.faq-question');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
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

/* ══════════════════════════════════════════════════════════
   LANGUAGE TOGGLE — Bangla ↔ English
   Default: Bangla (bn)
   ══════════════════════════════════════════════════════════ */
(function () {

  /* ── Full translation dictionary ─────────────────────── */
  const t = {
    en: {
      navServices:       'Services',
      navAbout:          'About',
      navWhy:            'Why Us',
      navTest:           'Testimonials',
      navFaq:            'FAQ',
      ctaBtn:            'Get Free Quote',

      heroBadge:         'Expert Restoration Services',
      heroTitle:         'We Bring Your<br><span class="italic">Furniture</span><br>Back to Life.',
      heroDesc:          'Expert furniture repair &amp; restoration with years of experience. Quality craftsmanship, guaranteed satisfaction. Don\'t replace it, restore it.',
      heroBtnPrimary:    'Get Free Quote',
      heroBtnOutline:    'Our Services',
      heroProof:         'Trusted by 500+ clients',

      baLabelBefore:     'Before',
      baLabelAfter:      'After',

      svcLabel:          'Our Expertise',
      svcTitle:          'Master Craftsmanship',
      svcDesc:           'From minor scratches to complete antique restorations, our skilled artisans handle every piece with precision and care.',
      svc1Title:         'Upholstery Repair',
      svc1Desc:          'Premium fabric &amp; leather replacement, re-stuffing, and structural foam repair for chairs and sofas.',
      svc2Title:         'Wood Restoration',
      svc2Desc:          'Fixing scratches, dents, water rings, and gouges on all types of wooden furniture surfaces.',
      svc3Title:         'Custom Refinishing',
      svc3Desc:          'Stripping old finishes and applying modern or period-accurate stains, paints, and lacquers.',
      svc4Title:         'Structural Repairs',
      svc4Desc:          'Fixing wobbly chair legs, broken table frames, and reinforcing weak joints with authentic techniques.',
      svc5Title:         'Antique Restoration',
      svc5Desc:          'Careful preservation of historical pieces using period-correct materials and traditional methods.',
      svc6Title:         'Furniture Polishing',
      svc6Desc:          'Deep cleaning, oiling, and buffing to bring back the original luster of your cherished items.',

      expBadge:          'Years of Experience',
      aboutLabel:        'About Furni Fix',
      aboutTitle:        'Dedicated to Preserving Your Heritage',
      aboutP1:           'At Furni Fix, we don\'t just repair furniture; we restore memories. Founded with a passion for woodworking and a commitment to sustainability, our team of expert craftsmen treats every piece as if it were our own.',
      aboutP2:           'Whether it\'s a priceless family heirloom or your favourite comfortable reading chair, we have the skills, tools, and dedication to breathe new life into your beloved items.',
      stat1:             'Happy Clients',
      stat2:             'Items Restored',
      stat3:             'Satisfaction',
      stat4:             'Expert Artisans',
      aboutCta:          'Speak to an Expert',

      whyLabel:          'The Furni Fix Difference',
      whyTitle:          'Why Choose Our Services?',
      why1Title:         'Expert Craftsmen',
      why1Desc:          'Highly trained professionals with decades of combined experience in specialised restoration techniques.',
      why2Title:         'Transparent Pricing',
      why2Desc:          'Honest, upfront quotes with no hidden fees. Premium service at competitive market rates.',
      why3Title:         'Fast Turnaround',
      why3Desc:          'We respect your time. Efficient processes ensure your furniture is returned promptly without compromising quality.',
      why4Title:         'Premium Materials',
      why4Desc:          'We source only the highest grade fabrics, genuine leathers, and authentic wood finishes for every job.',
      why5Title:         'Pick-up &amp; Delivery',
      why5Desc:          'Hassle-free service with safe, insured transportation of your furniture from door to workshop and back.',
      why6Title:         'Satisfaction Guaranteed',
      why6Desc:          'We stand behind our work. If you\'re not completely thrilled with the result, we\'ll make it right.',

      testLabel:         'Client Stories',
      testTitle:         'What People Say',
      test1Quote:        '"Furni Fix completely saved my grandmother\'s dining table. I thought it was ruined after water damage, but it looks better than ever. True magicians!"',
      test1Initial:      'S',
      test1Name:         'Sarah Jenkins',
      test1Role:         'Homeowner',
      test2Quote:        '"I regularly use Furni Fix for my clients\' custom upholstery needs. Their attention to detail and fabric matching is unmatched in the industry."',
      test2Initial:      'D',
      test2Name:         'David Chen',
      test2Role:         'Interior Designer',
      test3Quote:        '"They refurbished 40 chairs for my restaurant in record time. The quality is fantastic and the durable finish has held up beautifully to heavy use."',
      test3Initial:      'E',
      test3Name:         'Elena Rodriguez',
      test3Role:         'Restaurant Owner',

      faqLabel:          'Common Questions',
      faqTitle:          'Frequently Asked Questions',
      faqDesc:           'Everything you need to know about our furniture repair &amp; restoration services.',
      faq1Q:             'What types of furniture do you repair?',
      faq1A:             'We repair and restore all types of furniture — wooden tables, chairs, sofas, armchairs, dining sets, beds, wardrobes, cabinets, bookshelves, office furniture, and antique heirlooms. If it\'s made of wood, fabric, leather, or a combination, we can fix it.',
      faq2Q:             'How much does furniture repair cost?',
      faq2A:             'Pricing depends on the type of damage, the material, and the scope of work required. We offer completely <strong>free quotes</strong> — just send us a WhatsApp message with a photo of your furniture and we\'ll get back to you with an honest, no-hidden-fee price within a few hours.',
      faq3Q:             'How long does a typical repair take?',
      faq3A:             'Most standard repairs — scratches, joint tightening, re-stuffing — are completed within <strong>3–5 business days</strong>. More involved restorations such as full antique refinishing or complete upholstery replacement may take 7–14 days. We always give you a realistic timeline upfront.',
      faq4Q:             'Do you offer pick-up and delivery?',
      faq4A:             'Yes! We offer insured <strong>door-to-door pick-up and delivery</strong> across Dhaka. Our team handles all transportation carefully to ensure your furniture arrives and returns safely. This service is available at a small additional fee depending on your location.',
      faq5Q:             'Can you restore antique or heirloom furniture?',
      faq5A:             'Absolutely. Antique restoration is one of our specialties. We use <strong>period-correct materials, traditional joinery techniques, and authentic wood finishes</strong> to preserve the historical character and value of your piece.',
      faq6Q:             'Do you provide a warranty on your repairs?',
      faq6A:             'Yes. We stand behind every repair with a <strong>satisfaction guarantee</strong>. If you are not completely happy with the result, contact us within 7 days and we will make it right — at no additional cost. Our goal is your 100% satisfaction.',
      faq7Q:             'How do I contact Furni Fix to get started?',
      faq7A:             'The easiest way is to <strong>WhatsApp us at +880 171 772 2535</strong> with a photo of your furniture and a brief description of the issue. You can also fill in the contact form below. We respond within a few hours, Monday to Saturday.',

      contactLabel:      'Get In Touch',
      contactTitle:      'Ready to Restore?',
      contactDesc:       'Send us a message with details about your furniture. We\'ll get back to you quickly with a free consultation and quote.',
      contactPhoneTitle: 'Direct Line &amp; WhatsApp',
      contactPhoneHours: 'Available Mon–Sat, 9am – 6pm',
      contactLocTitle:   'Workshop Location',
      contactLocDesc:    'Dhaka, Bangladesh<br>Available city-wide via pick-up &amp; delivery',
      contactWaTitle:    'Fastest Response',
      contactWaDesc:     'Chat directly with our team on WhatsApp for instant quotes.',
      contactWaBtn:      'Chat on WhatsApp',

      formTitle:         'Get Your Free Quote',
      formNameLabel:     'Your Name',
      formNamePh:        'John Doe',
      formNameErr:       'Name must be at least 2 characters',
      formPhoneLabel:    'Phone Number',
      formPhoneErr:      'Please enter a valid phone number',
      formFurnLabel:     'Type of Furniture',
      formFurnPh:        'e.g. Antique Dining Table, Leather Sofa',
      formFurnErr:       'Please specify the furniture type',
      formProbLabel:     'Description of Problem',
      formProbPh:        'Describe the damage, scratches, structural issues, or what you need done...',
      formProbErr:       'Please provide more details (at least 10 characters)',
      formSubmit:        'Send Message',
      formNote:          'We\'ll get back to you as soon as possible',

      footerDesc:        'Professional furniture repair and restoration services bringing life back to your cherished pieces with expert craftsmanship.',
      footerLinksTitle:  'Quick Links',
      footerContactTitle:'Contact',
      footerRights:      'All rights reserved.',
      footerTagline:     'Designed with precision.',

      tyTitle:           'Thank You!',
      tyDesc:            'We\'ve received your message and will get back to you very soon. You can also reach us directly on WhatsApp anytime.',
      tyWaBtn:           'Chat on WhatsApp',
      tyClose:           'Done',
    },

    bn: {
      navServices:       'সেবাসমূহ',
      navAbout:          'আমাদের সম্পর্কে',
      navWhy:            'কেন আমরা',
      navTest:           'গ্রাহক মতামত',
      navFaq:            'সচরাচর জিজ্ঞাসা',
      ctaBtn:            'বিনামূল্যে কোটেশন',

      heroBadge:         'বিশেষজ্ঞ মেরামত  সেবা',
      heroTitle:         'আমরা ফিরিয়ে দিই<br><span class="italic">আপনার ফার্নিচারে</span><br>নতুন জীবন।',
      heroDesc:          'বছরের পর বছর অভিজ্ঞতায় আমরা আপনার ফার্নিচার মেরামত ও পুনরুদ্ধার করি। মানসম্পন্ন কারিগরি দক্ষতা, নিশ্চিত সন্তুষ্টি। পরিবর্তন নয়, পুনরুদ্ধার করুন।',
      heroBtnPrimary:    'বিনামূল্যে কোটেশন নিন',
      heroBtnOutline:    'আমাদের সেবা',
      heroProof:         '৫০০+ সন্তুষ্ট গ্রাহক',

      baLabelBefore:     'আগে',
      baLabelAfter:      'পরে',

      svcLabel:          'আমাদের বিশেষজ্ঞতা',
      svcTitle:          'অসাধারণ কারুকাজ',
      svcDesc:           'ছোট আঁচড় থেকে শুরু করে সম্পূর্ণ পুরনো বা প্রাচীন ফার্নিচার মেরামত থেকে পুনরুদ্ধার পর্যন্ত, আমাদের দক্ষ কারিগররা প্রতিটি কাজ যত্ন ও নিখুঁততার সাথে পরিচালনা করেন।',
      svc1Title:         'ফার্নিচারের কাপড় মেরামত',
      svc1Desc:          'চেয়ার ও সোফার জন্য উন্নত কাপড় ও চামড়া প্রতিস্থাপন, রি-স্টাফিং এবং কাঠামোগত ফোম মেরামত।',
      svc2Title:         'কাঠ পুনরুদ্ধার',
      svc2Desc:          'সব ধরনের কাঠের ফার্নিচারের সারফেসে আঁচড়, ডেন্ট, পানির দাগ এবং গর্ত সংস্কার।',
      svc3Title:         'কাস্টম রিফিনিশিং',
      svc3Desc:          'পুরনো ফিনিশ তুলে ফেলে আধুনিক বা ঐতিহ্যবাহী দাগ, রং এবং লেকার প্রয়োগ।',
      svc4Title:         'কাঠামোগত মেরামত',
      svc4Desc:          'আলগা চেয়ারের পা, ভাঙা টেবিলের ফ্রেম মেরামত এবং আসল পদ্ধতিতে দুর্বল জয়েন্ট শক্তিশালী করা।',
      svc5Title:         'পুরনো ফার্নিচারের পুনরুদ্ধার',
      svc5Desc:          'ঐতিহাসিক টুকরার ঐতিহ্যবাহী উপকরণ ও কৌশল ব্যবহার করে সাবধানে সংরক্ষণ।',
      svc6Title:         'ফার্নিচার পলিশিং',
      svc6Desc:          'আপনার প্রিয় জিনিসের মূল চকচকে ভাব ফিরিয়ে আনতে গভীর পরিষ্কার, তেল দেওয়া এবং বাফিং।',

      expBadge:          'বছরের অভিজ্ঞতা',
      aboutLabel:        'ফার্নি ফিক্স সম্পর্কে',
      aboutTitle:        'আপনার ঐতিহ্য সংরক্ষণে নিবেদিত',
      aboutP1:           'ফার্নি ফিক্সে আমরা শুধু ফার্নিচার মেরামত করি না; আমরা স্মৃতি পুনরুদ্ধার করি। কাঠের কাজের প্রতি গভীর আবেগ এবং টেকসই জীবনযাত্রার প্রতিশ্রুতি নিয়ে গড়ে ওঠা আমাদের দক্ষ কারিগর দল প্রতিটি কাজকে নিজের মনে করে যত্ন দেয়।',
      aboutP2:           'মূল্যবান পারিবারিক স্মৃতিবিজড়িত জিনিস হোক বা আপনার পছন্দের আরামদায়ক পড়ার চেয়ার আপনার প্রিয় ফার্নিচারে নতুন জীবন দেওয়ার দক্ষতা, সরঞ্জাম এবং নিষ্ঠা আমাদের রয়েছে।',
      stat1:             'সন্তুষ্ট গ্রাহক',
      stat2:             'ফার্নিচার পুনরুদ্ধার',
      stat3:             'সন্তুষ্টি',
      stat4:             'দক্ষ কারিগর',
      aboutCta:          'বিশেষজ্ঞের সাথে কথা বলুন',

      whyLabel:          'ফার্নি ফিক্সের বিশেষত্ব',
      whyTitle:          'কেন আমাদের সেবা বেছে নেবেন?',
      why1Title:         'দক্ষ কারিগর',
      why1Desc:          'পুনরুদ্ধার কৌশলে দশকের সম্মিলিত অভিজ্ঞতাসহ উচ্চ প্রশিক্ষিত পেশাদারগণ।',
      why2Title:         'স্বচ্ছ মূল্য নির্ধারণ',
      why2Desc:          'কোনো লুকানো চার্জ ছাড়াই সৎ ও পূর্বনির্ধারিত কোটেশন। প্রতিযোগিতামূলক মূল্যে প্রিমিয়াম সেবা।',
      why3Title:         'দ্রুত সরবরাহ',
      why3Desc:          'আমরা আপনার সময়কে সম্মান করি। মান ক্ষুণ্ণ না করে দ্রুততার সাথে আপনার ফার্নিচার ফিরিয়ে দেওয়া আমাদের অঙ্গীকার।',
      why4Title:         'উচ্চমানের উপকরণ',
      why4Desc:          'প্রতিটি কাজে আমরা সর্বোচ্চ মানের কাপড়, আসল চামড়া এবং প্রামাণিক কাঠের ফিনিশ ব্যবহার করি।',
      why5Title:         'পিক আপ ও ডেলিভারি',
      why5Desc:          'আপনার ফার্নিচার আমাদের কর্মশালায় পৌঁছে দেওয়া ও ফিরিয়ে আনার নিরাপদ, বিমাযুক্ত পরিবহন সেবা।',
      why6Title:         'সন্তুষ্টি নিশ্চিত',
      why6Desc:          'আমরা আমাদের কাজের পাশে থাকি। ফলাফলে সম্পূর্ণ খুশি না হলে বিনা সার্ভিস চার্জে তা ঠিক করে দেব।',

      testLabel:         'গ্রাহকদের অভিজ্ঞতা',
      testTitle:         'তারা যা বলেন',
      test1Quote:        '"ফার্নি ফিক্স আমার দাদির ডাইনিং টেবিলটি সম্পূর্ণ বাঁচিয়ে দিয়েছে। পানির ক্ষতির পরে ভেবেছিলাম নষ্ট হয়ে গেছে, কিন্তু এখন আগের চেয়েও সুন্দর। সত্যিকারের যাদুকর!"',
      test1Initial:      'স',
      test1Name:         'সালমা বেগম',
      test1Role:         'গৃহিণী',
      test2Quote:        '"আমার ক্লায়েন্টদের কাস্টম আপহোলস্ট্রির জন্য নিয়মিত ফার্নি ফিক্স ব্যবহার করি। তাদের সূক্ষ্ম কাজের দক্ষতা এবং কাপড় মিলানোর দক্ষতা শিল্পে অতুলনীয়।"',
      test2Initial:      'দ',
      test2Name:         'দাউদ হোসেন',
      test2Role:         'ইন্টেরিয়র ডিজাইনার',
      test3Quote:        '"রেকর্ড সময়ে আমার রেস্তোরাঁর ৪০টি চেয়ার সংস্কার করেছে। মান অসাধারণ এবং টেকসই ফিনিশ ভারী ব্যবহারেও সুন্দরভাবে টিকে আছে।"',
      test3Initial:      'র',
      test3Name:         'রিমা আক্তার',
      test3Role:         'রেস্তোরাঁর মালিক',

      faqLabel:          'সাধারণ প্রশ্নাবলি',
      faqTitle:          'প্রায়ই জিজ্ঞাসিত প্রশ্ন',
      faqDesc:           'আমাদের ফার্নিচার মেরামত ও পুনরুদ্ধার সেবা সম্পর্কে আপনার জানার সব কিছু।',
      faq1Q:             'আপনারা কোন ধরনের ফার্নিচার মেরামত করেন?',
      faq1A:             'আমরা সব ধরনের ফার্নিচার মেরামত ও পুনরুদ্ধার করি — কাঠের টেবিল, চেয়ার, সোফা, আর্মচেয়ার, ডাইনিং সেট, বিছানা, আলমারি, ক্যাবিনেট, বুকশেলফ, অফিস ফার্নিচার এবং প্রাচীন স্মৃতিবস্তু। কাঠ, কাপড়, চামড়া বা এর সমন্বয়ে তৈরি যেকোনো কিছু আমরা ঠিক করতে পারি।',
      faq2Q:             'ফার্নিচার মেরামতে কত খরচ হয়?',
      faq2A:             'ক্ষতির ধরন, উপকরণ ও কাজের পরিধির উপর নির্ভর করে মূল্য নির্ধারিত হয়। আমরা সম্পূর্ণ <strong>বিনামূল্যে কোটেশন</strong> দিই — হোয়াটসঅ্যাপে আপনার ফার্নিচারের ছবিসহ বার্তা পাঠান এবং কয়েক ঘণ্টার মধ্যে কোনো লুকানো চার্জ ছাড়াই সৎ মূল্য জানুন।',
      faq3Q:             'সাধারণত একটি মেরামত কত দিন লাগে?',
      faq3A:             'আঁচড়, জয়েন্ট শক্ত করা, রি-স্টাফিংয়ের মতো সাধারণ মেরামত <strong>৩–৫ কার্যদিবসে</strong> সম্পন্ন হয়। সম্পূর্ণ প্রাচীন ফার্নিচার পুনরুদ্ধার বা সম্পূর্ণ আপহোলস্ট্রি প্রতিস্থাপনে ৭–১৪ দিন লাগতে পারে। কাজ শুরুর আগে আমরা সবসময় বাস্তবসম্মত সময়সীমা জানিয়ে দিই।',
      faq4Q:             'আপনারা কি পিক আপ ও ডেলিভারি সেবা দেন?',
      faq4A:             'হ্যাঁ! আমরা ঢাকা জুড়ে <strong>পিক আপ ও ডেলিভারি</strong> সেবা দিই। আমাদের দল আপনার ফার্নিচার সাবধানে পরিবহন করে। আপনার অবস্থানের উপর নির্ভর করে সামান্য অতিরিক্ত ফিতে এই সেবা পাওয়া যায়।',
      faq5Q:             'আপনারা কি প্রাচীন বা পারিবারিক ফার্নিচার পুনরুদ্ধার করতে পারেন?',
      faq5A:             'অবশ্যই। প্রাচীন ফার্নিচার পুনরুদ্ধার আমাদের বিশেষত্বগুলির মধ্যে একটি। ঐতিহাসিক চরিত্র ও মূল্য সংরক্ষণ করতে আমরা <strong>ঐতিহ্যবাহী উপকরণ, ঐতিহ্যগত কারপেন্ট্রি কৌশল এবং আসল কাঠের ফিনিশ</strong> ব্যবহার করি।',
      faq6Q:             'আপনারা কি মেরামতের উপর ওয়ারেন্টি দেন?',
      faq6A:             'হ্যাঁ। আমরা প্রতিটি মেরামতের পেছনে <strong>সন্তুষ্টি গ্যারান্টি</strong> নিয়ে দাঁড়াই। ফলাফলে সম্পূর্ণ খুশি না হলে ৭ দিনের মধ্যে আমাদের সাথে যোগাযোগ করুন — কোনো অতিরিক্ত খরচ ছাড়াই আমরা তা ঠিক করে দেব।',
      faq7Q:             'আমি কীভাবে ফার্নি ফিক্সের সাথে যোগাযোগ করব?',
      faq7A:             'সবচেয়ে সহজ উপায় হলো <strong>+৮৮০ ১৭১ ৭৭২ ২৫৩৫</strong> নম্বরে হোয়াটসঅ্যাপে আপনার ফার্নিচারের ছবিসহ সমস্যার বিবরণ দিয়ে বার্তা পাঠানো। নিচের ফর্মটিও পূরণ করতে পারেন। সোমবার থেকে শনিবার কয়েক ঘণ্টার মধ্যে সাড়া দিই।',

      contactLabel:      'যোগাযোগ করুন',
      contactTitle:      'মেরামত করতে প্রস্তুত?',
      contactDesc:       'আপনার ফার্নিচারের বিস্তারিত তথ্যসহ আমাদের বার্তা পাঠান। আমরা দ্রুত বিনামূল্যে পরামর্শ ও কোটেশন নিয়ে আপনার কাছে ফিরব।',
      contactPhoneTitle: 'সরাসরি লাইন ও হোয়াটসঅ্যাপ',
      contactPhoneHours: 'সোম–শনি, সকাল ৯টা – সন্ধ্যা ৬টা',
      contactLocTitle:   'কর্মশালার অবস্থান',
      contactLocDesc:    'ঢাকা, বাংলাদেশ<br>পিক আপ ও ডেলিভারি সেবাসহ সারা শহরে',
      contactWaTitle:    'দ্রুততম সাড়া',
      contactWaDesc:     'তাৎক্ষণিক কোটেশনের জন্য হোয়াটসঅ্যাপে আমাদের টিমের সাথে সরাসরি চ্যাট করুন।',
      contactWaBtn:      'হোয়াটসঅ্যাপে চ্যাট করুন',

      formTitle:         'বিনামূল্যে কোটেশন নিন',
      formNameLabel:     'আপনার নাম',
      formNamePh:        'যেমন: এনায়েত চৌধুরী',
      formNameErr:       'নাম কমপক্ষে ২ অক্ষরের হতে হবে',
      formPhoneLabel:    'ফোন নম্বর',
      formPhoneErr:      'সঠিক ফোন নম্বর দিন',
      formFurnLabel:     'ফার্নিচারের ধরন',
      formFurnPh:        'যেমন: পুরনো ডাইনিং টেবিল, লেদার সোফা',
      formFurnErr:       'ফার্নিচারের ধরন উল্লেখ করুন',
      formProbLabel:     'সমস্যার বিবরণ',
      formProbPh:        'ক্ষতির বিবরণ, আঁচড়, কাঠামোগত সমস্যা বা কী করাতে চান তা লিখুন...',
      formProbErr:       'বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)',
      formSubmit:        'বার্তা পাঠান',
      formNote:          'আমরা যত দ্রুত সম্ভব আপনার সাথে যোগাযোগ করব',

      footerDesc:        'পেশাদার ফার্নিচার মেরামত ও পুনরুদ্ধার সেবা — বিশেষজ্ঞ কারিগরিতে আপনার প্রিয় জিনিসে নতুন জীবন।',
      footerLinksTitle:  'দ্রুত লিঙ্ক',
      footerContactTitle:'যোগাযোগ',
      footerRights:      'সর্বস্বত্ব সংরক্ষিত।',
      footerTagline:     'নিখুঁতভাবে ডিজাইন করা হয়েছে।',

      tyTitle:           'ধন্যবাদ!',
      tyDesc:            'আমরা আপনার বার্তা পেয়েছি এবং শীঘ্রই যোগাযোগ করব। যেকোনো সময় সরাসরি হোয়াটসঅ্যাপেও যোগাযোগ করতে পারেন।',
      tyWaBtn:           'হোয়াটসঅ্যাপে চ্যাট করুন',
      tyClose:           'সম্পন্ন',
    }
  };

  let currentLang = 'bn';

  const toggleBtnDesktop = document.getElementById('lang-toggle');
  const toggleBtnMobile  = document.getElementById('lang-toggle-mobile');

  function applyLang(lang) {
    currentLang = lang;

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Toggle body class for font switching
    document.body.classList.toggle('lang-bn', lang === 'bn');

    const dict = t[lang];

    // Update all [data-i18n] elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key] !== undefined) {
        el.placeholder = dict[key];
      }
    });

    // Update toggle button labels
    const btnLabel = lang === 'bn' ? 'English' : 'বাংলা';
    if (toggleBtnDesktop) {
      toggleBtnDesktop.querySelector('.lang-toggle-text').textContent = btnLabel;
    }
    if (toggleBtnMobile) {
      toggleBtnMobile.querySelector('.lang-toggle-text-mobile').textContent = btnLabel;
    }

    // Save preference
    try { localStorage.setItem('furnifix-lang', lang); } catch (e) {}
  }

  function toggleLang() {
    applyLang(currentLang === 'bn' ? 'en' : 'bn');
  }

  if (toggleBtnDesktop) toggleBtnDesktop.addEventListener('click', toggleLang);
  if (toggleBtnMobile)  toggleBtnMobile.addEventListener('click', () => { toggleLang(); closeMobileMenu(); });

  // Initialise on load — respect saved preference, default to Bangla
  let savedLang = 'bn';
  try { savedLang = localStorage.getItem('furnifix-lang') || 'bn'; } catch (e) {}
  applyLang(savedLang);

})();
