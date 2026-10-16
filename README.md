# Shree — Cinematic Creative Developer Portfolio

A responsive React/Vite portfolio starter inspired by the immersive storytelling, minimal navigation, dark WebGL atmosphere, and editorial project presentation of Active Theory. It uses original procedural scene geometry and CSS project artwork rather than copied site code or proprietary images.

## Features

- Procedural 3D particle torus, orbital linework, subtle wireframe core, and ambient particles using Three.js + React Three Fiber.
- Pointer-responsive scene with motion kept behind the content.
- Full-screen animated navigation with keyboard Escape support.
- Scroll progress indicator, GSAP ScrollTrigger heading reveals, Framer Motion entrances, and a moving ticker.
- Four original CSS project-art panels; swap their content in `src/data/projects.js`.
- Responsive layouts for large desktop, tablet, and mobile.
- Reduced-motion support and a CSS fallback for the scene.

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
- Procedural Three.js scene: `src/components/ParticleScene.jsx`
- Project artwork and card markup: `src/components/ProjectCard.jsx`
- Visual styling and responsive breakpoints: `src/styles.css`
- Theme tokens and Tailwind configuration: `tailwind.config.js`

## Before publishing

Replace the sample email, social URLs, project descriptions, and project links with your real details. The project cards currently route to the contact section as a demo. This is a portfolio starter inspired by a public design reference, not an official Active Theory website or a pixel-perfect reproduction of its private implementation.
