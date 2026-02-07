import { useApp } from '../../context/AppContext';
import { logoUrl } from '../../constants';

export default function RightPanel() {
  const { state, dispatch, showToast } = useApp();
  const saved = state.savedJobs;

  const openNext = () => {
    const next = saved.find(j => j.url && !j.opened);
    if (!next) { showToast('All links opened!', 'default'); return; }
    window.open(next.url, '_blank');
    dispatch({ type: 'MARK_OPENED', payload: next.id });
    showToast(`Opened ${next.company}`, 'success');
  };

  return (
    <aside className="sidebar-right">
      <div className="saved-jobs-panel">
        <div className="panel-header">
          <h3><i className="fas fa-heart"></i> Saved</h3>
          <span className="saved-count">{saved.length}</span>
        </div>
        <div className="saved-jobs-list">
          {saved.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-arrow-left"></i>
              <p>Swipe right on jobs you like</p>
            </div>
          ) : (
            saved.slice(0, 5).map(job => (
              <div className="saved-job-item" key={job.id}>
                <div className="saved-job-header">
                  <img src={job.logo} alt="" className="saved-job-logo" onError={(e) => { e.target.src = logoUrl(job.company); }} />
                  <div className="saved-job-info">
                    <h4>{job.title}</h4>
                    <span>{job.company}</span>
                  </div>
                </div>
                <div className="saved-job-meta">
                  {job.salary && <span className="meta-tag salary">{job.salary}</span>}
                  <span className="meta-tag remote"><i className="fas fa-wifi"></i> Remote</span>
                </div>
                <div className="saved-job-actions">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`apply-link-btn ${job.opened ? 'opened' : ''}`}
                      onClick={() => dispatch({ type: 'MARK_OPENED', payload: job.id })}
                    >
                      <i className={`fas ${job.opened ? 'fa-check' : 'fa-external-link-alt'}`}></i>
                      {job.opened ? 'Opened' : 'Apply'}
                    </a>
                  )}
                  <button className="remove-saved-btn" onClick={() => dispatch({ type: 'REMOVE_SAVED', payload: job.id })}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {saved.length > 0 && (
          <div className="panel-footer">
            <button className="apply-all-btn" onClick={openNext}>
              <i className="fas fa-external-link-alt"></i>
              Open Next ({saved.length} saved)
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
