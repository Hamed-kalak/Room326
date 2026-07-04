/* ═══════════════════════════════════════════════════════════════════
   HAMED — WORLD · game-style navigation, v2
   Home floats on the upper floor. Below it, a strip of six rooms:
   Languages · Projects · Education · Experience · Papers · Contact.
   From Home you take one of three doors (↙ ↓ ↘). Down in the strip
   you walk ← → between rooms, or head ↑ back up to Home.
   Plus: particles, drifting blur, heartbeat — the map is alive.
   ═══════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const world = document.getElementById('world');
  const viewport = document.getElementById('viewport');
  const minimap = document.getElementById('minimap');
  const announcer = document.getElementById('announcer');
  const sectorEl = document.getElementById('sector');
  const sectorRoomEl = document.getElementById('sector-room');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── World model ───────────────────────────────────────────────────
  const STRIP = ['languages', 'projects', 'education', 'experience', 'papers', 'contact'];
  const HOME_COL = 3; // Home sits above the Experience room

  const rooms = {};
  document.querySelectorAll('.room').forEach((el) => {
    const id = el.dataset.room;
    rooms[id] = {
      id,
      el,
      title: el.dataset.title,
      row: id === 'home' ? 0 : 1,
      col: id === 'home' ? HOME_COL : STRIP.indexOf(id),
    };
  });

  let current = rooms.home;

  // What each room offers in each direction.
  function exits(room) {
    if (room.id === 'home') {
      return {
        left: STRIP[HOME_COL - 1],  // ↙ door
        down: STRIP[HOME_COL],      // ↓ door
        right: STRIP[HOME_COL + 1], // ↘ door
        up: null,
      };
    }
    const i = STRIP.indexOf(room.id);
    return {
      left: STRIP[i - 1] || null,
      right: STRIP[i + 1] || null,
      up: 'home',
      down: null,
    };
  }

  // ── Mini-map: lone Home cell up top, the strip below ─────────────
  const mapCells = {};
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < STRIP.length; col++) {
      const id = row === 0 ? (col === HOME_COL ? 'home' : null) : STRIP[col];
      const btn = document.createElement('button');
      btn.className = 'minimap-cell' + (id ? '' : ' is-empty');
      if (id) {
        btn.title = rooms[id].title;
        btn.setAttribute('aria-label', `Go to ${rooms[id].title}`);
        btn.addEventListener('click', () => goTo(id));
        mapCells[id] = btn;
      } else {
        btn.tabIndex = -1;
        btn.setAttribute('aria-hidden', 'true');
      }
      minimap.appendChild(btn);
    }
  }

  // ── Room navigation: side doors + way up (strip rooms only) ──────
  for (const id of STRIP) {
    const room = rooms[id];
    const e = exits(room);

    if (e.left) {
      room.el.appendChild(makeNav('left', '←', rooms[e.left].title, () => goTo(e.left)));
    }
    if (e.right) {
      room.el.appendChild(makeNav('right', '→', rooms[e.right].title, () => goTo(e.right)));
    }
    room.el.appendChild(makeNav('up', '↑', 'Home', () => goTo('home')));
  }

  function makeNav(dir, arrow, label, onClick) {
    const btn = document.createElement('button');
    btn.className = `roomnav roomnav-${dir} ${dir === 'up' ? 'glass' : ''}`;
    btn.setAttribute('aria-label', `Go to ${label}`);
    if (dir === 'up') {
      btn.innerHTML = `<span class="roomnav-arrow">${arrow}</span><span class="roomnav-label">${label}</span>`;
    } else {
      btn.innerHTML = `<span class="roomnav-circle glass">${arrow}</span><span class="roomnav-label">${label}</span>`;
    }
    btn.addEventListener('click', onClick);
    return btn;
  }

  // Stagger the glass reflections so they don't flash in unison.
  document.querySelectorAll('.glass').forEach((el, i) => {
    el.style.setProperty('--sheen-delay', `${(i * 0.7) % 4.2}s`);
  });

  // ── Movement ──────────────────────────────────────────────────────
  function goTo(id, { silent = false } = {}) {
    const target = rooms[id];
    if (!target || target === current) return false;
    current = target;
    render(silent);
    if (!reducedMotion) travelZoom();
    return true;
  }

  function move(dir) {
    const id = exits(current)[dir];
    if (id) return goTo(id);
    bump(dir);
    return false;
  }

  let zoomTimer;
  function travelZoom() {
    world.classList.add('traveling');
    clearTimeout(zoomTimer);
    zoomTimer = setTimeout(() => world.classList.remove('traveling'), 380);
  }

  function bump(dir) {
    const cls = `bump-${dir}`;
    viewport.classList.remove(cls);
    void viewport.offsetWidth; // restart the animation
    viewport.classList.add(cls);
    setTimeout(() => viewport.classList.remove(cls), 400);
  }

  function render(silent = false) {
    world.style.setProperty('--row', current.row);
    world.style.setProperty('--col', current.col);

    document.body.dataset.room = current.id;

    for (const [id, btn] of Object.entries(mapCells)) {
      btn.classList.toggle('is-current', id === current.id);
    }

    sectorEl.textContent = current.id === 'home' ? 'HQ' : `S${current.col + 1}`;
    sectorRoomEl.textContent = current.title;

    if (!silent) {
      announcer.textContent = `Now in: ${current.title}`;
      history.replaceState(null, '', `#${current.id}`);
    }
  }

  // ── Controls ──────────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-goto]');
    if (btn) goTo(btn.dataset.goto);
  });

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right',
  };

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const dir = KEYMAP[e.key];
    if (!dir) return;
    e.preventDefault();
    move(dir);
  });

  // Swipes: horizontal walks the strip (or takes a side door from Home);
  // a decisive vertical swipe goes down from Home / back up from the strip.
  let touchX = null, touchY = null;
  document.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      move(dx < 0 ? 'right' : 'left');
    } else if (current.id === 'home' && dy < -90 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      move('down'); // swipe up on Home dives into the strip
    }
  }, { passive: true });

  // ── Deep links: #education, #papers, … ───────────────────────────
  function syncFromHash(silent) {
    const id = location.hash.slice(1);
    if (rooms[id]) goTo(id, { silent });
  }

  window.addEventListener('hashchange', () => syncFromHash(false));

  syncFromHash(true);
  render(true);

  // ══════════════════ Particles: slow blue embers ══════════════════
  if (!reducedMotion) {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let W, H, dots;

    function seed() {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
      const count = Math.min(64, Math.floor(window.innerWidth / 24));
      dots = Array.from({ length: count }, () => ({
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
      for (const d of dots) {
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
})();
