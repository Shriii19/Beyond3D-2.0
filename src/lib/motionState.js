// Shared, mutable motion values. Written by the scroll/pointer handlers and
// read every frame by the WebGL scene, so nothing here triggers a React render.
export const motionState = {
  pointer: { x: 0, y: 0, active: false },
  progress: 0, // whole page, 0 → 1
  dive: 0, // hero zoom-through, 0 → 1
  rail: 0, // horizontal work rail, 0 → 1
  morph: 4, // galaxy form stays as the permanent background
  slide: 0, // pager stop: 0 is the hero
  body: -1, // index into data/planets.js of the body on screen (-1 none)
  warp: 0, // light-speed jump between bodies, 0 → 1
  intro: 0, // galaxy formation on first reveal, 0 → 1
  dragX: 0,
  dragY: 0,
};

let lenisInstance = null;

export function setLenis(instance) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
