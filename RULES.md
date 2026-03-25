# Rules

## Development Rules

- Keep source code, comments, and commit messages in English.
- Update Markdown documentation whenever behavior, architecture, or project workflow changes.
- Preserve compatibility with the current stack: React, Vite, Mantine, and Tabler Icons.
- Prefer browser-safe APIs because the application is fully client-side.
- Route every user-facing string through the translation layer instead of hardcoding copy in components.
- Review translated copy for spelling, accents, and consistency before shipping.

## Data Rules

- Persist timer presets only through the browser `localStorage` layer.
- Normalize stored timer data before rendering it.
- Treat saved presets as templates and keep transient runtime state in React state.

## UX Rules

- Setup mode must accurately reflect the current timer state.
- Display mode must remain usable on desktop and mobile layouts.
- Controls must remain keyboard accessible and icon-only actions must keep explicit labels.

## Repository Rules

- Keep `README.md`, `ARCHITECTURE.md`, and `RULES.md` aligned with the implementation.
- Do not commit generated output such as `dist/` or `node_modules/`.
