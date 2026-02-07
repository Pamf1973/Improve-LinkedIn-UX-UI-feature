import { useApp } from '../../context/AppContext';
import { logoUrl, SKIP_REASONS } from '../../constants';

export default function JobGridCard({ job, context }) {
  const { dispatch, showToast } = useApp();

  const handleRestore = () => {
    if (context === 'skipped') {
      dispatch({ type: 'RESTORE_FROM_SKIPPED', payload: job.id });
    } else {
      dispatch({ type: 'RESTORE_FROM_ARCHIVE', payload: job.id });
    }
    showToast(`Moved "${job.title}" to saved`, 'success');
  };

  return (
    <div className="grid-card">
      <div className="grid-card-top">
        <img src={job.logo} alt="" className="grid-card-logo" onError={(e) => { e.target.src = logoUrl(job.company); }} />
        <div className="grid-card-match">{job.match}%</div>
      </div>
      <h3 className="grid-card-title">{job.title}</h3>
      <p className="grid-card-company">{job.company}</p>
      <div className="grid-card-meta">
        {job.salary && <span className="meta-tag salary">{job.salary}</span>}
        <span className="meta-tag">{job.location}</span>
      </div>
      <div className="grid-card-skills">
        {(job.skills || []).slice(0, 3).map(s => (
          <span key={s} className={`skill-chip ${(job.userSkillMatch || []).includes(s) ? 'match' : ''}`}>{s}</span>
        ))}
      </div>
      <div className="grid-card-actions">
        {context === 'saved' && (
          <>
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="grid-apply-btn"
                 onClick={() => dispatch({ type: 'MARK_OPENED', payload: job.id })}>
                <i className="fas fa-external-link-alt"></i> Apply
              </a>
            )}
            <button className="grid-action-btn remove" onClick={() => dispatch({ type: 'REMOVE_SAVED', payload: job.id })}>
              <i className="fas fa-trash-alt"></i>
            </button>
          </>
        )}
        {context === 'archived' && (
          <>
            <button className="grid-action-btn restore" onClick={handleRestore}>
              <i className="fas fa-undo"></i> Restore
            </button>
            <button className="grid-action-btn remove" onClick={() => dispatch({ type: 'REMOVE_ARCHIVED', payload: job.id })}>
              <i className="fas fa-trash-alt"></i>
            </button>
          </>
        )}
        {context === 'skipped' && (
          <>
            {job.skipReason && (() => {
              const reason = SKIP_REASONS.find(r => r.id === job.skipReason);
              return reason ? (
                <span className="skip-reason-badge">
                  <i className={`fas ${reason.icon}`}></i> {reason.label}
                </span>
              ) : null;
            })()}
            <button className="grid-action-btn restore" onClick={handleRestore}>
              <i className="fas fa-heart"></i> Save
            </button>
            <button className="grid-action-btn remove" onClick={() => dispatch({ type: 'REMOVE_SKIPPED', payload: job.id })}>
              <i className="fas fa-trash-alt"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
