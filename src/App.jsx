import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowDownRight, ArrowUpRight, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import Experience from './components/Experience.jsx';
import { bodies } from './data/planets.js';
import { motionState } from './lib/motionState.js';
import { heroIntro, lightJump, transitionSlides } from './lib/pager.js';
import { initInteractions } from './lib/interactions.js';

const menuItems = [
  { number: '01', label: 'THE SUN', href: '#sun' },
  { number: '02', label: 'INNER WORLDS', href: '#mercury' },
  { number: '03', label: 'GAS GIANTS', href: '#jupiter' },
  { number: '04', label: 'ICE GIANTS', href: '#uranus' },
  { number: '05', label: 'CONTACT', href: '#contact' },
];

const hudItems = [
  { label: 'INTRO', href: '#top' },
  ...bodies.map((body) => ({ label: body.name, href: `#${body.id}` })),
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
      <div className="hero-orbits" aria-hidden="true">
        <div className="orbit orbit-a"><i /></div>
        <div className="orbit orbit-b"><i /></div>
        <div className="orbit orbit-c"><i /></div>
      </div>
      <div className="hero-center">
        <div className="hero-kicker-wrap">
          <p className="hero-kicker">
            <span className="kicker-line" />
            <span className="kicker-text" data-phrases="INDEPENDENT DIGITAL CRAFT / 2026|CREATIVE DEVELOPER / WEBGL|FULL-STACK PRODUCTS / AI|MOTION / CODE / FEELING">INDEPENDENT DIGITAL CRAFT / 2026</span>
            <span className="kicker-line" />
          </p>
        </div>
        <div className="hero-title-wrap">
          <h1>MADE OF<br /><em>CODE &amp; FEELING.</em></h1>
        </div>
        <div className="hero-copy">
          <p className="hero-description">I build digital experiences where thoughtful engineering meets a little bit of wonder.</p>
          <a href="#sun" className="outline-link hero-cta magnetic">
            <span>BEGIN THE JOURNEY</span><ArrowDownRight size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
      <div className="hero-frame">
        <span className="hero-side hero-side-left">DESIGN / TECHNOLOGY / EXPERIENCE</span>
        <span className="hero-side hero-side-right">19°59' N — 73°47' E</span>
      </div>
      <div className="hero-telemetry hero-telemetry-left" aria-hidden="true">
        <span>SECTOR <b>NGC-2026</b></span>
        <span>STARS <b data-stars>0</b></span>
        <span>RA <b data-ra>05h 35m 17s</b></span>
      </div>
      <div className="hero-telemetry hero-telemetry-right" aria-hidden="true">
        <span>ROTATION <b>0.045 RAD/S</b></span>
        <span className="drag-hint"><i /> DRAG TO SPIN THE GALAXY</span>
      </div>
      <div className="hero-bottom">
        <span>SCROLL TO TRAVEL</span>
        <span className="scroll-indicator"><span className="scroll-mouse"><i /></span><ArrowDown size={13} /></span>
        <span className="hero-index">00 <i /> {String(bodies.length + 1).padStart(2, '0')}</span>
      </div>
    </section>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const formatStat = (stat) => stat.num.toLocaleString('en-US', { minimumFractionDigits: stat.decimals ?? 0, maximumFractionDigits: stat.decimals ?? 0 });
// Log scale so the inner planets don't bunch up against the Sun.
const travelPosition = (au) => (Math.log10(1 + au * 3) / Math.log10(1 + 30.05 * 3)) * 100;

function PlanetSection({ body, index }) {
  return (
    <section id={body.id} className={`planet-slide planet-${body.id}${index % 2 ? ' is-flipped' : ''}`}>
      <span className="planet-ghost" aria-hidden="true">{pad(index)}</span>
      <div className="planet-info">
        <div className="planet-top">
          <span className="planet-index"><b>{pad(index)}</b> / {pad(bodies.length - 1)}</span>
          <span className="eyebrow">{body.kind}</span>
        </div>
        <h2 className="planet-name">{body.name}</h2>
        <p className="planet-tagline">{body.tagline}</p>
        <p className="planet-desc">{body.description}</p>
        <dl className="planet-stats">
          {body.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd><span data-num={stat.num} data-decimals={stat.decimals ?? 0}>{formatStat(stat)}</span>{stat.unit && <small>{stat.unit}</small>}</dd>
            </div>
          ))}
        </dl>
        <p className="planet-fact"><i /> {body.fact}</p>
      </div>
      <div className="planet-callouts" aria-hidden="true">
        <span className="callout callout-a"><i />{body.au ? `${body.au} AU · ${body.distance} FROM THE SUN` : 'THE CENTRE OF IT ALL'}</span>
        <span className="callout callout-b"><i />DRAG TO ROTATE</span>
      </div>
    </section>
  );
}

function TravelBar() {
  return (
    <div className="travel-bar" aria-hidden="true">
      <span className="travel-label">DISTANCE FROM THE SUN</span>
      <div className="travel-track">
        {bodies.map((body) => <i key={body.id} style={{ left: `${travelPosition(body.au)}%` }}><span>{body.name}</span></i>)}
        <b className="travel-ship" />
      </div>
      <span className="travel-value">THE CENTRE</span>
    </div>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="contact-section section-pad">
      <div className="contact-aura" aria-hidden="true" />
      <div className="container contact-content">
        <span className="eyebrow">END OF THE JOURNEY / HAVE A GOOD ONE IN MIND?</span>
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

  // Pager: one scroll gesture, swipe or arrow key travels exactly one stop.
  useEffect(() => {
    const root = appRef.current;
    const track = root.querySelector('.pager-track');
    const slides = [...track.children];
    const header = root.querySelector('.site-header');
    const hudLinks = [...root.querySelectorAll('.section-hud a')];
    const travel = root.querySelector('.travel-bar');
    const ship = travel.querySelector('.travel-ship');
    const travelValue = travel.querySelector('.travel-value');
    const flash = root.querySelector('.light-flash');
    const bodyOf = (slide) => bodies.findIndex((body) => body.id === slides[slide].id);

    let index = 0;
    let busy = false;

    const sync = () => {
      const body = bodyOf(index);
      motionState.slide = index;
      motionState.body = body;
      motionState.progress = slides.length > 1 ? index / (slides.length - 1) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${(index + 1) / slides.length})`;
      hudLinks.forEach((link, i) => link.classList.toggle('is-active', i === index));
      header.classList.toggle('is-scrolled', index > 0);
      travel.classList.toggle('is-visible', body >= 0);
      if (body >= 0) {
        ship.style.left = `${travelPosition(bodies[body].au)}%`;
        travelValue.textContent = bodies[body].au ? `${bodies[body].distance} · ${bodies[body].au} AU` : 'THE CENTRE';
      }
    };

    // Returns true when a move actually started.
    const goTo = (next) => {
      if (!enabledRef.current || busy) return false;
      if (next < 0 || next >= slides.length || next === index) return false;
      const prev = index;
      const dir = next > prev ? 1 : -1;
      index = next;
      motionState.direction = dir;
      sync();
      if (bodyOf(next) >= 0) lightJump(flash);
      busy = true;
      transitionSlides(slides[prev], slides[next], dir, () => { busy = false; });
      return true;
    };

    // Let tall slides (on phones) scroll vertically first, then travel at their edge.
    const canScrollInside = (dir) => {
      const el = slides[index];
      if (getComputedStyle(el).overflowY !== 'auto' || el.scrollHeight <= el.clientHeight + 2) return false;
      return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;
    };

    // Trackpads keep firing wheel events for a second or two after a flick. Treat a
    // run of events with no pause longer than 220ms as one gesture, and move at most
    // one stop per gesture so a single flick never skips planets.
    let lastWheel = 0;
    let gestureSpent = false;
    let wheelAcc = 0;
    const onWheel = (event) => {
      event.preventDefault();
      if (!enabledRef.current) return;
      const now = performance.now();
      if (now - lastWheel > 220) {
        gestureSpent = false;
        wheelAcc = 0;
      }
      lastWheel = now;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const dir = Math.sign(delta);
      if (!dir || gestureSpent) return;
      if (event.deltaY && canScrollInside(dir)) {
        slides[index].scrollTop += event.deltaY;
        gestureSpent = true;
        return;
      }
      wheelAcc += delta;
      if (Math.abs(wheelAcc) >= 30) {
        gestureSpent = true;
        wheelAcc = 0;
        goTo(index + dir);
      }
    };

    const onKey = (event) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) goTo(index + 1);
      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) goTo(index - 1);
      if (event.key === 'Home') goTo(0);
      if (event.key === 'End') goTo(slides.length - 1);
    };

    let touchX = 0;
    let touchY = 0;
    let touchScrollStart = 0;
    const onTouchStart = (event) => {
      touchX = event.touches[0].clientX;
      touchY = event.touches[0].clientY;
      touchScrollStart = slides[index].scrollTop;
    };
    const onTouchEnd = (event) => {
      const dx = touchX - event.changedTouches[0].clientX;
      const dy = touchY - event.changedTouches[0].clientY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) goTo(index + Math.sign(dx));
      // Only travel vertically if this swipe didn't just scroll the slide's own content.
      else if (Math.abs(dy) > 60 && slides[index].scrollTop === touchScrollStart && !canScrollInside(Math.sign(dy))) goTo(index + Math.sign(dy));
    };

    const onClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      event.preventDefault();
      const hash = link.getAttribute('href');
      goTo(hash === '#top' ? 0 : slides.findIndex((s) => `#${s.id}` === hash));
    };

    slides[0].classList.add('is-active');
    sync();
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
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
      <div className="light-flash" aria-hidden="true" />
      <div className="scroll-progress" ref={progressRef} />
      <div className="custom-cursor" aria-hidden="true">
        <span className="cursor-ring"><span className="cursor-label" /></span>
        <span className="cursor-dot" />
      </div>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <nav className="section-hud" aria-label="Journey stops">
        {hudItems.map((item, i) => (
          <a key={item.href} href={item.href}><span>{item.label}</span><small>{pad(i)}</small><i /></a>
        ))}
      </nav>
      <TravelBar />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="pager">
        <div className="pager-track">
          <Hero />
          {bodies.map((body, i) => <PlanetSection key={body.id} body={body} index={i} />)}
          <ContactSection />
        </div>
      </main>
    </div>
  );
}
