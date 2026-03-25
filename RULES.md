# Rules

## Development Rules

- Keep source code, comments, and commit messages in English.
- Update Markdown documentation whenever behavior, architecture, or project workflow changes.
- Preserve compatibility with the current stack: React, Vite, Mantine, and Tabler Icons.
- Prefer browser-safe APIs because the application is fully client-side.
- Route every user-facing string through the translation layer instead of hardcoding copy in components.
- Review translated copy for spelling, accents, and consistency before shipping.
- Keep PWA metadata, icons, and service worker behavior aligned with the actual installable app experience.

## Data Rules

- Persist timer presets only through the browser `localStorage` layer.
- Normalize stored timer data before rendering it.
- Treat saved presets as templates and keep transient runtime state in React state.
- Version cache names when changing service worker caching behavior so stale assets can be retired safely.

## UX Rules

- Setup mode must accurately reflect the current timer state.
- Display mode must remain usable on desktop and mobile layouts.
- Controls must remain keyboard accessible and icon-only actions must keep explicit labels.
- Keep global header controls aligned with the title row and anchored to the top-right area on wide screens unless mobile constraints require stacking.

## Repository Rules

- Keep `README.md`, `ARCHITECTURE.md`, and `RULES.md` aligned with the implementation.
- Do not commit generated output such as `dist/` or `node_modules/`.
