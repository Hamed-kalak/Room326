/* ═══════════════════════════════════════════════════════════════════
   HAMED — WORLD · game-style navigation
   A 3×3 grid of rooms. Move with arrows, WASD, the D-pad, the
   mini-map, signposts, or horizontal swipes. Position syncs to the
   URL hash so every room is linkable.
   ═══════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const world = document.getElementById('world');
  const viewport = document.getElementById('viewport');
  const minimap = document.getElementById('minimap');
  const announcer = document.getElementById('announcer');
  const sectorEl = document.getElementById('sector');
  const sectorRoomEl = document.getElementById('sector-room');

  // Build the grid model from the DOM (rooms are in row-major order).
  const sections = [...world.querySelectorAll('.room')];
  const SIZE = 3;
  const grid = [];
  sections.forEach((el, i) => {
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    if (!grid[row]) grid[row] = [];
    grid[row][col] = {
      el,
      row,
      col,
      id: el.dataset.room,
      title: el.dataset.title,
      isVoid: el.classList.contains('room-void'),
    };
  });

  const HOME = { row: 1, col: 1 };
  const COLS = ['A', 'B', 'C'];
  const DIRS = {
    up:    { dr: -1, dc: 0 },
    down:  { dr: 1,  dc: 0 },
    left:  { dr: 0,  dc: -1 },
    right: { dr: 0,  dc: 1 },
  };

  let pos = { ...HOME };

  const roomAt = (row, col) =>
    row >= 0 && row < SIZE && col >= 0 && col < SIZE ? grid[row][col] : null;

  const findRoom = (id) => {
    for (const row of grid) for (const cell of row) if (cell.id === id) return cell;
    return null;
  };

  // ── Mini-map ──────────────────────────────────────────────────────
  const mapCells = [];
  for (const row of grid) {
    for (const cell of row) {
      const btn = document.createElement('button');
      btn.className = 'minimap-cell' + (cell.isVoid ? ' is-void' : '');
      btn.title = cell.title;
      btn.setAttribute('aria-label', `Go to ${cell.title}`);
      btn.addEventListener('click', () => goTo(cell.row, cell.col));
      minimap.appendChild(btn);
      mapCells.push(btn);
    }
  }

  // ── Signposts: label what lies in each direction of every room ───
  for (const row of grid) {
    for (const cell of row) {
      for (const [dir, { dr, dc }] of Object.entries(DIRS)) {
        const neighbor = roomAt(cell.row + dr, cell.col + dc);
        if (!neighbor || neighbor.isVoid) continue;
        const arrow = { up: '↑', down: '↓', left: '←', right: '→' }[dir];
        const post = document.createElement('button');
        post.className = `signpost signpost-${dir}`;
        post.textContent = dir === 'down' || dir === 'right'
          ? `${neighbor.title} ${arrow}`
          : `${arrow} ${neighbor.title}`;
        post.addEventListener('click', () => move(dir));
        cell.el.appendChild(post);
      }
    }
  }

  // ── Movement ──────────────────────────────────────────────────────
  function goTo(row, col, { silent = false } = {}) {
    const target = roomAt(row, col);
    if (!target) return false;
    pos = { row, col };
    render(silent);
    return true;
  }

  function move(dir) {
    if (dir === 'home') return goTo(HOME.row, HOME.col);
    const { dr, dc } = DIRS[dir];
    const ok = goTo(pos.row + dr, pos.col + dc);
    if (!ok) bump(dir);
    return ok;
  }

  function bump(dir) {
    const cls = `bump-${dir}`;
    viewport.classList.remove(cls);
    void viewport.offsetWidth; // restart the animation
    viewport.classList.add(cls);
    setTimeout(() => viewport.classList.remove(cls), 400);
  }

  function render(silent = false) {
    const current = grid[pos.row][pos.col];

    world.style.setProperty('--row', pos.row);
    world.style.setProperty('--col', pos.col);

    mapCells.forEach((btn, i) => {
      btn.classList.toggle('is-current', i === pos.row * SIZE + pos.col);
    });

    sectorEl.textContent = `${COLS[pos.col]}${pos.row + 1}`;
    sectorRoomEl.textContent = current.title;

    for (const [dir, { dr, dc }] of Object.entries(DIRS)) {
      const btn = document.querySelector(`.dpad-btn[data-move="${dir}"]`);
      if (btn) btn.disabled = !roomAt(pos.row + dr, pos.col + dc);
    }

    if (!silent) {
      announcer.textContent = `Now in: ${current.title}`;
      history.replaceState(null, '', `#${current.id}`);
    }
  }

  // ── Controls ──────────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-move]');
    if (btn) move(btn.dataset.move);
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

  // Horizontal swipe (vertical stays free for scrolling long rooms).
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
    }
  }, { passive: true });

  // ── Deep links: #education, #papers, … ───────────────────────────
  function syncFromHash(silent) {
    const target = findRoom(location.hash.slice(1));
    if (target) goTo(target.row, target.col, { silent });
  }

  window.addEventListener('hashchange', () => syncFromHash(false));

  syncFromHash(true);
  render(true);
})();
