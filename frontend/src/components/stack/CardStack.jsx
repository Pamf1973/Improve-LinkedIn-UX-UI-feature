import { useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import JobCard from './JobCard';

export default function CardStack({ jobs, onSwipe, onOpenDetails }) {
  const { state } = useApp();
  const [idx, setIdx] = useState(0);
  const [exitDir, setExitDir] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastDirRef = useRef(null);

  const handleSwipe = useCallback((dir) => {
    if (idx >= jobs.length) return;
    lastDirRef.current = dir;
    setExitDir(dir);
    onSwipe(dir, jobs[idx]);
    setTimeout(() => {
      setIdx(prev => prev + 1);
      setExitDir(null);
    }, 250);
  }, [idx, jobs, onSwipe]);

  handleSwipe._lastDir = exitDir;

  const handleDragOffset = useCallback((x, y) => {
    setDragOffset({ x, y });
  }, []);

  const reset = useCallback(() => {
    setIdx(0);
    setExitDir(null);
  }, []);

  // Expose for parent
  CardStack.reset = reset;
  CardStack.handleSwipe = handleSwipe;
  CardStack.currentJob = jobs[idx] || null;
  CardStack.currentIdx = idx;
  CardStack.total = jobs.length;

  const visibleJobs = jobs.slice(idx, idx + 3);

  return (
    <div className="card-stack-container">
      <div className="card-stack">
        {idx >= jobs.length ? (
          /* Peak-End Rule: memorable celebration with confetti + stats */
          <div className="stack-placeholder">
            <div className="celebration-icon">
              <i className="fas fa-trophy"></i>
              <div className="confetti-ring"></div>
              <div className="confetti-ring"></div>
              <div className="confetti-ring"></div>
              <div className="confetti-container">
                {[...Array(8)].map((_, i) => <div key={i} className="confetti-piece" />)}
              </div>
            </div>
            <h3>All caught up!</h3>
            <div className="celebration-stats">
              <div className="celebration-stat">
                <span className="stat-value saved">{state.savedJobs.length}</span>
                <span className="stat-label">Saved</span>
              </div>
              <div className="celebration-stat">
                <span className="stat-value skipped">{state.skippedJobs.length}</span>
                <span className="stat-label">Skipped</span>
              </div>
              <div className="celebration-stat">
                <span className="stat-value archived">{state.archivedJobs.length}</span>
                <span className="stat-label">Archived</span>
              </div>
            </div>
            <p>You reviewed <strong>{jobs.length}</strong> jobs. Great work!</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              <i className="fas fa-sync-alt"></i> Discover More
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {[...visibleJobs].reverse().map((job, revIdx) => {
              const actualIdx = visibleJobs.length - 1 - revIdx;
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  isTop={actualIdx === 0}
                  depth={actualIdx}
                  onSwipe={handleSwipe}
                  onOpenDetails={onOpenDetails}
                  onDragOffset={actualIdx === 0 ? handleDragOffset : undefined}
                />
              );
            })}
          </AnimatePresence>
        )}
      </div>
      {/* Swipe Hints */}
      <div className="swipe-hint swipe-hint-left" style={{ opacity: dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0 }}>
        <i className="fas fa-times"></i><span>Skip</span>
      </div>
      <div className="swipe-hint swipe-hint-right" style={{ opacity: dragOffset.x > 50 ? Math.min(dragOffset.x / 150, 1) : 0 }}>
        <i className="fas fa-heart"></i><span>Save</span>
      </div>
      <div className="swipe-hint swipe-hint-down" style={{ opacity: dragOffset.y > 50 ? Math.min(dragOffset.y / 150, 1) : 0 }}>
        <i className="fas fa-archive"></i><span>Archive</span>
      </div>
    </div>
  );
}
