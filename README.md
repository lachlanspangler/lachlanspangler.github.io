# lachlanspangler.github.io

My personal site — [lachlanspangler.github.io](https://lachlanspangler.github.io).
A single-page editorial portfolio: work, projects, awards, education, and a bit
of fun. Static HTML/CSS/JS, no build step, no dependencies.

## Features

- Animated multi-ring **preloader** with a progress bar.
- **Particle-network** background canvas (respects `prefers-reduced-motion`,
  pauses when the tab is hidden).
- Full-screen **numbered index** overlay (`Index ↗`, Esc to close).
- **Work** with local company logos, **Projects** with metric callouts,
  **Awards**, **Education**, **About** with a cursor-following-eyes gadget.
- A small **reflex mini-game** (`Play`) with a `localStorage` high score.

## Structure

```
index.html      # all sections
styles.css      # theme + layout
main.js         # preloader, background, index overlay, logos, eyes, game
assets/         # profile photo, company logos, gifs
.nojekyll       # serve as static files (skip GitHub's Jekyll build)
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

Pushing to `main` publishes automatically — GitHub Pages serves a
`<username>.github.io` repo from the branch root. Live ~1 minute after a push.

## Credits

Design and code are my own. Company logos are trademarks of their respective
owners, used here only to reference where I've worked/studied.
