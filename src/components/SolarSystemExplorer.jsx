import { useEffect, useState } from 'react';
import Experience from './Experience.jsx';
import { bodies } from '../data/planets.js';
import { motionState } from '../lib/motionState.js';

const pad = (value) => String(value).padStart(2, '0');
const formatStat = (stat) => stat.num.toLocaleString('en-US', {
  minimumFractionDigits: stat.decimals ?? 0,
  maximumFractionDigits: stat.decimals ?? 0,
});

export default function SolarSystemExplorer() {
  const [entered, setEntered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(3);
  const [showBodies, setShowBodies] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [spinning, setSpinning] = useState(true);
  const [orbitMode, setOrbitMode] = useState(true);
  const [orbitPaths, setOrbitPaths] = useState(true);
  const [speed, setSpeed] = useState(1);
  const activeBody = bodies[activeIndex];

  const selectBody = (index) => {
    if (index < 0 || index >= bodies.length) return;
    motionState.direction = index >= activeIndex ? 1 : -1;
    motionState.body = index;
    motionState.slide = index + 1;
    motionState.progress = index / Math.max(1, bodies.length - 1);
    setActiveIndex(index);
    setEntered(true);
    setShowHelp(false);
  };

  useEffect(() => {
    motionState.intro = 1;
    motionState.slide = 0;
    motionState.body = -1;
    return () => {
      motionState.timeScale = 1;
      motionState.spinEnabled = true;
      motionState.orbitEnabled = true;
      motionState.body = -1;
      motionState.slide = 0;
    };
  }, []);

  useEffect(() => {
    motionState.timeScale = playing ? speed : 0;
    motionState.spinEnabled = spinning;
    motionState.orbitEnabled = orbitMode;
  }, [playing, speed, spinning, orbitMode]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'BUTTON'].includes(event.target.tagName)) {
        if (event.code !== 'Space') return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        selectBody((activeIndex + 1) % bodies.length);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        selectBody((activeIndex + bodies.length - 1) % bodies.length);
      } else if (event.code === 'Space') {
        event.preventDefault();
        setPlaying((value) => !value);
      } else if (event.key.toLowerCase() === 'h') {
        setShowHelp((value) => !value);
      } else if (event.key.toLowerCase() === 's') {
        setShowSettings((value) => !value);
      } else if (/^[1-9]$/.test(event.key)) {
        selectBody(Number(event.key) - 1);
      } else if (event.key === '0') {
        selectBody(9);
      } else if (event.key === 'Escape') {
        setShowHelp(false);
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex]);

  const resetView = () => {
    motionState.dragX = 0;
    motionState.dragY = 0;
    motionState.resetVersion += 1;
  };

  return (
    <div className={`explorer ${entered ? 'is-entered' : 'is-intro'}${orbitPaths ? ' has-orbits' : ''}`}>
      <Experience />
      {entered && (
        <>
          <header className="explorer-header">
            <a className="explorer-brand" href="#overview" onClick={(event) => { event.preventDefault(); selectBody(3); }}>
              <span className="brand-orb" aria-hidden="true">◉</span>
              <span><b>BEYOND</b><small>AN INTERACTIVE TOUR</small></span>
            </a>
            <nav className="explorer-nav" aria-label="Main navigation">
              <button className="is-current" onClick={() => selectBody(3)}>Overview</button>
              <button onClick={() => setShowBodies((value) => !value)} aria-expanded={showBodies}>Bodies</button>
              <button onClick={() => setShowSettings((value) => !value)} aria-expanded={showSettings}>Display settings</button>
            </nav>
            <span className="system-status"><i /> SYSTEM ONLINE</span>
          </header>

          <aside className={`body-selector${showBodies ? '' : ' is-collapsed'}`} aria-label="Select a celestial body">
            <div className="selector-heading"><span>CELESTIAL BODIES</span><span>{bodies.length} OBJECTS</span></div>
            <div className="body-list" role="listbox" aria-label="Celestial bodies">
              <div className="body-group-label">STAR</div>
              {bodies.slice(0, 1).map((body, index) => (
                <BodyButton key={body.id} body={body} index={index} activeIndex={activeIndex} onSelect={selectBody} />
              ))}
              <div className="body-group-label">PLANETS</div>
              {[...bodies.slice(1, 4), ...bodies.slice(5)].map((body) => (
                <BodyButton key={body.id} body={body} index={bodies.indexOf(body)} activeIndex={activeIndex} onSelect={selectBody} />
              ))}
              <div className="body-group-label">NATURAL SATELLITE</div>
              <BodyButton body={bodies[4]} index={4} activeIndex={activeIndex} onSelect={selectBody} />
            </div>
          </aside>

          <main className="body-information" aria-live="polite">
            <div className="body-overline"><span>{pad(activeIndex + 1)} / {pad(bodies.length)}</span><i />{activeBody.kind}</div>
            <h1>{activeBody.name}</h1>
            <p className="body-tagline">{activeBody.tagline}</p>
            <p className="body-description">{activeBody.description}</p>
            <div className="body-stats">
              {activeBody.stats.slice(0, 3).map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <b>{formatStat(stat)}<small>{stat.unit}</small></b>
                </div>
              ))}
            </div>
            <p className="body-fact"><span>✳</span>{activeBody.fact}</p>
          </main>

          <div className="scene-title" aria-hidden="true">
            <span>THE SOLAR SYSTEM</span>
            <b>{activeBody.name}</b>
          </div>

          <div className="orbit-guide" aria-hidden="true">
            <i /><i /><i /><i />
          </div>

          <div className="bottom-status">
            <span><i /> LIVE MODEL</span>
            <span>{activeBody.distance || 'THE CENTRE'}{activeBody.au ? ` · ${activeBody.au} AU` : ''}</span>
            <button onClick={() => setShowHelp((value) => !value)} aria-label="Keyboard shortcuts">KEYBOARD SHORTCUTS <b>?</b></button>
          </div>

          <div className="control-dock" role="toolbar" aria-label="Time and display controls">
            <button className="dock-control" onClick={() => setPlaying((value) => !value)} aria-pressed={playing} aria-label={playing ? 'Pause' : 'Play'}>
              <span>{playing ? 'Ⅱ' : '▶'}</span>{playing ? 'PAUSE' : 'PLAY'}
            </button>
            <button className="dock-control" onClick={() => setSpinning((value) => !value)} aria-pressed={spinning}>
              <span>↻</span>SPIN
            </button>
            <button className="dock-control" onClick={() => setOrbitMode((value) => !value)} aria-pressed={orbitMode}>
              <span>◎</span>ORBIT
            </button>
            <label className="speed-control">
              <span>SPEED <b>{speed.toFixed(2)}×</b></span>
              <input aria-label="Time speed" type="range" min="0.25" max="2" step="0.25" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
            </label>
            <span className="dock-divider" />
            <button className="dock-control" onClick={() => setOrbitPaths((value) => !value)} aria-pressed={orbitPaths}>
              <span>⌁</span>ORBIT PATHS
            </button>
            <button className="dock-control" onClick={resetView}>
              <span>⟲</span>RESET VIEW
            </button>
            <span className="dock-divider" />
            <div className="body-stepper">
              <button aria-label="Previous body" onClick={() => selectBody((activeIndex + bodies.length - 1) % bodies.length)}>‹</button>
              <span>{pad(activeIndex + 1)} <small>/ {pad(bodies.length)}</small></span>
              <button aria-label="Next body" onClick={() => selectBody((activeIndex + 1) % bodies.length)}>›</button>
            </div>
          </div>

          {showSettings && (
            <section className="settings-panel" aria-label="Display settings">
              <div><b>DISPLAY SETTINGS</b><button onClick={() => setShowSettings(false)} aria-label="Close settings">×</button></div>
              <label><span>Orbit paths</span><input type="checkbox" checked={orbitPaths} onChange={(event) => setOrbitPaths(event.target.checked)} /></label>
              <label><span>Camera orbit</span><input type="checkbox" checked={orbitMode} onChange={(event) => setOrbitMode(event.target.checked)} /></label>
              <label><span>Planet rotation</span><input type="checkbox" checked={spinning} onChange={(event) => setSpinning(event.target.checked)} /></label>
              <label><span>Motion</span><input type="checkbox" checked={playing} onChange={(event) => setPlaying(event.target.checked)} /></label>
            </section>
          )}

          {showHelp && (
            <section className="help-panel" aria-label="Keyboard shortcuts">
              <b>KEYBOARD SHORTCUTS</b>
              <p><kbd>←</kbd> <kbd>→</kbd><span>Choose a body</span></p>
              <p><kbd>SPACE</kbd><span>Pause or play</span></p>
              <p><kbd>1–0</kbd><span>Jump to a body</span></p>
              <p><kbd>S</kbd><span>Display settings</span></p>
            </section>
          )}
        </>
      )}

      {!entered && (
        <section className="intro-screen" aria-label="Introduction">
          <div className="intro-halo" aria-hidden="true" />
          <span className="intro-kicker">BEYOND / A COSMIC FIELD GUIDE</span>
          <h1>The Solar System<br /><em>in Motion</em></h1>
          <p>Ten celestial bodies · One clear view</p>
          <button onClick={() => selectBody(activeIndex)}>START EXPLORING <span>→</span></button>
          <span className="intro-ready"><i /> READY · CLICK TO ENTER</span>
        </section>
      )}
    </div>
  );
}

function BodyButton({ body, index, activeIndex, onSelect }) {
  return (
    <button
      role="option"
      aria-selected={activeIndex === index}
      className={`body-option${activeIndex === index ? ' is-selected' : ''}`}
      onClick={() => onSelect(index)}
    >
      <span className="body-number">{pad(index + 1)}</span>
      <i className={`body-swatch swatch-${body.id}`} />
      <span className="body-option-name">{body.name}</span>
      <span className="body-option-arrow">↗</span>
    </button>
  );
}
