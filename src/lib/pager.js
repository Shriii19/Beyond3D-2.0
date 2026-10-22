import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { motionState, prefersReducedMotion } from './motionState.js';

gsap.registerPlugin(SplitText);

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/*+<>';

// Decode-style text swap: letters resolve left to right through random glyphs.
function scrambleTo(el, text, duration = 1) {
  const from = el.textContent;
  const length = Math.max(from.length, text.length);
  const state = { p: 0 };
  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'none',
    onUpdate: () => {
      const done = state.p * length;
      let out = '';
      for (let i = 0; i < length; i += 1) {
        if (i < done) out += text[i] ?? '';
        else if (i < done + 5) out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        else out += from[i] ?? '';
      }
      el.textContent = out;
    },
  });
}

// Runs inside a gsap.context; the returned function cleans up the timers on revert.
export function heroIntro() {
  if (prefersReducedMotion()) {
    motionState.intro = 1;
    return undefined;
  }

  const title = SplitText.create('.hero h1', { type: 'words,chars', tag: 'span', charsClass: 'char', wordsClass: 'split-word' });
  const outlineChars = title.chars.filter((c) => c.closest('em'));
  const solidChars = title.chars.filter((c) => !c.closest('em'));

  // The galaxy is born behind the title while the camera sweeps down to it.
  gsap.fromTo(motionState, { intro: 0 }, { intro: 1, duration: 5, ease: 'power2.out' });

  gsap.timeline({ delay: 0.1 })
    .from('.hero-orbits', { scale: 0.35, opacity: 0, rotate: -40, duration: 3, ease: 'expo.out' }, 0.4)
    .from(title.chars, {
      yPercent: 120, rotateX: -95, opacity: 0, filter: 'blur(10px)', transformPerspective: 700, transformOrigin: '50% 100%',
      duration: 1.4, ease: 'expo.out', stagger: 0.04,
    }, 0.9)
    .from('.hero-kicker', { opacity: 0, y: 16, letterSpacing: '0.6em', duration: 1.1, ease: 'expo.out' }, 1.1)
    .from('.hero-description', { opacity: 0, y: 20, duration: 1, ease: 'expo.out' }, 1.5)
    .from('.hero-cta', { opacity: 0, y: 20, duration: 1, ease: 'expo.out' }, 1.65)
    .from('.hero-frame > *, .hero-bottom > *', { opacity: 0, duration: 1.2, stagger: 0.08 }, 1.6)
    .from('.hero-telemetry > *', { opacity: 0, x: -14, duration: 1, ease: 'expo.out', stagger: 0.08 }, 1.8)
    .from('.site-header > *, .section-hud', { opacity: 0, y: -20, duration: 1, ease: 'expo.out', stagger: 0.1 }, 1.2);

  // Living title: the solid line floats, a light wave runs through the outlined line.
  gsap.to(solidChars, {
    y: -7, duration: 1.8, ease: 'sine.inOut', delay: 2.6,
    stagger: { each: 0.12, repeat: -1, yoyo: true },
  });
  gsap.to(outlineChars, {
    color: 'rgba(155, 222, 255, 0.3)', textShadow: '0 0 24px rgba(155, 222, 255, 0.85)',
    duration: 0.6, ease: 'sine.inOut', delay: 3,
    stagger: { each: 0.07, repeat: -1, yoyo: true, repeatDelay: 2.2 },
  });

  const glow = document.querySelector('.hero-glow');
  if (glow) gsap.to(glow, { scale: 1.15, opacity: 0.7, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true });

  // Telemetry: star counter, a ticking right-ascension clock and cycling kicker phrases.
  const starsEl = document.querySelector('[data-stars]');
  if (starsEl) {
    const stars = { n: 0 };
    gsap.to(stars, {
      n: window.innerWidth < 768 ? 9000 : 24000, duration: 4, ease: 'power3.out', delay: 1.6,
      onUpdate: () => { starsEl.textContent = Math.round(stars.n).toLocaleString('en-US'); },
    });
  }
  const raEl = document.querySelector('[data-ra]');
  let seconds = 5 * 3600 + 35 * 60 + 17;
  const clock = window.setInterval(() => {
    seconds += 1;
    if (!raEl) return;
    const h = String(Math.floor(seconds / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    raEl.textContent = `${h}h ${m}m ${s}s`;
  }, 1000);

  const kicker = document.querySelector('.kicker-text');
  const phrases = kicker?.dataset.phrases.split('|') ?? [];
  let phrase = 0;
  const cycle = window.setInterval(() => {
    if (!kicker || phrases.length < 2) return;
    phrase = (phrase + 1) % phrases.length;
    scrambleTo(kicker, phrases[phrase]);
  }, 4200);

  return () => {
    window.clearInterval(clock);
    window.clearInterval(cycle);
    if (kicker && phrases[0]) kicker.textContent = phrases[0];
  };
}

// The light-speed flash that plays as the camera jumps between worlds.
export function lightJump(flash) {
  if (!flash || prefersReducedMotion()) return;
  gsap.timeline()
    .fromTo(flash, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.in', delay: 0.2 })
    .to(flash, { opacity: 0, scale: 1.5, duration: 1.1, ease: 'power2.out' });
}

const CONTENT = {
  hero: '.hero-orbits, .hero-center, .hero-frame, .hero-telemetry, .hero-bottom',
  planet: '.planet-ghost, .planet-top, .planet-name, .planet-tagline, .planet-desc, .planet-stats > div, .planet-fact, .callout',
  contact: '.contact-content > *, .site-footer',
};
const contentOf = (slide) => {
  if (slide.classList.contains('hero')) return slide.querySelectorAll(CONTENT.hero);
  if (slide.classList.contains('planet-slide')) return slide.querySelectorAll(CONTENT.planet);
  return slide.querySelectorAll(CONTENT.contact);
};

// Swap two stops in place. The old content drifts away in the direction of travel,
// the stops swap while the planet is in flight, and the new content lands after it.
// `onDone` fires once the move has really finished, however long the frames took.
export function transitionSlides(from, to, dir, onDone) {
  const reduced = prefersReducedMotion();
  const out = contentOf(from);
  const leaving = from.classList.contains('hero')
    ? { scale: dir > 0 ? 1.25 : 0.85, opacity: 0, filter: 'blur(10px)' }
    : { y: -60 * dir, opacity: 0, filter: 'blur(8px)' };

  gsap.killTweensOf(contentOf(to));
  gsap.timeline()
    .to(out, { ...leaving, duration: reduced ? 0 : 0.45, ease: 'power2.in', stagger: 0.02, overwrite: 'auto' })
    .add(() => {
      [...to.parentElement.children].forEach((slide) => slide.classList.toggle('is-active', slide === to));
      gsap.set(out, { clearProps: 'transform,opacity,filter' });
      from.scrollTop = 0;
      animateSlideIn(to, dir, reduced ? 0 : 0.5);
    })
    .add(() => onDone?.(), reduced ? '+=0.1' : '+=0.9');
}

// A stop's content arrives once the new planet has landed: the name decodes in,
// copy rises from the direction of travel, and the stats count up from zero.
export function animateSlideIn(slide, dir = 1, delay = 0) {
  const reduced = prefersReducedMotion();
  const d = (seconds) => (reduced ? 0 : seconds);

  if (slide.classList.contains('hero')) {
    gsap.fromTo(contentOf(slide), { scale: dir > 0 ? 0.85 : 1.2, opacity: 0, filter: 'blur(10px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: d(1.1), delay, ease: 'expo.out', stagger: 0.05, overwrite: 'auto' });
    return;
  }

  const name = slide.querySelector('.planet-name');
  if (name) {
    if (!name.dataset.split) {
      SplitText.create(name, { type: 'chars', tag: 'span', charsClass: 'char' });
      name.dataset.split = '1';
    }
    gsap.fromTo(name.querySelectorAll('.char'),
      { yPercent: 110 * dir, rotateX: -90 * dir, opacity: 0, filter: 'blur(8px)' },
      { yPercent: 0, rotateX: 0, opacity: 1, filter: 'blur(0px)', transformPerspective: 700, transformOrigin: '50% 100%', duration: d(1.1), ease: 'expo.out', stagger: 0.045, delay, overwrite: 'auto' });
  }

  const items = [...contentOf(slide)].filter((el) => el !== name);
  gsap.fromTo(items, { y: 50 * dir, opacity: 0, filter: 'blur(6px)' },
    { y: 0, opacity: 1, filter: 'blur(0px)', duration: d(1), ease: 'expo.out', stagger: 0.05, delay: delay + d(0.1), overwrite: 'auto' });

  slide.querySelectorAll('[data-num]').forEach((el) => {
    const target = Number(el.dataset.num);
    const decimals = Number(el.dataset.decimals);
    const value = { n: 0 };
    gsap.to(value, {
      n: target,
      duration: d(1.6),
      delay: delay + d(0.35),
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = value.n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      },
    });
  });
}
