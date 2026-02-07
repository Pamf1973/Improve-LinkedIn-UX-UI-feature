import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

export default function Navbar({ onSearch }) {
  const { state, toggleTheme, dispatch } = useApp();
  const [query, setQuery] = useState('');
  const timerRef = useRef(null);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(val.trim()), 600);
  }, [onSearch]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(timerRef.current);
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const tabs = [
    { id: 'stack', icon: 'fa-layer-group', label: 'Stack' },
    { id: 'saved', icon: 'fa-bookmark', label: 'Saved', badge: state.savedJobs.length },
    { id: 'skipped', icon: 'fa-forward', label: 'Skipped', badge: state.skippedJobs.length },
    { id: 'archived', icon: 'fa-archive', label: 'Archived', badge: state.archivedJobs.length },
    { id: 'preferences', icon: 'fa-sliders-h', label: 'Prefs' },
  ];

  return (
    <>
      <nav className="linkedin-nav">
        <div className="nav-content">
          <div className="nav-left">
            <div className="logo-mark">
              <span className="logo-icon">M</span>
              <span className="logo-text">MatchPoint</span>
            </div>
            <div className="nav-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search real jobs — try react, python, design..."
                value={query}
                onChange={handleInput}
                onKeyDown={handleKey}
              />
            </div>
          </div>
          {/* Serial Position Effect: Jobs first (most important), Me last (most remembered) */}
          <div className="nav-right">
            <div className="nav-item active"><i className="fas fa-briefcase"></i><span>Jobs</span></div>
            <div className="nav-item"><i className="fas fa-home"></i><span>Home</span></div>
            <div className="nav-item"><i className="fas fa-users"></i><span>Network</span></div>
            <div className="nav-item"><i className="fas fa-comment-dots"></i><span>Messages</span></div>
            <div className="nav-item notification-badge" data-count="3"><i className="fas fa-bell"></i><span>Alerts</span></div>
            {state.user ? (
              <div className="nav-item profile-nav" onClick={() => dispatch({ type: 'SWITCH_VIEW', payload: 'preferences' })}>
                {state.user.picture ? (
                  <img src={state.user.picture} alt="" className="nav-avatar-img" referrerPolicy="no-referrer" />
                ) : (
                  <div className="nav-avatar">{(state.user.firstName?.[0] || state.user.name?.[0] || 'U').toUpperCase()}</div>
                )}
                <span>{state.user.firstName || 'Me'}</span>
              </div>
            ) : (
              <a href="/api/auth/linkedin" className="nav-item linkedin-signin">
                <i className="fab fa-linkedin"></i>
                <span>Sign in</span>
              </a>
            )}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
              <i className={state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Jakob's Law — Mobile bottom tab bar (familiar pattern) */}
      <div className="mobile-tab-bar">
        <div className="mobile-tab-bar-inner">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`mobile-tab ${state.activeView === t.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SWITCH_VIEW', payload: t.id })}
            >
              <i className={`fas ${t.icon}`}></i>
              <span>{t.label}</span>
              {t.badge > 0 && <span className="tab-badge">{t.badge}</span>}
            </button>
          ))}
          <button className="mobile-tab" onClick={toggleTheme}>
            <i className={state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
            <span>Theme</span>
          </button>
        </div>
      </div>
    </>
  );
}
