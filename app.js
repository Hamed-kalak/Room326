/* ═══════════════════════════════════════════════════════════════════
   HAMED MIRBAGHERI · nav-less slide deck
   One vertical journey. CSS scroll-snap does the chunking; this file
   choreographs the life: reveal animations as slides arrive, the
   counter and dots, keyboard paging, ambient parallax, particles.
   ═══════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const container = document.getElementById('slides');
  const slides = [...document.querySelectorAll('.slide')];
  const dotsWrap = document.getElementById('dots');
  const announcer = document.getElementById('announcer');
  const counterCurrent = document.getElementById('counter-current');
  const counterTotal = document.getElementById('counter-total');
  const counterTitle = document.getElementById('counter-title');
  const blobs = document.querySelector('.fx-blobs');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pad = (n) => String(n).padStart(2, '0');
  counterTotal.textContent = pad(slides.length);

  let activeIndex = 0;

  // ── Progress dots ─────────────────────────────────────────────────
  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', slide.dataset.title);
    dot.addEventListener('click', () => scrollToSlide(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  // ── Reveal choreography: stagger each slide's children ───────────
  slides.forEach((slide) => {
    slide.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--d', `${i * 0.14}s`);
    });
  });

  // Slides re-arm when they leave, so the choreography replays.
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    }
  }, { root: container, threshold: 0.35 });

  slides.forEach((s) => revealObserver.observe(s));

  // Which slide owns the screen right now?
  const activeObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      setActive(slides.indexOf(entry.target));
    }
  }, { root: container, threshold: 0.6 });

  slides.forEach((s) => activeObserver.observe(s));

  function setActive(index, silent = false) {
    if (index === activeIndex && !silent) return;
    activeIndex = index;
    const slide = slides[index];

    document.body.dataset.slide = slide.id;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
    counterCurrent.textContent = pad(index + 1);
    counterTitle.textContent = slide.dataset.title;

    // Ambient parallax: the blur clouds lag gently behind the journey.
    if (!reducedMotion) {
      blobs.style.setProperty('--parallax', `${index * -36}px`);
    }

    if (!silent) {
      announcer.textContent = slide.dataset.title;
      history.replaceState(null, '', `#${slide.id}`);
    }
  }

  // ── Keyboard: page through the deck in chunks ─────────────────────
  function scrollToSlide(i) {
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    slides[clamped].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  const NEXT_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 's', 'S', 'j', 'J']);
  const PREV_KEYS = new Set(['ArrowUp', 'PageUp', 'w', 'W', 'k', 'K']);

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (NEXT_KEYS.has(e.key)) { e.preventDefault(); scrollToSlide(activeIndex + 1); }
    else if (PREV_KEYS.has(e.key)) { e.preventDefault(); scrollToSlide(activeIndex - 1); }
    else if (e.key === 'Home') { e.preventDefault(); scrollToSlide(0); }
    else if (e.key === 'End') { e.preventDefault(); scrollToSlide(slides.length - 1); }
  });

  // ── Wheel chunking: one gesture, one slide ────────────────────────
  // CSS snap alone lets small wheel scrolls fall back to the current
  // slide. Instead: accumulate deltas, and once a gesture is decisive,
  // commit to a full slide (or page through a slide taller than the
  // viewport before leaving it).
  let wheelAcc = 0;
  let wheelResetTimer;
  let animLock = false;

  function lock() {
    animLock = true;
    setTimeout(() => { animLock = false; }, 850);
  }

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (animLock) return;

    wheelAcc += e.deltaY;
    clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => { wheelAcc = 0; }, 200);
    if (Math.abs(wheelAcc) < 50) return;

    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;

    // If the current slide overflows the viewport, walk through it first.
    const rect = slides[activeIndex].getBoundingClientRect();
    if (dir > 0 && rect.bottom > window.innerHeight + 8) {
      container.scrollBy({ top: window.innerHeight * 0.85, behavior: reducedMotion ? 'auto' : 'smooth' });
    } else if (dir < 0 && rect.top < -8) {
      container.scrollBy({ top: -window.innerHeight * 0.85, behavior: reducedMotion ? 'auto' : 'smooth' });
    } else {
      scrollToSlide(activeIndex + dir);
    }
    lock();
  }, { passive: false });

  // ── Deep links: #education, #papers, … ───────────────────────────
  function syncFromHash() {
    const i = slides.findIndex((s) => s.id === location.hash.slice(1));
    if (i >= 0) {
      slides[i].scrollIntoView({ behavior: 'auto' });
      setActive(i, true);
    }
  }

  window.addEventListener('hashchange', () => {
    const i = slides.findIndex((s) => s.id === location.hash.slice(1));
    if (i >= 0) scrollToSlide(i);
  });

  syncFromHash();
  setActive(activeIndex, true);

  // ══════════════════ Particles: slow blue embers ══════════════════
  if (!reducedMotion) {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let W, H, dotsField;

    function seed() {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
      const count = Math.min(64, Math.floor(window.innerWidth / 24));
      dotsField = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (Math.random() * 1.8 + 0.8) * devicePixelRatio,
        vy: (Math.random() * 0.22 + 0.06) * devicePixelRatio,
        sway: Math.random() * 0.5 + 0.15,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.22 + 0.08,
      }));
    }

    function tick(t) {
      ctx.clearRect(0, 0, W, H);
      for (const d of dotsField) {
        d.y -= d.vy;
        const x = d.x + Math.sin(t / 2400 + d.phase) * 18 * d.sway * devicePixelRatio;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 110, 255, ${d.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    seed();
    window.addEventListener('resize', seed);
    requestAnimationFrame(tick);
  }

  // Stagger the glass reflections so they don't flash in unison.
  document.querySelectorAll('.glass').forEach((el, i) => {
    el.style.setProperty('--sheen-delay', `${(i * 0.7) % 4.2}s`);
  });
})();
