import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import Experience from './components/Experience.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import { projects } from './data/projects.js';
import { motionState } from './lib/motionState.js';
import { animateSlideIn, heroIntro } from './lib/pager.js';
import { initInteractions } from './lib/interactions.js';

const menuItems = [
  { number: '01', label: 'WORK', href: '#work' },
  { number: '02', label: 'ABOUT', href: '#about' },
  { number: '03', label: 'CAPABILITIES', href: '#capabilities' },
  { number: '04', label: 'CONTACT', href: '#contact' },
];

const hudItems = [
  { label: 'INTRO', href: '#top' },
  { label: 'WORK', href: '#work' },
  { label: 'ABOUT', href: '#about' },
  { label: 'CAPABILITIES', href: '#capabilities' },
  { label: 'CONTACT', href: '#contact' },
];

function Preloader({ onReveal }) {
  const ref = useRef(null);
  const countRef = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;
    let cancelled = false;
    const ctx = gsap.context(() => {
      const counter = { value: 0 };
      const tl = gsap.timeline({ paused: true })
        .to(counter, {
          value: 100, duration: 2.2, ease: 'power3.inOut',
          onUpdate: () => {
            if (countRef.current) countRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0');
          },
        })
        .to('.preloader-bar i', { scaleX: 1, duration: 2.2, ease: 'power3.inOut' }, 0)
        .to('.preloader-count, .preloader-meta', { yPercent: -120, opacity: 0, duration: 0.7, ease: 'expo.in', stagger: 0.06 })
        .add(onReveal)
        .to(ref.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' }, '-=0.15')
        .add(() => setGone(true));
      // Wait for the fonts so split-text measurements are right, but never hang on them.
      Promise.race([document.fonts?.ready, new Promise((resolve) => { setTimeout(resolve, 2500); })]).then(() => {
        if (!cancelled) tl.play();
      });
    }, ref);
    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [onReveal]);

  if (gone) return null;
  return (
    <div className="preloader" ref={ref} aria-hidden="true">
      <div className="preloader-inner">
        <div className="preloader-meta"><span>SHREE / CREATIVE DEVELOPER</span><span>PORTFOLIO — 2026</span></div>
        <div className="preloader-count"><span ref={countRef}>000</span><small>%</small></div>
        <div className="preloader-bar"><i /></div>
        <div className="preloader-meta"><span>CALIBRATING PARTICLES</span><span>PLEASE STAND BY</span></div>
      </div>
    </div>
  );
}

function Header({ menuOpen, setMenuOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" onClick={() => setMenuOpen(false)} aria-label="Shree, home">
        <span className="brand-mark">S<span>.</span></span>
        <span className="brand-copy"><b>SHREE</b><small>CREATIVE DEVELOPER</small></span>
      </a>
      <div className="header-right">
        <span className="availability"><i /> AVAILABLE FOR SELECT PROJECTS</span>
        <button className={`menu-trigger magnetic ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          <span>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          <span className="menu-icon">{menuOpen ? <X size={17} /> : <Menu size={17} />}</span>
        </button>
      </div>
    </header>
  );
}

function MenuOverlay({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.nav
          className="menu-overlay"
          initial={{ clipPath: 'circle(0% at 94% 5%)' }}
          animate={{ clipPath: 'circle(150% at 94% 5%)' }}
          exit={{ clipPath: 'circle(0% at 94% 5%)' }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
          aria-label="Main navigation"
        >
          <div className="menu-backdrop" />
          <div className="menu-content">
            <span className="eyebrow">NAVIGATION / 2026</span>
            {menuItems.map((item, index) => (
              <motion.a
                key={item.number}
                href={item.href}
                onClick={onClose}
                initial={{ opacity: 0, y: 60, rotateX: -60 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: 0.25 + index * 0.08, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="menu-item"
              >
                <span>{item.number}</span><strong>{item.label}</strong><ArrowUpRight size={25} strokeWidth={1.3} />
              </motion.a>
            ))}
            <div className="menu-footer"><span>PUNE, INDIA</span><a href="mailto:hello@shree.dev">HELLO@SHREE.DEV</a><span>© 2026</span></div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-center">
        <div className="hero-kicker-wrap">
          <p className="hero-kicker"><span className="kicker-line" /> INDEPENDENT DIGITAL CRAFT / 2026 <span className="kicker-line" /></p>
        </div>
        <div className="hero-title-wrap">
          <h1>MADE OF<br /><em>CODE &amp; FEELING.</em></h1>
        </div>
        <div className="hero-copy">
          <p className="hero-description">I build digital experiences where thoughtful engineering meets a little bit of wonder.</p>
          <a href="#work" className="outline-link hero-cta magnetic">
            <span>EXPLORE SELECTED WORK</span><ArrowDownRight size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
      <div className="hero-frame">
        <span className="hero-side hero-side-left">DESIGN / TECHNOLOGY / EXPERIENCE</span>
        <span className="hero-side hero-side-right">19°59' N — 73°47' E</span>
      </div>
      <div className="hero-bottom">
        <span>SCROLL TO DIVE IN</span>
        <span className="scroll-indicator"><span className="scroll-mouse"><i /></span><ArrowDown size={13} /></span>
        <span className="hero-index">01 <i /> 05</span>
      </div>
    </section>
  );
}

function SectionHeading({ overline, title, secondLine, sideText }) {
  return (
    <div className="section-heading">
      <div className="heading-top reveal-up"><span className="eyebrow">{overline}</span><span className="heading-side">{sideText}</span></div>
      <h2 data-split>{title}{secondLine && <><br /><em>{secondLine}</em></>}</h2>
    </div>
  );
}

function WorkSection() {
  return (
    <section id="work" className="work-section">
      <div className="container work-head">
        <SectionHeading overline="01 / SELECTED WORK" title="A FEW WORLDS" secondLine="I HELPED BRING TO LIFE." sideText="A SELECTION / 2025—26" />
        <div className="work-intro-row reveal-up">
          <p>Digital products, experimental interfaces, and web experiences — each shaped around a clear idea and a feeling worth remembering.</p>
          <a className="text-link" href="#contact">HAVE A PROJECT IN MIND? <ArrowUpRight size={15} /></a>
        </div>
      </div>
      <div className="work-rail">
        <div className="work-track">
          {projects.map((project) => <ProjectCard key={project.number} project={project} />)}
          <div className="work-end-card">
            <span className="eyebrow">END OF SELECTED WORK</span>
            <h3>MORE WORLDS<br /><em>IN PROGRESS.</em></h3>
            <a className="outline-link magnetic" href="#contact"><span>START A PROJECT</span><ArrowRight size={16} strokeWidth={1.5} /></a>
          </div>
        </div>
        <div className="container rail-footer">
          <span className="rail-count"><b>01</b> / {String(projects.length).padStart(2, '0')}</span>
          <span className="rail-bar"><i /></span>
          <span className="rail-hint">KEEP SCROLLING <ArrowRight size={12} /></span>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const words = ['Curiosity', 'Clarity', 'Craft', 'Care'];
  return (
    <section id="about" className="about-section stack-section">
      <div className="stack-inner">
        <div className="about-panel">
          <div className="about-orbit" aria-hidden="true"><div /><div /><div /><span>S / 26</span></div>
          <div className="container about-layout">
            <div className="about-left">
              <span className="eyebrow reveal-up">02 / A LITTLE ABOUT ME</span>
              <p className="about-aside reveal-up">A developer with a designer’s eye and an engineer’s curiosity.</p>
              <div className="about-stats">
                <div><strong data-count="4">04<span>+</span></strong><small>YEARS OF CURIOSITY</small></div>
                <div><strong>∞</strong><small>THINGS LEFT TO MAKE</small></div>
              </div>
            </div>
            <div className="about-right">
              <h2>THE BEST DIGITAL WORK DOESN’T JUST <em>LOOK GOOD.</em> IT MAKES YOU <em>FEEL SOMETHING.</em></h2>
              <p className="reveal-up">I’m Shree — a developer working across full-stack products, interactive websites, and applied AI. I like the space where technology fades into the background and the experience takes over.</p>
              <p className="reveal-up">My process is equal parts experimentation and intent: understand the problem, find the interesting angle, then build it with care down to the smallest interaction.</p>
              <div className="values-list">{words.map((word, i) => <span key={word}><small>0{i + 1}</small>{word}</span>)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const capabilities = [
    { no: '01', title: 'Digital experiences', detail: 'Immersive websites, expressive interfaces, scroll-led storytelling, and memorable moments.' },
    { no: '02', title: 'Product engineering', detail: 'Full-stack applications, thoughtful systems, clean APIs, and interfaces people enjoy using.' },
    { no: '03', title: 'AI / data interfaces', detail: 'Practical machine learning, visual analytics, and complex information made approachable.' },
    { no: '04', title: 'Creative development', detail: 'WebGL, motion design, real-time visuals, and experiments that make the browser feel alive.' },
  ];
  return (
    <section id="capabilities" className="capabilities-section stack-section">
      <div className="stack-inner section-pad">
        <div className="container">
          <SectionHeading overline="03 / CAPABILITIES" title="FROM FIRST SKETCH" secondLine="TO FINAL PIXEL." sideText="THINK / DESIGN / BUILD" />
          <div className="capabilities-layout">
            <p className="capabilities-intro reveal-up">A small, connected toolkit for turning ambitious ideas into useful, expressive digital things.</p>
            <div className="capability-list">
              {capabilities.map((item) => (
                <a className="capability-row" href="#contact" key={item.no}>
                  <span className="capability-no">{item.no}</span>
                  <div><h3>{item.title}</h3><p>{item.detail}</p></div>
                  <ArrowUpRight className="capability-arrow" size={20} strokeWidth={1.4} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="contact-section section-pad">
      <div className="contact-aura" aria-hidden="true" />
      <div className="container contact-content">
        <span className="eyebrow reveal-up">04 / HAVE A GOOD ONE IN MIND?</span>
        <div className="contact-zoom"><h2>LET’S MAKE<br /><em>IT MATTER.</em></h2></div>
        <div className="contact-after">
          <p>Have an ambitious idea, a tricky product problem, or a digital experience you want to bring to life? Let’s talk.</p>
          <a className="contact-mail magnetic" href="mailto:hello@shree.dev"><span>HELLO@SHREE.DEV</span><ArrowUpRight size={22} strokeWidth={1.4} /></a>
          <div className="contact-meta"><span>BASED IN INDIA <i /> WORKING EVERYWHERE</span><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LINKEDIN <ArrowUpRight size={12} /></a><a href="https://github.com/" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={12} /></a></div>
        </div>
      </div>
      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <a className="footer-brand" href="#top">SHREE<span>®</span></a>
      <span>DESIGNED WITH INTENT. BUILT WITH CURIOSITY.</span>
      <a href="#top" className="back-top">BACK TO TOP <ArrowUpRight size={13} /></a>
      <span className="footer-year">© 2026</span>
    </footer>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const appRef = useRef(null);
  const progressRef = useRef(null);
  const revealRef = useRef(() => setLoaded(true));

  const enabledRef = useRef(false);
  enabledRef.current = loaded && !menuOpen;

  // Horizontal pager: each wheel notch slides one step left to right, and the last slide loops back to the hero.
  useEffect(() => {
    const root = appRef.current;
    const track = root.querySelector('.pager-track');
    const slides = [...track.children];
    const workTrack = root.querySelector('.work-track');
    const workIndex = slides.findIndex((slide) => slide.id === 'work');
    const header = root.querySelector('.site-header');
    const hudLinks = [...root.querySelectorAll('.section-hud a')];
    const counter = root.querySelector('.rail-count b');
    const bar = root.querySelector('.rail-bar i');
    const cardCount = root.querySelectorAll('.project-card').length;

    let steps = [];
    let railStep = 0;
    let railMax = 0;
    let index = 0;
    let busy = false;
    let shown = -1;

    const buildSteps = () => {
      railMax = Math.max(0, workTrack.scrollWidth - window.innerWidth);
      const card = workTrack.children[0];
      railStep = card ? card.offsetWidth + parseFloat(getComputedStyle(workTrack).columnGap || 0) : window.innerWidth;
      const railCount = railMax > 0 ? Math.ceil(railMax / railStep) : 0;
      steps = [];
      slides.forEach((_, s) => {
        steps.push({ slide: s, rail: 0 });
        if (s === workIndex) for (let r = 1; r <= railCount; r += 1) steps.push({ slide: s, rail: r });
      });
    };

    const apply = (animate) => {
      const { slide, rail } = steps[index];
      const dur = animate ? 1.1 : 0;
      const ease = 'power3.inOut';
      gsap.to(track, { x: -slide * window.innerWidth, duration: dur, ease, overwrite: 'auto' });
      const railX = -Math.min(rail * railStep, railMax);
      gsap.to(workTrack, { x: railX, duration: dur, ease, overwrite: 'auto' });

      const railProgress = railMax > 0 ? Math.min(rail * railStep, railMax) / railMax : 0;
      motionState.rail = railProgress;
      motionState.morph = slide === 0 ? 4 : 2; // galaxy on the hero, a planet once scrolling starts
      motionState.planet = Math.max(0, slide - 1);
      motionState.progress = slides.length > 1 ? slide / (slides.length - 1) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${(index + 1) / steps.length})`;
      bar.style.transform = `scaleX(${railProgress})`;
      counter.textContent = String(Math.min(cardCount, Math.round(railProgress * (cardCount - 1)) + 1)).padStart(2, '0');
      hudLinks.forEach((link, i) => link.classList.toggle('is-active', i === slide));
      header.classList.toggle('is-scrolled', slide > 0);
      if (slide !== shown) {
        if (shown >= 0) {
          const left = slides[shown];
          window.setTimeout(() => { left.scrollTop = 0; }, 1200);
        }
        shown = slide;
        if (slide > 0) animateSlideIn(slides[slide]);
      }
    };

    const go = (target) => {
      if (busy || !enabledRef.current) return;
      const next = ((target % steps.length) + steps.length) % steps.length;
      if (next === index) return;
      const wrapping = Math.abs(next - index) > 1;
      index = next;
      busy = true;
      apply(true);
      window.setTimeout(() => { busy = false; }, wrapping ? 1300 : 900);
    };

    const goToSlide = (slide) => {
      if (busy) return;
      const target = steps.findIndex((step) => step.slide === slide && step.rail === 0);
      if (target < 0 || target === index) return;
      index = target;
      busy = true;
      apply(true);
      window.setTimeout(() => { busy = false; }, 1300);
    };

    // Let tall slides scroll vertically first, then page sideways at their edge.
    const canScrollInside = (dir) => {
      const el = slides[steps[index].slide];
      if (getComputedStyle(el).overflowY !== 'auto' || el.scrollHeight <= el.clientHeight + 2) return false;
      return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;
    };

    let wheelAcc = 0;
    let wheelTimer = 0;
    const onWheel = (event) => {
      event.preventDefault();
      if (!enabledRef.current) return;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const dir = Math.sign(delta);
      if (!dir) return;
      if (event.deltaY && canScrollInside(dir)) {
        const el = slides[steps[index].slide];
        el.scrollTop += event.deltaY;
        return;
      }
      wheelAcc += delta;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => { wheelAcc = 0; }, 160);
      if (Math.abs(wheelAcc) > 12) {
        wheelAcc = 0;
        go(index + dir);
      }
    };

    const onKey = (event) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key)) go(index + 1);
      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) go(index - 1);
    };

    let touchX = 0;
    let touchY = 0;
    const onTouchStart = (event) => { touchX = event.touches[0].clientX; touchY = event.touches[0].clientY; };
    const onTouchEnd = (event) => {
      const dx = touchX - event.changedTouches[0].clientX;
      const dy = touchY - event.changedTouches[0].clientY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + Math.sign(dx));
    };

    const onClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      event.preventDefault();
      const hash = link.getAttribute('href');
      const slide = hash === '#top' ? 0 : slides.findIndex((s) => `#${s.id}` === hash);
      if (slide >= 0) goToSlide(slide);
    };

    const onResize = () => {
      buildSteps();
      index = Math.min(index, steps.length - 1);
      apply(false);
    };

    buildSteps();
    apply(false);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('click', onClick);
    return () => {
      window.clearTimeout(wheelTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => initInteractions(appRef.current), []);

  useEffect(() => {
    if (!loaded) return undefined;
    const ctx = gsap.context(heroIntro, appRef.current);
    return () => ctx.revert();
  }, [loaded]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="site-root" ref={appRef}>
      <Preloader onReveal={revealRef.current} />
      <Experience />
      <div className="scroll-progress" ref={progressRef} />
      <div className="custom-cursor" aria-hidden="true">
        <span className="cursor-ring"><span className="cursor-label" /></span>
        <span className="cursor-dot" />
      </div>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <nav className="section-hud" aria-label="Sections">
        {hudItems.map((item, i) => (
          <a key={item.href} href={item.href}><span>{item.label}</span><small>0{i + 1}</small><i /></a>
        ))}
      </nav>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="pager">
        <div className="pager-track">
          <Hero />
          <WorkSection />
          <AboutSection />
          <CapabilitiesSection />
          <ContactSection />
        </div>
      </main>
    </div>
  );
}
