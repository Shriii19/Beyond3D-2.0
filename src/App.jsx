import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Experience from './components/Experience.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import { projects } from './data/projects.js';
import { getLenis, motionState, prefersReducedMotion, setLenis } from './lib/motionState.js';
import { initScrollAnimations } from './lib/scrollAnimations.js';
import { initInteractions } from './lib/interactions.js';

gsap.registerPlugin(ScrollTrigger);

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

  // Smooth scrolling, scroll-driven state for the 3D scene, header + HUD updates.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    let lenis = null;
    const raf = (time) => lenis.raf(time * 1000);
    if (!prefersReducedMotion()) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
      lenis.stop();
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);
    }

    const root = appRef.current;
    const header = root.querySelector('.site-header');
    const hudLinks = [...root.querySelectorAll('.section-hud a')];
    let lastY = 0;
    let active = -1;

    const onScroll = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - vh;
      motionState.progress = max > 0 ? y / max : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${motionState.progress})`;

      let morph = 0;
      for (let i = 1; i < hudItems.length; i += 1) {
        const section = root.querySelector(hudItems[i].href);
        if (section) morph += gsap.utils.clamp(0, 1, (vh - section.getBoundingClientRect().top) / (vh * 0.9));
      }
      motionState.morph = morph;

      const current = Math.min(hudItems.length - 1, Math.round(morph));
      if (current !== active) {
        active = current;
        hudLinks.forEach((link, i) => link.classList.toggle('is-active', i === current));
      }
      header.classList.toggle('is-hidden', y > lastY && y > 160);
      header.classList.toggle('is-scrolled', y > 40);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // In-page links glide with Lenis instead of jumping.
    const onClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      const target = hash === '#top' ? 0 : document.querySelector(hash);
      if (target === null) return;
      event.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 2, force: true, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else if (target === 0) window.scrollTo(0, 0);
      else target.scrollIntoView();
    };
    document.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('click', onClick);
      if (lenis) {
        gsap.ticker.remove(raf);
        lenis.destroy();
        setLenis(null);
      }
    };
  }, []);

  useEffect(() => initInteractions(appRef.current), []);

  useEffect(() => {
    if (!loaded) return undefined;
    getLenis()?.start();
    return initScrollAnimations(appRef.current);
  }, [loaded]);

  useEffect(() => {
    const lenis = getLenis();
    if (menuOpen) lenis?.stop();
    else if (loaded) lenis?.start();
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, loaded]);

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
      <main>
        <Hero />
        <div className="ticker" aria-label="Design, technology, experience"><div className="ticker-track">{Array.from({ length: 4 }).map((_, index) => <span key={index}>DESIGN <i>✳</i> TECHNOLOGY <i>✳</i> EXPERIENCE <i>✳</i> CURIOSITY <i>✳</i></span>)}</div></div>
        <WorkSection />
        <AboutSection />
        <CapabilitiesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
