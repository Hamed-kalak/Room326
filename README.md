# Hamed Mirbagheri — personal site

A nav-less personal brand site: one vertical journey that snaps slide by
slide, like paging through a deck.

```
Home → Education → Experience → Projects → Papers → Languages → Contact
```

Scroll (one wheel gesture = one slide), swipe, or use ↑/↓ · PageUp/PageDown ·
Home/End. Quiet chrome only: a slide counter bottom-left and a passive dot
rail on the right. Every slide is deep-linkable (`#education`, `#papers`, …).

Styled after a retro road-trip poster — warm cream paper (`#fff8f1`), one
electric blue (`#006eff`), hairline dividers, serif display type — but alive:
the name has a heartbeat, blurred blue clouds drift and parallax behind the
journey, a particle field of slow embers floats by, the hero melts into blur
at its edges, glass buttons carry moving reflections, and each slide's
content reveals in a staggered rise as it arrives. All of it respects
`prefers-reduced-motion`.

## Run it

It's a plain static site — no build step, no dependencies.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` in a browser.

## Edit the content

All content lives in `index.html`. Search for `✏️ EDIT` comments — they mark
every placeholder (degrees, roles, projects, papers, languages, LinkedIn URL).

To add a room, drop a new `<section class="room" data-room="id" data-title="Name">`
into the grid in `index.html` (rooms are laid out in row-major order) and grow
the grid in `styles.css` / `SIZE` in `app.js` if you go beyond 3×3.

## Move this to its own repository

This branch is self-contained. Once you create an empty repo on GitHub
(e.g. `hamed-world`, **no** README/license auto-init):

```bash
git clone --branch claude/personal-brand-site-zrdw5u https://github.com/Hamed-kalak/room326.git hamed-world
cd hamed-world
git branch -m main
git remote set-url origin https://github.com/Hamed-kalak/hamed-world.git
git push -u origin main
```

Then enable **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / root)
and the site is live at `https://hamed-kalak.github.io/hamed-world/`.
