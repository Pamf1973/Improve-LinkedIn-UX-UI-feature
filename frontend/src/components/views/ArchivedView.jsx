import { useApp } from '../../context/AppContext';
import JobGridCard from '../shared/JobGridCard';

export default function ArchivedView() {
  const { state, dispatch, showToast } = useApp();

  const clearAll = () => {
    if (state.archivedJobs.length === 0) return;
    dispatch({ type: 'CLEAR_ARCHIVED' });
    showToast('Archived jobs cleared', 'default');
  };

  return (
    <div className={`view ${state.activeView === 'archived' ? 'active' : ''}`}>
      <div className={`view-header ${state.activeView === 'archived' ? 'active' : ''}`}>
        <div className="header-left">
          <h2>Archived</h2>
          <span className="jobs-count">{state.archivedJobs.length} job{state.archivedJobs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="header-controls">
          <button className="clear-all-btn" onClick={clearAll}>
            <i className="fas fa-trash-alt"></i> Clear All
          </button>
        </div>
      </div>
      <div className="jobs-grid">
        {state.archivedJobs.length === 0 ? (
          <div className="grid-empty">
            <i className="fas fa-archive"></i>
            <h3>No archived jobs</h3>
            <p>Swipe down on jobs to archive them for later.</p>
          </div>
        ) : (
          state.archivedJobs.map(job => <JobGridCard key={job.id} job={job} context="archived" />)
        )}
      </div>
    </div>
  );
}
