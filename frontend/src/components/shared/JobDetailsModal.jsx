import { useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useApp } from '../../context/AppContext';
import { logoUrl } from '../../constants';

export default function JobDetailsModal({ onSkip, onSave }) {
  const { state, dispatch, showToast } = useApp();
  const job = state.modalJob;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && job) dispatch({ type: 'CLOSE_MODAL' }); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [job, dispatch]);

  if (!job) return null;

  const close = () => dispatch({ type: 'CLOSE_MODAL' });
  const desc = job.isHtml
    ? DOMPurify.sanitize(job.description)
    : job.description.replace(/\n\n/g, '<br><br>').replace(/### (.*)/g, '<h3>$1</h3>');

  return (
    <div className={`modal ${job ? 'active' : ''}`}>
      <div className="modal-overlay" onClick={close}></div>
      <div className="modal-content">
        <button className="close-modal" onClick={close} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>
        <div className="modal-body">
          <div className="modal-company-header">
            <img src={job.logo} alt="" className="modal-company-logo" onError={(e) => { e.target.src = logoUrl(job.company); }} />
            <div className="modal-company-info">
              <h1>{job.title}</h1>
              <span>{job.company}</span>
            </div>
          </div>
          <div className="modal-meta">
            {job.salary && <span className="meta-tag salary"><i className="fas fa-dollar-sign"></i> {job.salary}</span>}
            <span className="meta-tag"><i className="fas fa-map-marker-alt"></i> {job.location}</span>
            <span className="meta-tag remote"><i className="fas fa-wifi"></i> Remote</span>
            <span className="meta-tag job-type-tag"><i className="fas fa-briefcase"></i> {job.jobType}</span>
            {job.category && <span className="meta-tag category-tag"><i className="fas fa-tag"></i> {job.category}</span>}
            <span className="meta-tag source-tag"><i className="fas fa-globe"></i> {job.source || 'live'}</span>
          </div>

          {job.url && (
            <div className="modal-apply-banner">
              <div className="apply-banner-info">
                <i className="fas fa-external-link-alt"></i>
                <div><strong>Real job listing</strong><span>Apply directly to {job.company}</span></div>
              </div>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="apply-banner-btn">
                Apply Now <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          )}

          <div className="modal-section">
            <div className="modal-section-title">Match Score</div>
            <div className="match-bar-row">
              <div className="match-score" style={{ width: 64, height: 64 }}>
                <span className="score">{job.match}%</span>
                <span className="label">Match</span>
              </div>
              <div className="match-bar-col">
                <div className="match-bar-track">
                  <div className="match-bar-fill" style={{ width: `${job.match}%` }}></div>
                </div>
                <p>{(job.userSkillMatch || []).length} of {job.skills.length} skills match your profile</p>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-title">About the Role</div>
            <div className="modal-description job-description-html" dangerouslySetInnerHTML={{ __html: desc }}></div>
          </div>

          {job.skills.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Skills & Tags</div>
              <div className="skills-tags">
                {job.skills.map(s => (
                  <span key={s} className={`skill-tag ${(job.userSkillMatch || []).includes(s) ? 'match' : ''}`}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {job.url && (
            <div className="modal-section modal-cta-section">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="modal-full-apply-btn">
                <i className="fas fa-external-link-alt"></i> View Full Listing & Apply
              </a>
              <p className="modal-cta-note">Opens the full job posting where you can apply directly.</p>
            </div>
          )}

          {job.linkedinSearchUrl && (
            <div className="modal-section" style={{ textAlign: 'center' }}>
              <a href={job.linkedinSearchUrl} target="_blank" rel="noopener noreferrer" className="grid-action-btn restore" style={{ display: 'inline-flex', padding: '.5rem 1rem' }}>
                <i className="fab fa-linkedin"></i> Search on LinkedIn
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn btn-skip-modal" onClick={() => { close(); onSkip?.(); }}>
            <i className="fas fa-times"></i> Skip
          </button>
          {job.url && (
            <a className="modal-btn btn-apply-modal" href={job.url} target="_blank" rel="noopener noreferrer"
               onClick={() => showToast(`Opening ${job.company}...`, 'success')}>
              <i className="fas fa-external-link-alt"></i> Apply
            </a>
          )}
          <button className="modal-btn btn-save-modal" onClick={() => { close(); onSave?.(); }}>
            <i className="fas fa-heart"></i> Save
          </button>
        </div>
      </div>
    </div>
  );
}
