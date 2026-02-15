import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { postedLabel, logoUrl, stripHtmlAndTruncate } from '../../constants';

const SWIPE_T = 100;
const SWIPE_DT = 80;
const CLICK_T = 6;

export default function JobCard({ job, isTop, depth, onSwipe, onOpenDetails, onDragOffset }) {
  const startRef = useRef({ x: 0, y: 0 });
  const [dragDir, setDragDir] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const style = {
    zIndex: 100 - depth,
    y: depth * 12,
    scale: 1 - depth * 0.04,
    opacity: 1 - depth * 0.25,
  };

  const exitVariants = {
    right: { x: '150%', rotate: 30, opacity: 0, transition: { duration: 0.3 } },
    left: { x: '-150%', rotate: -30, opacity: 0, transition: { duration: 0.3 } },
    down: { y: '150%', opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className={`job-card ${dragDir ? `drag-${dragDir}` : ''}`}
      style={{ position: 'absolute', width: '100%', height: '100%' }}
      initial={false}
      animate={style}
      exit={onSwipe._lastDir ? exitVariants[onSwipe._lastDir] : { opacity: 0 }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      dragMomentum={false}
      onDragStart={(_, info) => {
        startRef.current = { x: info.point.x, y: info.point.y };
      }}
      onDrag={(_, info) => {
        if (!isTop) return;
        onDragOffset?.(info.offset.x, info.offset.y);
        // Selective Attention: color tint based on drag direction
        const dx = info.offset.x;
        const dy = info.offset.y;
        if (Math.abs(dx) > 40 && dx > 0) setDragDir('right');
        else if (Math.abs(dx) > 40 && dx < 0) setDragDir('left');
        else if (dy > 40) setDragDir('down');
        else setDragDir(null);
      }}
      onDragEnd={(_, info) => {
        if (!isTop) return;
        onDragOffset?.(0, 0);
        setDragDir(null);
        const dx = info.offset.x;
        const dy = info.offset.y;
        const total = Math.abs(dx) + Math.abs(dy);
        if (Math.abs(dx) > SWIPE_T) {
          onSwipe(dx > 0 ? 'right' : 'left');
        } else if (dy > SWIPE_DT) {
          onSwipe('down');
        } else if (total < CLICK_T) {
          onOpenDetails(job);
        }
      }}
      whileDrag={isTop ? { cursor: 'grabbing' } : undefined}
    >
      {/* Hero photo header */}
      <div className="card-hero">
        <div className="card-hero-overlay" />
        <div className="match-score">
          <span className="score">{job.match}%</span>
          <span className="label">Match</span>
        </div>
      </div>

      {/* Company + Role */}
      <div className="card-body">
        <div className="card-identity">
          <img src={job.logo} alt="" className="company-logo" onError={(e) => { e.target.src = logoUrl(job.company); }} />
          <div>
            <h2 className="job-title">{job.title}</h2>
            <span className="company-name">{job.company}</span>
          </div>
        </div>
        <div className="job-meta">
          {job.salary && <span className="meta-tag salary"><i className="fas fa-dollar-sign"></i> {job.salary}</span>}
          {job.locationType === 'remote' && <span className="meta-tag remote"><i className="fas fa-wifi"></i> Remote</span>}
          <span className="meta-tag job-type-tag"><i className="fas fa-briefcase"></i> {job.jobType}</span>
        </div>
        {job.description && (
          <p className="job-description-snippet">{stripHtmlAndTruncate(job.description, 140)}</p>
        )}
        <div className="skills-container">
          <div className="skills-label">Skills & Match</div>
          <div className="skills-tags">
            {job.skills.length > 0
              ? job.skills.map(s => (
                  <span key={s} className={`skill-tag ${(job.userSkillMatch || []).includes(s) ? 'match' : ''}`}>{s}</span>
                ))
              : <span className="skill-tag">No tags listed</span>
            }
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer">
        <span className="posted-time"><i className="fas fa-clock"></i> {postedLabel(job.postedDays)}</span>
        <span className="company-location"><i className="fas fa-map-marker-alt"></i> {job.location}</span>
      </div>
    </motion.div>
  );
}
