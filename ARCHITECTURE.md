# Architecture

## Overview

TempoLab is a client-side React application built with Vite and Mantine. The app lets users create timer presets, store them in the browser, and run a selected timer in a presentation-focused display mode.

## Runtime Model

- `src/main.jsx` bootstraps React and wraps the app with `MantineProvider`.
- `src/App.jsx` contains the current application state, timer engine, local persistence, audio playback logic, and all UI rendering.
- `src/i18n.js` centralizes supported languages, translated copy, browser language detection, and translation lookup.
- `src/styles.css` defines the visual system for setup mode, saved timer cards, and the full-screen timer stage variants.
- `public/manifest.webmanifest` defines install metadata, icons, colors, and standalone launch behavior.
- `public/sw.js` provides service worker registration targets for installability and runtime caching.

## State And Data Flow

- Timer presets are stored in `localStorage` under `tempo-lab-timers-v2`.
- The selected UI language is stored in `localStorage` under `tempo-lab-language`.
- On startup, persisted timers are loaded and normalized before being rendered.
- The active timer is derived from the current draft plus the selected preset id.
- Countdown execution is driven by `setInterval`, using `endAt` plus `remainingMs` to support start, pause, resume, reset, and finish states.
- Leaving display mode pauses an in-progress timer so setup mode reflects the current countdown state instead of hiding a running timer.
- Changing the UI language updates the document `lang`, title, and description metadata.
- In production, the client registers `/sw.js` after page load to enable installation and runtime caching.

## Timer Presentation

The timer stage supports four visual variants:

- `digital`
- `hourglass`
- `energy`
- `cards`

The active accent color is written to a CSS custom property and reused across the display components.

## Audio

- Finish sounds are synthesized with the Web Audio API.
- Sound playback can be previewed from setup mode.
- Alarm playback loops until the user silences it or leaves display mode.

## PWA Behavior

- The web manifest enables standalone installation on supported browsers.
- The service worker precaches the app shell and caches same-origin runtime assets after the first load.
- Navigation requests use a network-first strategy with cached fallback so an installed app can reopen offline.

## File Map

```text
index.html
vite.config.js
src/
  App.jsx
  i18n.js
  main.jsx
  styles.css
public/
  manifest.webmanifest
  sw.js
  icons/
    icon-192.png
    icon-512.png
```
