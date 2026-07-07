# CLAUDE.md — portfolio

> Personal portfolio site for Vivek Yalamanchili — a single-page landing site
> indexing live projects.

## Stack
- Static HTML/CSS/JS, no build step, no dependencies.
- Fonts: Google Fonts (Instrument Serif, Inter, IBM Plex Mono).
- Hosting: Render static site. Pushes to `main` deploy automatically.
- Live at: https://portfolio-1jet.onrender.com

## Commands
- Run locally: `npx serve .` (or open `index.html` directly)
- Syntax check: `node --check assets/app.js`
- No build, no tests — verification is visual.

## Conventions
- Solo project. Commit directly to `main` using Conventional Commits
  (`type(scope): summary`, e.g. `feat(systems): add project card`).
- No co-author trailers, tool attributions, or session links in commit
  messages or PRs.
- Verify before pushing: the syntax check passes and the page renders
  correctly at desktop and 375px-wide viewports.
- Never commit secrets or `.env` files. Environment config belongs in the
  Render dashboard.

## Structure
- `index.html` — the whole page, organized as full-screen chapter sections
- `assets/style.css` — all styles
- `assets/app.js` — all data and behavior

## Editing recipes
- **Add a project card**: append one object to the `PROJECTS` array in
  `assets/app.js` (`index`, `name`, `desc`, `tags`, `url`, `source`).
- **Edit the interactive city**: node copy lives in the `CITY` object in
  `assets/app.js`; node positions are in the SVG in `index.html`.
- **Enable the contact link**: set `CONFIG.linkedin` in `assets/app.js`.

## Copy & design notes
- Titles: lowercase, serif. Labels/eyebrows: mono, uppercase, letterspaced.
- Palette: paper (#E8E8E4) and slate (#151D27) only — desaturated, no hot
  accent colors, no gradients-on-dark.
- Keep page copy free of the words "shipped" and "deployed".
- Content must remain readable if JavaScript fails: keep the reveal-animation
  failsafe and `noscript` fallbacks intact.
