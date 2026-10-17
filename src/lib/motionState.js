// Shared, mutable motion values. Written by the scroll/pointer handlers and
// read every frame by the WebGL scene, so nothing here triggers a React render.
export const motionState = {
  pointer: { x: 0, y: 0, active: false },
  progress: 0, // whole page, 0 → 1
  dive: 0, // hero zoom-through, 0 → 1
  rail: 0, // horizontal work rail, 0 → 1
  morph: 0, // section blend: 0 hero, 1 work, 2 about, 3 capabilities, 4 contact
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
