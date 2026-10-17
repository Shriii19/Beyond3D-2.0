# Shree — Cinematic Creative Developer Portfolio

A responsive React/Vite portfolio starter inspired by the immersive storytelling, minimal navigation, dark WebGL atmosphere, and editorial project presentation of Active Theory. It uses original procedural scene geometry and CSS project artwork rather than copied site code or proprietary images.

## Features

- One persistent full-screen WebGL scene (Three.js + React Three Fiber + custom GLSL): 15k particles morph between a torus, a wave field, a ringed planet, a double helix and a spiral galaxy as you move through the sections, with simplex-noise flow, mouse repulsion, warp-speed star streaks, bloom and chromatic aberration.
- Scroll-driven slide and zoom transitions instead of plain scrolling: the hero headline zooms past the camera as it dives through the torus, work slides horizontally as a 3D cover-flow, About opens like an expanding portal, Capabilities and Contact slide over the pinned previous section while it sinks back, and Contact zooms in from beyond the screen.
- Lenis smooth scrolling synced with GSAP ScrollTrigger; SplitText character and word reveals; velocity-based skew.
- Preloader counter, custom cursor with labels, magnetic buttons, tilt + glare on project cards, section HUD, hide-on-scroll header.
- Responsive layouts and a static fallback for `prefers-reduced-motion`.

## Run locally

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints a local URL after startup. To create a production build:

```bash
npm run build
npm run preview
```

## Customize

- Main content and sections: `src/App.jsx`
- Project entries: `src/data/projects.js`
- 3D scene, particle shapes and shaders: `src/components/Experience.jsx`
- Scroll choreography: `src/lib/scrollAnimations.js`
- Cursor, magnetic and tilt interactions: `src/lib/interactions.js`
- Project artwork and card markup: `src/components/ProjectCard.jsx`
- Visual styling and responsive breakpoints: `src/styles.css`
- Theme tokens and Tailwind configuration: `tailwind.config.js`

## Before publishing

Replace the sample email, social URLs, project descriptions, and project links with your real details. The project cards currently route to the contact section as a demo. This is a portfolio starter inspired by a public design reference, not an official Active Theory website or a pixel-perfect reproduction of its private implementation.
