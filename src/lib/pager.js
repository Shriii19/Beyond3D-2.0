import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export function heroIntro() {
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

// A slide's content eases in from the right as the pager brings it into view.
export function animateSlideIn(slide) {
  const items = slide.querySelectorAll('.eyebrow, h2, .work-intro-row, .project-card, .work-end-card, .about-aside, .about-stats > div, .about-right p, .values-list span, .capabilities-intro, .capability-row, .contact-after > *');
  gsap.fromTo(items, { x: 90, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.04, delay: 0.25, overwrite: 'auto' });
}
