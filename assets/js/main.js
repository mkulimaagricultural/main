/* ============================================================
   CHARITIZE — main.js
   Interactions: nav scroll, mobile menu, rise animations,
   progress bar fill, impact counters, gallery stagger
   ============================================================ */

(function () {
  'use strict';

  /* ── Navigation: scroll-aware ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu toggle ── */
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('nav__links--open');
      toggle.classList.toggle('nav__toggle--open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Close on link click
    links.querySelectorAll('.nav__link, .nav__cta, .nav__donate').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('nav__links--open');
        toggle.classList.remove('nav__toggle--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && links.classList.contains('nav__links--open')) {
        links.classList.remove('nav__links--open');
        toggle.classList.remove('nav__toggle--open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── IntersectionObserver: rise animations ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupRise() {
    if (prefersReduced) {
      document.querySelectorAll('.rise, .stagger').forEach(el => {
        el.classList.add('rise--visible', 'stagger--visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('rise--visible', 'stagger--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.rise, .stagger').forEach(el => observer.observe(el));
  }

  /* ── Progress bar fill ── */
  function setupProgressBars() {
    if (prefersReduced) {
      document.querySelectorAll('.progress').forEach(bar => {
        bar.classList.add('progress--animated');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('progress--animated');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('.progress').forEach(bar => observer.observe(bar));
  }

  /* ── Impact counter animation ── */
  function setupCounters() {
    if (prefersReduced) {
      document.querySelectorAll('[data-count]').forEach(el => {
        el.textContent = formatNumber(parseInt(el.dataset.count, 10));
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = formatNumber(current) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function formatNumber(n) {
    return n.toLocaleString('en-US');
  }

  /* ── Gallery stagger ── */
  function setupGalleryStagger() {
    if (prefersReduced) return;

    const galleryItems = document.querySelectorAll('.gallery-item');
    if (!galleryItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('stagger--visible');
            }, i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    galleryItems.forEach(item => observer.observe(item));
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Active nav link highlight ── */
  function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('nav__link--active');
      }
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    setupRise();
    setupProgressBars();
    setupCounters();
    setupGalleryStagger();
    highlightActiveNav();
  });
})();
