import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ParticleScene, { updateScenePointer } from './components/ParticleScene.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import { projects } from './data/projects.js';

gsap.registerPlugin(ScrollTrigger);

const menuItems = [
  { number: '01', label: 'WORK', href: '#work' },
  { number: '02', label: 'ABOUT', href: '#about' },
  { number: '03', label: 'CAPABILITIES', href: '#capabilities' },
  { number: '04', label: 'CONTACT', href: '#contact' },
];

function Header({ menuOpen, setMenuOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" onClick={() => setMenuOpen(false)} aria-label="Shree, home">
        <span className="brand-mark">S<span>.</span></span>
        <span className="brand-copy"><b>SHREE</b><small>CREATIVE DEVELOPER</small></span>
      </a>
      <div className="header-right">
        <span className="availability"><i /> AVAILABLE FOR SELECT PROJECTS</span>
        <button className={`menu-trigger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
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
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
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
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.07, duration: 0.55 }}
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
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, 110]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.15]);
  return (
    <section id="top" className="hero section-shell">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <ParticleScene />
      <motion.div className="hero-center" style={{ y: heroY, opacity: heroOpacity }}>
        <motion.p className="hero-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}>
          <span className="kicker-line" /> INDEPENDENT DIGITAL CRAFT / 2026 <span className="kicker-line" />
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.15, duration: 1.1, ease: [0.19, 1, 0.22, 1] }}>
          MADE OF<br /><em>CODE &amp; FEELING.</em>
        </motion.h1>
        <motion.p className="hero-description" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.8 }}>
          I build digital experiences where thoughtful engineering meets a little bit of wonder.
        </motion.p>
        <motion.a href="#work" className="outline-link hero-cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.65 }}>
          <span>EXPLORE SELECTED WORK</span><ArrowDownRight size={16} strokeWidth={1.5} />
        </motion.a>
      </motion.div>
      <span className="hero-side hero-side-left">DESIGN / TECHNOLOGY / EXPERIENCE</span>
      <span className="hero-side hero-side-right">19°59' N — 73°47' E</span>
      <div className="hero-bottom">
        <span>SCROLL TO DISCOVER</span>
        <motion.span className="scroll-indicator" animate={{ y: [0, 6, 0] }} transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}><ArrowDown size={15} /></motion.span>
        <span className="hero-index">01 <i /> 04</span>
      </div>
    </section>
  );
}

function SectionHeading({ overline, title, secondLine, sideText }) {
  return (
    <div className="section-heading">
      <div className="heading-top"><span className="eyebrow">{overline}</span><span className="heading-side">{sideText}</span></div>
      <h2>{title}{secondLine && <><br /><em>{secondLine}</em></>}</h2>
    </div>
  );
}

function WorkSection() {
  return (
    <section id="work" className="work-section section-pad">
      <div className="container">
        <SectionHeading overline="01 / SELECTED WORK" title="A FEW WORLDS" secondLine="I HELPED BRING TO LIFE." sideText="A SELECTION / 2025—26" />
        <div className="work-intro-row">
          <p>Digital products, experimental interfaces, and web experiences — each shaped around a clear idea and a feeling worth remembering.</p>
          <a className="text-link" href="#contact">HAVE A PROJECT IN MIND? <ArrowUpRight size={15} /></a>
        </div>
        <div className="project-grid">
          {projects.map((project, index) => <ProjectCard key={project.number} project={project} index={index} />)}
        </div>
        <div className="work-endline"><span>END OF SELECTED WORK</span><span>MORE IN PROGRESS <i /></span></div>
      </div>
    </section>
  );
}

function AboutSection() {
  const words = ['Curiosity', 'Clarity', 'Craft', 'Care'];
  return (
    <section id="about" className="about-section section-pad">
      <div className="about-orbit" aria-hidden="true"><div /><div /><div /><span>S / 26</span></div>
      <div className="container about-layout">
        <div className="about-left">
          <span className="eyebrow">02 / A LITTLE ABOUT ME</span>
          <p className="about-aside">A developer with a designer’s eye and an engineer’s curiosity.</p>
          <div className="about-stats">
            <div><strong>04<span>+</span></strong><small>YEARS OF CURIOSITY</small></div>
            <div><strong>∞</strong><small>THINGS LEFT TO MAKE</small></div>
          </div>
        </div>
        <div className="about-right">
          <h2>THE BEST DIGITAL WORK<br />DOESN’T JUST <em>LOOK GOOD.</em><br />IT MAKES YOU <em>FEEL SOMETHING.</em></h2>
          <p>I’m Shree — a developer working across full-stack products, interactive websites, and applied AI. I like the space where technology fades into the background and the experience takes over.</p>
          <p>My process is equal parts experimentation and intent: understand the problem, find the interesting angle, then build it with care down to the smallest interaction.</p>
          <div className="values-list">{words.map((word, i) => <span key={word}><small>0{i + 1}</small>{word}</span>)}</div>
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
    <section id="capabilities" className="capabilities-section section-pad">
      <div className="container">
        <SectionHeading overline="03 / CAPABILITIES" title="FROM FIRST SKETCH" secondLine="TO FINAL PIXEL." sideText="THINK / DESIGN / BUILD" />
        <div className="capabilities-layout">
          <p className="capabilities-intro">A small, connected toolkit for turning ambitious ideas into useful, expressive digital things.</p>
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
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="contact-section section-pad">
      <div className="contact-aura" aria-hidden="true" />
      <div className="container contact-content">
        <span className="eyebrow">04 / HAVE A GOOD ONE IN MIND?</span>
        <h2>LET’S MAKE<br /><em>IT MATTER.</em></h2>
        <p>Have an ambitious idea, a tricky product problem, or a digital experience you want to bring to life? Let’s talk.</p>
        <a className="contact-mail" href="mailto:hello@shree.dev"><span>HELLO@SHREE.DEV</span><ArrowUpRight size={22} strokeWidth={1.4} /></a>
        <div className="contact-meta"><span>BASED IN INDIA <i /> WORKING EVERYWHERE</span><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LINKEDIN <ArrowUpRight size={12} /></a><a href="https://github.com/" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={12} /></a></div>
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const appRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    const onPointerMove = (event) => {
      updateScenePointer((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reveal-line').forEach((element) => {
        gsap.fromTo(element, { y: 36, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        });
      });
      gsap.utils.toArray('.section-heading h2').forEach((element) => {
        gsap.fromTo(element, { y: 48, opacity: 0 }, {
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 82%', once: true },
        });
      });
    }, appRef);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="site-root" ref={appRef}>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
      <div className="custom-cursor" ref={cursorRef} aria-hidden="true"><span /></div>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
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
