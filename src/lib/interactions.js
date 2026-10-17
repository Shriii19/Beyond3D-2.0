import gsap from 'gsap';
import { motionState } from './motionState.js';

// Cursor, magnetic buttons and tilting project cards. Returns a cleanup function.
export function initInteractions(root) {
  const listeners = [];
  const on = (el, type, fn, options) => {
    el.addEventListener(type, fn, options);
    listeners.push(() => el.removeEventListener(type, fn, options));
  };

  const ctx = gsap.context(() => {
    const cursor = root.querySelector('.custom-cursor');
    const dot = cursor?.querySelector('.cursor-dot');
    const ring = cursor?.querySelector('.cursor-ring');
    const label = cursor?.querySelector('.cursor-label');
    const dotX = dot && gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = dot && gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = ring && gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
    const ringY = ring && gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

    on(window, 'pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      motionState.pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      motionState.pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      motionState.pointer.active = true;
      if (dotX) { dotX(event.clientX); dotY(event.clientY); ringX(event.clientX); ringY(event.clientY); }
      cursor?.classList.add('is-visible');
    }, { passive: true });
    on(document, 'pointerleave', () => {
      motionState.pointer.active = false;
      cursor?.classList.remove('is-visible');
    });
    on(document, 'pointerover', (event) => {
      const target = event.target.closest?.('a, button, [data-cursor]');
      cursor?.classList.toggle('is-hover', Boolean(target));
      const text = target?.closest('[data-cursor]')?.dataset.cursor ?? '';
      cursor?.classList.toggle('has-label', Boolean(text));
      if (label) label.textContent = text;
    });
    on(window, 'pointerdown', () => cursor?.classList.add('is-down'));
    on(window, 'pointerup', () => cursor?.classList.remove('is-down'));

    gsap.utils.toArray('.magnetic', root).forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      on(el, 'pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        x((event.clientX - (rect.left + rect.width / 2)) * 0.38);
        y((event.clientY - (rect.top + rect.height / 2)) * 0.38);
      });
      on(el, 'pointerleave', () => { x(0); y(0); });
    });

    gsap.utils.toArray('.project-visual', root).forEach((el) => {
      gsap.set(el, { transformPerspective: 900 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      on(el, 'pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        ry((px - 0.5) * 14);
        rx((0.5 - py) * 12);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
      on(el, 'pointerleave', () => { rx(0); ry(0); });
    });
  }, root);

  return () => {
    listeners.forEach((off) => off());
    ctx.revert();
  };
}
