import { ArrowUpRight } from 'lucide-react';

function Artwork({ theme }) {
  if (theme === 'pictune') {
    return (
      <div className="artwork artwork-pictune">
        <div className="sound-orb orb-one" /><div className="sound-orb orb-two" /><div className="sound-orb orb-three" />
        <div className="soundwave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <span className="art-label">IMAGE → SOUND</span>
      </div>
    );
  }
  if (theme === 'openbill') {
    return (
      <div className="artwork artwork-openbill">
        <div className="dashboard-window">
          <div className="window-head"><b /><b /><b /><span>OVERVIEW / 2026</span></div>
          <div className="dash-value">₹ 2,48,390<span>+18.6%</span></div>
          <div className="chart-lines"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="dash-bottom"><span>REVENUE</span><span>LAST 30 DAYS</span></div>
        </div>
        <span className="art-label">FINANCE SYSTEMS</span>
      </div>
    );
  }
  if (theme === 'neural') {
    return (
      <div className="artwork artwork-neural">
        <div className="scan-ring ring-a" /><div className="scan-ring ring-b" /><div className="scan-ring ring-c" />
        <div className="scan-core"><span>NV</span></div>
        <div className="scan-cross horizontal" /><div className="scan-cross vertical" />
        <span className="art-label">VISION SYSTEM / 04</span>
      </div>
    );
  }
  return (
    <div className="artwork artwork-exploora">
      <div className="mountain mountain-back" /><div className="mountain mountain-mid" /><div className="mountain mountain-front" />
      <div className="sun-disc" /><div className="travel-stamp">FIND<br />YOUR<br />ELSEWHERE</div>
      <span className="art-label">FIELD NOTES / 001</span>
    </div>
  );
}

export default function ProjectCard({ project }) {
  return (
    <article className={`project-card project-${project.theme}`}>
      <a className="project-link" href="#contact" data-cursor="VIEW" aria-label={`Discuss a project like ${project.title}`}>
        <div className="project-visual">
          <Artwork theme={project.theme} />
          <span className="project-glare" aria-hidden="true" />
          <span className="project-number" aria-hidden="true">{project.number}</span>
          <span className="project-open"><ArrowUpRight size={20} strokeWidth={1.5} /></span>
        </div>
        <div className="project-meta">
          <div>
            <span className="eyebrow">{project.number} / {project.type}</span>
            <h3>{project.title}</h3>
          </div>
          <span className="project-year">{project.year}</span>
        </div>
        <p className="project-description">{project.description}</p>
      </a>
    </article>
  );
}
