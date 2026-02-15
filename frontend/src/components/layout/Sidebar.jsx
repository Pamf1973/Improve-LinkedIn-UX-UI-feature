import { useApp } from '../../context/AppContext';

const views = [
  { id: 'stack', icon: 'fa-layer-group', label: 'Job Stack', badgeKey: 'stack' },
  { id: 'saved', icon: 'fa-bookmark', label: 'Saved Jobs', badgeKey: 'saved' },
  { id: 'skipped', icon: 'fa-forward', label: 'Skipped', badgeKey: 'skipped' },
  { id: 'archived', icon: 'fa-archive', label: 'Archived', badgeKey: 'archived' },
  { id: 'preferences', icon: 'fa-sliders-h', label: 'Preferences' },
];

export default function Sidebar({ stackCount }) {
  const { state, dispatch } = useApp();

  const badgeCounts = {
    stack: stackCount || 0,
    saved: state.savedJobs.length,
    skipped: state.skippedJobs.length,
    archived: state.archivedJobs.length,
  };

  return (
    <aside className="sidebar-left">
      <div className="sidebar-card profile-card">
        <div className="profile-bg"></div>
        <div className="profile-info">
          {state.user?.picture ? (
            <img src={state.user.picture} alt="" className="profile-avatar-img" referrerPolicy="no-referrer" />
          ) : (
            <div className="profile-avatar">
              {state.user ? (state.user.firstName?.[0] || state.user.name?.[0] || 'U').toUpperCase() : 'JD'}
            </div>
          )}
          <h3>{state.user?.name || 'Jane Doe'}</h3>
          <p>{state.user?.title || state.user?.email || 'Product Designer'}</p>
          <span className="profile-location">{state.user?.location || 'San Francisco Bay Area'}</span>
          {state.user && (
            <button className="logout-btn" onClick={() => dispatch({ type: 'LOGOUT' })}>
              <i className="fas fa-sign-out-alt"></i> Sign out
            </button>
          )}
          {!state.user && (
            <a href="/api/auth/linkedin" className="linkedin-connect-btn">
              <i className="fab fa-linkedin"></i> Connect LinkedIn
            </a>
          )}
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-num">{state.viewedCount}</span>
              <span className="stat-label">Viewed</span>
            </div>
            <div className="stat">
              <span className="stat-num">{state.savedJobs.length}</span>
              <span className="stat-label">Saved</span>
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar-card">
        <ul className="sidebar-links">
          {views.map(v => (
            <li
              key={v.id}
              className={state.activeView === v.id ? 'active' : ''}
              onClick={() => dispatch({ type: 'SWITCH_VIEW', payload: v.id })}
            >
              <i className={`fas ${v.icon}`}></i>
              <span className="link-text">{v.label}</span>
              {v.badgeKey && badgeCounts[v.badgeKey] > 0 && (
                <span className="nav-badge">{badgeCounts[v.badgeKey]}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="sidebar-card api-credit">
        <div className="api-credit-inner">
          <span className="live-dot"></span>
          <span>Live data from</span>
        </div>
        <div className="api-credit-links">
          <a href="https://remotive.com" target="_blank" rel="noopener">Remotive</a>
          <span> & </span>
          <a href="https://www.arbeitnow.com" target="_blank" rel="noopener">Arbeitnow</a>
        </div>
      </div>
    </aside>
  );
}
