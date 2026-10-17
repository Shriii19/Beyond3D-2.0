import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { getLenis, motionState } from './motionState.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const clamp = gsap.utils.clamp;

function heroIntro() {
  const title = SplitText.create('.hero h1', { type: 'words,chars', tag: 'span', charsClass: 'char', wordsClass: 'split-word' });
  gsap.timeline({ delay: 0.1 })
    .from(title.chars, {
      yPercent: 120, rotateX: -95, opacity: 0, filter: 'blur(10px)', transformPerspective: 700, transformOrigin: '50% 100%',
      duration: 1.4, ease: 'expo.out', stagger: 0.04,
    })
    .from('.hero-kicker', { opacity: 0, y: 16, letterSpacing: '0.6em', duration: 1.1, ease: 'expo.out' }, 0.25)
    .from('.hero-description', { opacity: 0, y: 20, duration: 1, ease: 'expo.out' }, 0.55)
    .from('.hero-cta', { opacity: 0, y: 20, duration: 1, ease: 'expo.out' }, 0.7)
    .from('.hero-frame > *, .hero-bottom > *', { opacity: 0, duration: 1.2, stagger: 0.08 }, 0.6)
    .from('.site-header > *, .section-hud', { opacity: 0, y: -20, duration: 1, ease: 'expo.out', stagger: 0.1 }, 0.4);
}

// Scroll the hero and the headline flies past the camera while the 3D camera dives into the torus.
function heroZoom() {
  gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=130%',
      pin: true,
      scrub: 1,
      onUpdate: (self) => { motionState.dive = self.progress; },
    },
  })
    .to('.hero-title-wrap', { scale: 7, opacity: 0, ease: 'power2.in', duration: 1 }, 0)
    .to('.hero-kicker-wrap', { y: -90, opacity: 0, ease: 'power1.in', duration: 0.45 }, 0)
    .to('.hero-copy', { y: 90, opacity: 0, ease: 'power1.in', duration: 0.45 }, 0)
    .to('.hero-frame, .hero-bottom', { opacity: 0, duration: 0.3 }, 0)
    .to('.hero-grid', { scale: 1.8, opacity: 0, ease: 'power1.in', duration: 1 }, 0)
    .to('.hero-glow', { scale: 2.6, opacity: 0, duration: 1 }, 0);
}

function splitHeadings() {
  gsap.utils.toArray('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words,chars', tag: 'span', charsClass: 'char', wordsClass: 'split-word' });
    gsap.from(split.chars, {
      yPercent: 110, rotateX: -85, opacity: 0, transformPerspective: 650, transformOrigin: '50% 100%',
      duration: 1.15, ease: 'expo.out', stagger: 0.022,
      scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
    });
  });
  gsap.utils.toArray('.reveal-up').forEach((el) => {
    gsap.from(el, {
      y: 46, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  });
}

// Pinned horizontal slider with a 3D cover-flow: cards turn toward the centre as they pass it.
function workRail() {
  const rail = document.querySelector('.work-rail');
  if (!rail) return;
  const track = rail.querySelector('.work-track');
  const panels = gsap.utils.toArray(track.children);
  const counter = rail.querySelector('.rail-count b');
  const bar = rail.querySelector('.rail-bar i');
  const projectCount = rail.querySelectorAll('.project-card').length;
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const coverflow = () => {
    const vw = window.innerWidth;
    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const d = clamp(-1.6, 1.6, (rect.left + rect.width / 2 - vw / 2) / (vw * 0.62));
      const a = Math.min(Math.abs(d), 1);
      gsap.set(panel, { rotateY: d * -26, z: -a * 180, scale: 1 - a * 0.08, opacity: 1 - Math.min(Math.abs(d), 1.6) * 0.3, transformPerspective: 1500 });
      const art = panel.querySelector('.artwork');
      if (art) gsap.set(art, { xPercent: d * -9 });
    });
  };

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    onUpdate: coverflow,
    scrollTrigger: {
      trigger: rail,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: coverflow,
      onUpdate: (self) => {
        motionState.rail = self.progress;
        bar.style.transform = `scaleX(${self.progress})`;
        counter.textContent = String(Math.min(projectCount, Math.floor(self.progress * projectCount) + 1)).padStart(2, '0');
      },
    },
  });
  coverflow();
}

// About opens like a portal: a framed window expands to fill the screen while its content zooms out.
function aboutPortal() {
  const trigger = { trigger: '.about-section', start: 'top bottom', end: 'top 12%', scrub: true };
  gsap.fromTo('.about-panel',
    { clipPath: 'inset(16% 14% 16% 14% round 32px)' },
    { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: trigger });
  gsap.fromTo('.about-layout', { scale: 1.22, yPercent: 8 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { ...trigger } });
  gsap.fromTo('.about-orbit', { rotate: -60, scale: 0.6 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.about-section', start: 'top bottom', end: 'bottom top', scrub: true } });

  const statement = document.querySelector('.about-right h2');
  if (statement) {
    const words = SplitText.create(statement, { type: 'words', tag: 'span', wordsClass: 'word' }).words;
    gsap.fromTo(words, { opacity: 0.1 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 42%', scrub: true },
    });
  }

  gsap.utils.toArray('[data-count]').forEach((el) => {
    const value = { n: 0 };
    gsap.to(value, {
      n: Number(el.dataset.count), duration: 1.8, ease: 'power3.out',
      onUpdate: () => { el.firstChild.textContent = String(Math.round(value.n)).padStart(2, '0'); },
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  });
  gsap.from('.values-list span', {
    y: 30, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'expo.out',
    scrollTrigger: { trigger: '.values-list', start: 'top 92%', toggleActions: 'play none none reverse' },
  });
}

// Stacked sections: the current one stays pinned and sinks back while the next slides over it.
function stackSections() {
  const pairs = gsap.utils.toArray('.stack-section').map((section) => [section, section.nextElementSibling]);
  pairs.forEach(([section, next]) => {
    if (!next) return;
    const inner = section.querySelector('.stack-inner');
    const tall = () => section.offsetHeight > window.innerHeight;
    ScrollTrigger.create({
      trigger: section,
      start: () => (tall() ? 'bottom bottom' : 'top top'),
      endTrigger: next,
      end: 'top top',
      pin: true,
      pinSpacing: false,
    });
    gsap.to(inner, {
      scale: 0.84,
      rotateX: 8,
      transformPerspective: 1600,
      transformOrigin: () => `50% ${Math.max(section.offsetHeight - window.innerHeight / 2, section.offsetHeight / 2)}px`,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
    });
    // Fade out well before the incoming section's text reaches it.
    gsap.to(inner, {
      opacity: 0,
      ease: 'power1.in',
      scrollTrigger: { trigger: next, start: 'top 95%', end: 'top 45%', scrub: true },
    });
  });
}

function capabilities() {
  gsap.from('.capability-row', {
    xPercent: 22, opacity: 0, rotateY: -18, transformPerspective: 1100, transformOrigin: '0% 50%',
    stagger: 0.16, ease: 'power2.out',
    scrollTrigger: { trigger: '.capability-list', start: 'top 92%', end: 'bottom 72%', scrub: 1 },
  });
}

// Contact zooms in from beyond the screen as the particles settle into a galaxy.
function contactZoom() {
  const trigger = { trigger: '.contact-section', start: 'top 95%', end: 'top 8%', scrub: 1 };
  gsap.fromTo('.contact-zoom', { scale: 2.8, opacity: 0, filter: 'blur(16px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', scrollTrigger: trigger });
  gsap.fromTo('.contact-aura', { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { ...trigger } });
  gsap.from('.contact-after > *', {
    y: 40, opacity: 0, stagger: 0.12, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.contact-after', start: 'top 92%', toggleActions: 'play none none reverse' },
  });
}

// Fast scrolling bends moving things a little, like motion blur.
function velocitySkew() {
  const targets = gsap.utils.toArray('.ticker, .project-visual');
  const setters = targets.map((el) => gsap.quickTo(el, 'skewX', { duration: 0.6, ease: 'power3' }));
  let last = 0;
  const tick = () => {
    const skew = clamp(-9, 9, -(getLenis()?.velocity ?? 0) * 0.22);
    if (Math.abs(skew - last) < 0.01) return;
    last = skew;
    setters.forEach((set) => set(skew));
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}

export function initScrollAnimations(scope) {
  const mm = gsap.matchMedia(scope);
  // Reduced-motion visitors get the plain, static page.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    heroIntro();
    heroZoom();
    splitHeadings();
    workRail();
    aboutPortal();
    stackSections();
    capabilities();
    contactZoom();
    const stopSkew = velocitySkew();
    ScrollTrigger.refresh();
    return stopSkew;
  });
  return () => mm.revert();
}
