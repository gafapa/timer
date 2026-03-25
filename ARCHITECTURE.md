# Architecture

## Overview

TempoLab is a client-side React application built with Vite and Mantine. The app lets users create timer presets, store them in the browser, and run a selected timer in a presentation-focused display mode.

## Runtime Model

- `src/main.jsx` bootstraps React and wraps the app with `MantineProvider`.
- `src/App.jsx` contains the current application state, timer engine, local persistence, audio playback logic, and all UI rendering.
- `src/styles.css` defines the visual system for setup mode, saved timer cards, and the full-screen timer stage variants.

## State And Data Flow

- Timer presets are stored in `localStorage` under `tempo-lab-timers-v2`.
- On startup, persisted timers are loaded and normalized before being rendered.
- The active timer is derived from the current draft plus the selected preset id.
- Countdown execution is driven by `setInterval`, using `endAt` plus `remainingMs` to support start, pause, resume, reset, and finish states.
- Leaving display mode pauses an in-progress timer so setup mode reflects the current countdown state instead of hiding a running timer.

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

## File Map

```text
index.html
vite.config.js
src/
  App.jsx
  main.jsx
  styles.css
```
