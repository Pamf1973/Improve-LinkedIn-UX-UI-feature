import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useApp } from '../../context/AppContext';
import { useJobs } from '../../hooks/useJobs';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CardStack from './CardStack';

const StackView = forwardRef(function StackView(_, ref) {
  const { state, dispatch, showToast } = useApp();
  const { jobs, loading, error, loadJobs } = useJobs();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stackIdx, setStackIdx] = useState(0);
  // Flow: streak tracking
  const [streak, setStreak] = useState(0);
  const lastSwipeDir = useRef(null);

  const applyFilter = useCallback((allJobs, filter) => {
    if (filter === 'all') return [...allJobs];
    return allJobs.filter(j => {
      if (filter === 'fulltime' && j.jobType !== 'Full-time') return false;
      if (filter === 'salary' && !j.salary) return false;
      if (filter === 'recent' && j.postedDays > 7) return false;
      return true;
    });
  }, []);

  const load = useCallback(async (query = '') => {
    const prefs = state.preferences;
    const data = await loadJobs({
      query,
      categories: prefs.categories || [],
      skills: prefs.skills || [],
      filters: {
        minSalary: prefs.minSalary || 0,
        jobTypes: prefs.jobTypes || [],
      },
    });
    if (data) {
      setFilteredJobs(applyFilter(data.jobs || [], activeFilter));
      if (query) showToast(`Found ${(data.jobs || []).length} jobs for "${query}"`, 'default');
    }
  }, [state.preferences, activeFilter, loadJobs, applyFilter, showToast]);

  useImperativeHandle(ref, () => load, [load]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFilteredJobs(applyFilter(jobs, activeFilter));
  }, [activeFilter, jobs, applyFilter]);

  const handleSwipe = useCallback((dir, job) => {
    if (dir === 'right') {
      dispatch({ type: 'SAVE_JOB', payload: job });
      showToast(`Saved ${job.title}`, 'success');
    } else if (dir === 'left') {
      dispatch({ type: 'SET_PENDING_SKIP', payload: job });
    } else if (dir === 'down') {
      dispatch({ type: 'ARCHIVE_JOB', payload: job });
      showToast('Archived', 'archive');
    }
    dispatch({ type: 'INCREMENT_VIEWED' });
    setStackIdx(prev => prev + 1);

    // Flow: streak counter
    if (dir === lastSwipeDir.current) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(1);
    }
    lastSwipeDir.current = dir;

    if (navigator.vibrate) navigator.vibrate(dir === 'right' ? [40, 20, 40] : 25);
  }, [dispatch, showToast]);

  const handleDetails = useCallback((job) => {
    dispatch({ type: 'OPEN_MODAL', payload: job });
  }, [dispatch]);

  useKeyboardShortcuts({
    onSwipeLeft: () => CardStack.handleSwipe?.('left'),
    onSwipeRight: () => CardStack.handleSwipe?.('right'),
    onSwipeDown: () => CardStack.handleSwipe?.('down'),
    onOpenDetails: () => { if (CardStack.currentJob) handleDetails(CardStack.currentJob); },
    activeView: state.activeView,
    modalOpen: !!state.modalJob,
  });

  const progress = filteredJobs.length > 0 ? (stackIdx / filteredJobs.length) * 100 : 0;
  const progressPct = Math.min(100, Math.round(progress));
  // SVG progress ring for Zeigarnik counter
  const circumference = 2 * Math.PI * 8.5;
  const dashOffset = circumference - (circumference * progressPct / 100);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'fulltime', label: 'Full-time', icon: 'fa-briefcase' },
    { id: 'salary', label: 'Has Salary', icon: 'fa-dollar-sign' },
    { id: 'recent', label: 'This Week', icon: 'fa-star' },
  ];

  return (
    <div className={`view ${state.activeView === 'stack' ? 'active' : ''}`}>
      {/* Banner bar */}
      <div className={`view-header ${state.activeView === 'stack' ? 'active' : ''}`}>
        <div className="header-left">
          <h2>New Job Matches</h2>
          <span className="jobs-limit-badge">
            <strong>{filteredJobs.length}</strong>
            <span className="limit-sep">/</span>
            <strong>20</strong>
            <span className="limit-label">free</span>
            <span className="limit-upgrade">Upgrade</span>
          </span>
          <span className="reviewed-counter">
            <span className="counter-ring">
              <svg viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="8.5" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              </svg>
            </span>
            <strong>{stackIdx}</strong> of <strong>{filteredJobs.length}</strong> reviewed
          </span>
          {streak >= 3 && (
            <span className="streak-badge" key={streak}>
              <i className="fas fa-fire"></i> {streak}
            </span>
          )}
        </div>
        <div className="header-controls">
          {filters.map(f => (
            <button
              key={f.id}
              className={`filter-pill ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => { setActiveFilter(f.id); setStackIdx(0); setStreak(0); }}
            >
              {f.icon && <i className={`fas ${f.icon}`}></i>} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="stack-progress-container">
        <div className={`stack-progress ${progress > 75 ? 'near-complete' : ''}`} style={{ width: `${progress}%` }}></div>
        <div className="progress-milestones">
          <div className={`progress-milestone ${progress >= 25 ? 'reached' : ''}`}></div>
          <div className={`progress-milestone ${progress >= 50 ? 'reached' : ''}`}></div>
          <div className={`progress-milestone ${progress >= 75 ? 'reached' : ''}`}></div>
        </div>
        {filteredJobs.length > 0 && <span className="progress-label">{progressPct}%</span>}
      </div>

      {/* Card with navigation arrows */}
      <div className="stack-wrapper">
        {loading ? (
          <div className="card-stack-container">
            <div className="stack-loader">
              <div className="loader-spinner"></div>
              <p>Fetching live jobs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="card-stack-container">
            <div className="stack-placeholder error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Couldn't load jobs</h3>
              <p>Please check your connection and try again.</p>
              <button className="retry-btn" onClick={() => load()}>
                <i className="fas fa-sync-alt"></i> Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="nav-arrow nav-arrow-left" onClick={() => CardStack.handleSwipe?.('left')} aria-label="Previous">
              <i className="fas fa-chevron-left"></i>
            </button>
            <CardStack
              jobs={filteredJobs}
              onSwipe={handleSwipe}
              onOpenDetails={handleDetails}
            />
            <button className="nav-arrow nav-arrow-right" onClick={() => CardStack.handleSwipe?.('right')} aria-label="Next">
              <i className="fas fa-chevron-right"></i>
            </button>
          </>
        )}
      </div>

      {/* Circular action buttons */}
      <div className="stack-actions-circular">
        <div className="action-circle-group">
          <button className="action-circle circle-skip" onClick={() => CardStack.handleSwipe?.('left')} aria-label="Skip">
            <i className="fas fa-times"></i>
          </button>
          <span className="action-circle-label">Skip</span>
        </div>
        <div className="action-circle-group">
          <button className="action-circle circle-details" onClick={() => { if (CardStack.currentJob) handleDetails(CardStack.currentJob); }} aria-label="Details">
            <i className="fas fa-info-circle"></i>
          </button>
          <span className="action-circle-label">Details</span>
        </div>
        <div className="action-circle-group">
          <button className="action-circle circle-save" onClick={() => CardStack.handleSwipe?.('right')} aria-label="Save">
            <i className="fas fa-heart"></i>
          </button>
          <span className="action-circle-label">Save</span>
        </div>
      </div>

      <div className="keyboard-hints">
        <span><kbd>&larr;</kbd> Skip</span>
        <span><kbd>&darr;</kbd> Archive</span>
        <span><kbd>&rarr;</kbd> Save</span>
        <span><kbd>Space</kbd> Details</span>
      </div>
    </div>
  );
});

export default StackView;
