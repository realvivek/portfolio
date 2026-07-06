# CLAUDE.md — portfolio

> One-line description: Vivek Yalamanchili's portfolio / informal resume — a landing
> page that indexes every deployed project with live links.

## Tech Stack
- Static HTML/CSS/JS, no build step, no dependencies. Google Fonts (Archivo, IBM Plex Mono).
- Hosting: Render Static Site (publish path `.`), auto-deploys from `main`.

## Commands
- Install: none (no dependencies)
- Run locally: open `index.html`, or `npx serve .`
- Test: none — verification is visual (see Workflow)
- Lint/syntax: `node --check assets/app.js`
- Build: none (static site)

## Workflow
- **Solo project.** Single developer (realvivek). No reviewers.
- **Push directly to `main`.** No pull request required.
- Keep `main` deployable at all times — every push to `main` auto-deploys to Render.
- **YOU MUST verify before pushing:** `node --check assets/app.js` passes, and the page
  renders correctly at desktop and 375px-wide viewports. Do not push on a red check.

## Commit Messages
- Use **Conventional Commits**: `type(scope): summary`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`
- Example: `feat(systems): add project card for new deployment`
- **IMPORTANT: Never mention Claude, AI, or assistant tooling** in commit messages,
  co-author trailers, code comments, PRs, or docs. No session links. Ever.

## Secrets — Never Commit
- **IMPORTANT: Never commit API keys, tokens, or credentials.**
- **Never commit `.env` files** (any `.env.*`). `.env` MUST be in `.gitignore`.
- Set secrets as environment variables in the Render dashboard, never in code.
- If a secret is ever committed, treat it as compromised and rotate it immediately.

## Deployment (Render)
- One repo = one Render service. Push to `main` → Render auto-deploys (no manual step).
- After a deploy, confirm status via the Render API before calling it live.

## Adding a Project
- Append one object to the `PROJECTS` array in `assets/app.js`
  (`id`, `name`, `desc`, `tags`, `url`, `source`, `status`). Nothing else to touch.
- A project isn't "done" until it's live on Render and its card is on this page.

## Positioning (content decisions)
- Owner: Vivek Yalamanchili — Principal Engineer, private 5G / cellular & edge AI;
  expert in smart city infrastructure. The site is a portfolio of passion projects.
- NEVER use the words "shipped" or "deployed" in page copy (owner's rule).
- Tone: senior but informal; technical credibility over marketing polish.
- Design language (REV B, current): editorial data-storytelling, after Zajno's
  "AI Progress" study — paper (#E8E8E4) and slate (#151D27) full-screen chapters with
  film grain, lowercase Instrument Serif titles over letterspaced mono eyebrows, boxed
  mono chip labels and pill buttons, corner bracket annotations, one centered
  visualization per chapter, enormous whitespace. Desaturated only — no hot accents,
  no gradients-on-dark, no glassmorphism. Keep new elements in this language.
- History: REV A (engineering datasheet) and REV C (Wealthsimple warm editorial with
  stock photos) were both rejected by the owner; REV B is the approved baseline.
  Iterate on REV B — do not resurrect A or C without being asked.
- If stock imagery is ever reintroduced: visually verify every image before use, give
  every `img` a real `alt`, and set a background fallback color in case the CDN fails.
