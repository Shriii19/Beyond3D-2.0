# Beyond3D — Solar System Explorer

An interactive solar-system field guide built with React, Vite, Three.js, and React Three Fiber. The experience pairs procedural 3D celestial bodies with an editorial interface for exploring the Sun, eight planets, and the Moon.

## Features

- Full-screen procedural 3D scene with custom planetary shaders, moons, Saturn's rings, a galaxy backdrop, and animated star trails.
- Selectable body list with descriptions, facts, and key measurements.
- Playback, rotation, camera-orbit, orbit-path, speed, and reset controls.
- Keyboard navigation: arrow keys to change bodies, Space to pause or play, 1–0 to select a body, S for display settings, and H for shortcuts.
- Responsive layouts for desktop and mobile.

## Run locally

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

## Customize

- Body facts and measurements: `src/data/planets.js`
- Planet appearance and procedural 3D scene: `src/components/SolarSystem.jsx` and `src/components/Experience.jsx`
- Explorer interface: `src/components/SolarSystemExplorer.jsx`
- Visual styling: `src/styles.css`
