import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SKIP_REASONS } from '../../constants';

const AUTO_DISMISS_MS = 4000;

export default function SkipReasonModal() {
  const { state, dispatch, showToast } = useApp();
  const job = state.pendingSkipJob;
  const timerRef = useRef(null);
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS);

  useEffect(() => {
    if (!job) return;
    setRemaining(AUTO_DISMISS_MS);

    const start = Date.now();
    const tick = setInterval(() => {
      const left = AUTO_DISMISS_MS - (Date.now() - start);
      setRemaining(Math.max(0, left));
    }, 200);

    timerRef.current = setTimeout(() => {
      selectReason('other');
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(tick);
    };
  }, [job?.id]);

  const selectReason = (reasonId) => {
    if (!job) return;
    clearTimeout(timerRef.current);
    const reason = SKIP_REASONS.find(r => r.id === reasonId);
    dispatch({ type: 'SKIP_JOB', payload: { job, skipReason: reasonId } });
    dispatch({ type: 'CLEAR_PENDING_SKIP' });
    showToast(`Skipped — ${reason?.label || 'Other'}`, 'skip');
  };

  if (!job) return null;

  return (
    <div className="skip-reason-overlay" onClick={() => selectReason('other')}>
      <div className="skip-reason-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Why skip this job?</h3>
        <p className="skip-timer">Auto-skips in {Math.ceil(remaining / 1000)}s</p>
        <div className="skip-reason-buttons">
          {SKIP_REASONS.map(r => (
            <button key={r.id} className="skip-reason-btn" onClick={() => selectReason(r.id)}>
              <i className={`fas ${r.icon}`}></i>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
