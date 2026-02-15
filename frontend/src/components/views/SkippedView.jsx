import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SKIP_REASONS } from '../../constants';
import JobGridCard from '../shared/JobGridCard';

export default function SkippedView() {
  const { state, dispatch, showToast } = useApp();
  const [viewMode, setViewMode] = useState('reason');

  const clearAll = () => {
    if (state.skippedJobs.length === 0) return;
    dispatch({ type: 'CLEAR_SKIPPED' });
    showToast('Skipped jobs cleared', 'default');
  };

  const grouped = SKIP_REASONS.map(r => ({
    ...r,
    jobs: state.skippedJobs.filter(j => j.skipReason === r.id),
  })).filter(g => g.jobs.length > 0);

  return (
    <div className={`view ${state.activeView === 'skipped' ? 'active' : ''}`}>
      <div className={`view-header ${state.activeView === 'skipped' ? 'active' : ''}`}>
        <div className="header-left">
          <h2>Skipped</h2>
          <span className="jobs-count">{state.skippedJobs.length} job{state.skippedJobs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="header-controls">
          <button
            className={`sort-pill ${viewMode === 'reason' ? 'active' : ''}`}
            onClick={() => setViewMode('reason')}
          >
            <i className="fas fa-layer-group"></i> By Reason
          </button>
          <button
            className={`sort-pill ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <i className="fas fa-th"></i> All
          </button>
          <button className="clear-all-btn" onClick={clearAll}>
            <i className="fas fa-trash-alt"></i> Clear All
          </button>
        </div>
      </div>

      {state.skippedJobs.length === 0 ? (
        <div className="jobs-grid">
          <div className="grid-empty">
            <i className="fas fa-forward"></i>
            <h3>No skipped jobs</h3>
            <p>When you swipe left to skip a job, it'll appear here with the reason you skipped it.</p>
          </div>
        </div>
      ) : viewMode === 'all' ? (
        <div className="jobs-grid">
          {state.skippedJobs.map(job => (
            <JobGridCard key={job.id} job={job} context="skipped" />
          ))}
        </div>
      ) : (
        <div className="saved-groups">
          {grouped.map(group => (
            <div key={group.id}>
              <div className="saved-group-header">
                <i className={`fas ${group.icon}`}></i>
                <span className="saved-group-label">{group.label}</span>
                <span className="saved-group-count">{group.jobs.length}</span>
              </div>
              <div className="jobs-grid">
                {group.jobs.map(job => (
                  <JobGridCard key={job.id} job={job} context="skipped" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
