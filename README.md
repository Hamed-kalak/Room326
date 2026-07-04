# Hamed — World

A personal brand site that plays like a game, not a website.

Home floats on an upper floor with three glass doors fanned around the name
(↙ ↓ ↘). Below it is a strip of six rooms you walk through left/right, with a
door back up to Home from any of them. Steer with arrow keys, WASD, the glass
doors, the mini-map, or swipes. Every room is deep-linkable
(`#education`, `#papers`, …).

```
                        HOME
              ↙          ↓          ↘
Languages · Projects · Education · Experience · Papers · Contact
```

Styled after a retro road-trip poster — warm cream paper (`#fff8f1`), one
electric blue (`#006eff`), hairline dividers, serif display type — but alive:
the name has a heartbeat, blurred blue clouds drift around, a particle field
of slow embers floats by, the Home screen melts into blur at its edges, and
glass buttons carry moving reflections. All of it respects
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
