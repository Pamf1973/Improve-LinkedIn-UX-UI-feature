import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import JobGridCard from '../shared/JobGridCard';

/* Cognitive Load: group jobs into time-based sections
   so users scan smaller chunks instead of a flat list */
function groupByDate(jobs) {
  const now = Date.now();
  const DAY = 86400000;
  const groups = { today: [], thisWeek: [], earlier: [] };

  jobs.forEach(job => {
    const saved = job.savedAt || now;
    const age = now - saved;
    if (age < DAY) groups.today.push(job);
    else if (age < 7 * DAY) groups.thisWeek.push(job);
    else groups.earlier.push(job);
  });

  return [
    { key: 'today', label: 'Today', icon: 'fa-clock', jobs: groups.today },
    { key: 'thisWeek', label: 'This Week', icon: 'fa-calendar-week', jobs: groups.thisWeek },
    { key: 'earlier', label: 'Earlier', icon: 'fa-calendar-alt', jobs: groups.earlier },
  ].filter(g => g.jobs.length > 0);
}

export default function SavedView() {
  const { state } = useApp();
  const [sortBy, setSortBy] = useState('recent');

  const sorted = useMemo(() => {
    const list = [...state.savedJobs];
    if (sortBy === 'match') list.sort((a, b) => b.match - a.match);
    else if (sortBy === 'salary') list.sort((a, b) => (b.salaryMin || 0) - (a.salaryMin || 0));
    return list;
  }, [state.savedJobs, sortBy]);

  const groups = useMemo(() => groupByDate(sorted), [sorted]);

  const sortOptions = [
    { id: 'recent', label: 'Recent', icon: 'fa-clock' },
    { id: 'match', label: 'Best Match', icon: 'fa-fire' },
    { id: 'salary', label: 'Highest Pay', icon: 'fa-arrow-up' },
  ];

  return (
    <div className={`view ${state.activeView === 'saved' ? 'active' : ''}`}>
      <div className={`view-header ${state.activeView === 'saved' ? 'active' : ''}`}>
        <div className="header-left">
          <h2>Saved Jobs</h2>
          <span className="jobs-count">{state.savedJobs.length} job{state.savedJobs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="header-controls">
          {sortOptions.map(s => (
            <button key={s.id} className={`sort-pill ${sortBy === s.id ? 'active' : ''}`} onClick={() => setSortBy(s.id)}>
              <i className={`fas ${s.icon}`}></i> {s.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="jobs-grid">
          <div className="grid-empty">
            <i className="fas fa-bookmark"></i>
            <h3>No saved jobs yet</h3>
            <p>Swipe right on jobs you like and they'll appear here.</p>
          </div>
        </div>
      ) : (
        /* Cognitive Load: chunked date groups reduce scanning effort */
        <div className="saved-groups">
          {groups.map(g => (
            <div key={g.key} className="saved-group">
              <div className="saved-group-header">
                <i className={`fas ${g.icon}`}></i>
                <span className="saved-group-label">{g.label}</span>
                <span className="saved-group-count">{g.jobs.length}</span>
              </div>
              <div className="jobs-grid">
                {g.jobs.map(job => <JobGridCard key={job.id} job={job} context="saved" />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
