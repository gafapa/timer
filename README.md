# TempoLab

TempoLab is a browser-based timer app built with React, Vite, and Mantine. It lets users create reusable timer presets, store them locally, and launch a presentation-friendly timer view for classrooms, workshops, and focused work sessions.

## Features

- Create and edit timers with a name, duration, color, visual style, and finish sound.
- Save timer presets in browser `localStorage`.
- Launch timers in a large display mode.
- Choose between four visual variants:
  - digital clock
  - hourglass
  - energy bar
  - numeric cards
- Preview finish sounds before saving a preset.
- Loop the finish alarm until it is silenced.
- Pause an active timer automatically when leaving display mode.
- Normalize persisted timer data on load to avoid stale or invalid saved state.

## Tech Stack

- React 19
- Vite
- Mantine
- Tabler Icons

## Requirements

- Node.js 18 or newer
- npm

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

The app usually starts at [http://localhost:5173](http://localhost:5173).

## Production Build

```bash
npm run build
```

## Production Preview

```bash
npm run preview
```

## Project Structure

```text
src/
  App.jsx
  main.jsx
  styles.css
index.html
vite.config.js
```

## Notes

- Timer presets are stored locally in the browser.
- `dist/` is generated during the build step.
- `node_modules/` is not tracked in the repository.
