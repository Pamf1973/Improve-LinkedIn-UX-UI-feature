import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchCategories, fetchJobTypes } from '../../api/jobsApi';

const SUGGESTED_SKILLS = [
  'React', 'Python', 'JavaScript', 'TypeScript', 'Node.js',
  'Figma', 'SQL', 'AWS', 'Docker', 'GraphQL',
  'Swift', 'Kotlin', 'Go', 'Rust', 'Vue',
];

export default function PreferencesView({ onSavePrefs }) {
  const { state, dispatch, showToast } = useApp();
  const prefs = state.preferences;
  const [categories, setCategories] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [draftPrefs, setDraftPrefs] = useState(prefs);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchJobTypes().then(setJobTypes).catch(() => {});
  }, []);

  useEffect(() => {
    setDraftPrefs(prefs);
  }, [prefs]);

  const updatePref = (key, value) => {
    setDraftPrefs(prev => ({ ...prev, [key]: value }));
  };

  const addSkill = (val) => {
    const v = (val || skillInput).trim();
    if (v && !draftPrefs.skills.includes(v)) {
      updatePref('skills', [...draftPrefs.skills, v.charAt(0).toUpperCase() + v.slice(1)]);
    }
    setSkillInput('');
  };

  const removeSkill = (s) => {
    updatePref('skills', draftPrefs.skills.filter(sk => sk !== s));
  };

  const toggleCategory = (id) => {
    const cats = draftPrefs.categories.includes(id)
      ? draftPrefs.categories.filter(c => c !== id)
      : [...draftPrefs.categories, id];
    updatePref('categories', cats);
  };

  const toggleJobType = (id) => {
    const types = draftPrefs.jobTypes.includes(id)
      ? draftPrefs.jobTypes.filter(t => t !== id)
      : [...draftPrefs.jobTypes, id];
    updatePref('jobTypes', types);
  };

  const isSameArray = (a, b) => (
    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
  );

  const isDirty = useMemo(() => {
    return !(
      isSameArray(draftPrefs.skills, prefs.skills) &&
      isSameArray(draftPrefs.categories, prefs.categories) &&
      isSameArray(draftPrefs.jobTypes, prefs.jobTypes) &&
      draftPrefs.minSalary === prefs.minSalary
    );
  }, [draftPrefs, prefs]);

  const handleSave = () => {
    if (!isDirty) return;
    dispatch({ type: 'UPDATE_PREFERENCES', payload: draftPrefs });
    showToast('Preferences saved! Refreshing jobs...', 'success');
    dispatch({ type: 'SWITCH_VIEW', payload: 'stack' });
    onSavePrefs?.();
  };

  // Hick's Law: only show skills not already added
  const availableSuggestions = SUGGESTED_SKILLS.filter(s => !draftPrefs.skills.includes(s));

  const syncFromProfile = () => {
    if (!state.user) return;
    const source = `${state.user.title || ''} ${state.user.headline || ''}`.trim();
    const tokens = source
      .split(/[\s,./()+-]+/)
      .map(t => t.trim())
      .filter(Boolean);
    const matched = SUGGESTED_SKILLS.filter(s => tokens.some(t => t.toLowerCase() === s.toLowerCase()));
    const merged = Array.from(new Set([...draftPrefs.skills, ...matched]));
    updatePref('skills', merged);
    showToast('Synced skills from your LinkedIn profile', 'success');
  };

  return (
    <div className={`view ${state.activeView === 'preferences' ? 'active' : ''}`}>
      <div className={`view-header ${state.activeView === 'preferences' ? 'active' : ''}`}>
        <div className="header-left">
          <h2>Preferences</h2>
          <span className="jobs-count">Customize your job discovery</span>
        </div>
        <div className="header-controls">
          {isDirty && <span className="unsaved-indicator">Unsaved changes</span>}
          <button className="prefs-cancel-btn" onClick={() => setDraftPrefs(prefs)} disabled={!isDirty}>
            Cancel
          </button>
          <button className="save-prefs-btn inline" onClick={handleSave} disabled={!isDirty}>
            <i className="fas fa-check-circle"></i> Save
          </button>
        </div>
      </div>
      <div className="prefs-grid">
        <div className="prefs-card">
          <h3><i className="fab fa-linkedin"></i> LinkedIn Profile</h3>
          <p className="prefs-desc">Keep your preferences aligned with your profile.</p>
          {state.user ? (
            <div className="profile-sync">
              <div className="profile-sync-info">
                <span className="profile-sync-name">{state.user.name}</span>
                <span className="profile-sync-title">{state.user.title || 'Profile headline'}</span>
                <span className="profile-sync-location">{state.user.location || 'Location'}</span>
              </div>
              <button className="profile-sync-btn" onClick={syncFromProfile}>
                <i className="fas fa-rotate"></i> Sync skills
              </button>
            </div>
          ) : (
            <div className="profile-sync-empty">
              <span>Connect LinkedIn to auto-fill skills and preferences.</span>
            </div>
          )}
        </div>

        <div className="prefs-card">
          <h3><i className="fas fa-user-tag"></i> Your Skills</h3>
          <p className="prefs-desc">Add skills to improve match accuracy. Press Enter to add.</p>
          <div className="skill-input-row">
            <input
              type="text"
              placeholder="e.g. React, Figma, Python..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            />
          </div>
          {/* Hick's Law: quick-add suggested skills to reduce decision time */}
          {availableSuggestions.length > 0 && (
            <div className="quick-add-section">
              <div className="quick-add-label">Popular skills</div>
              <div className="quick-add-chips">
                {availableSuggestions.slice(0, 8).map(s => (
                  <button key={s} className="quick-add-chip" onClick={() => addSkill(s)}>
                    <i className="fas fa-plus"></i> {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="user-skills-tags">
            {draftPrefs.skills.map(s => (
              <span key={s} className="editable-tag">
                {s}
                <button onClick={() => removeSkill(s)}><i className="fas fa-times"></i></button>
              </span>
            ))}
          </div>
        </div>

        <div className="prefs-card">
          <h3><i className="fas fa-th-large"></i> Job Categories</h3>
          <p className="prefs-desc">Select categories to discover relevant jobs</p>
          <div className="category-grid">
            {categories.map(c => (
              <label key={c.id} className={`cat-option ${draftPrefs.categories.includes(c.id) ? 'selected' : ''}`}
                     onClick={() => toggleCategory(c.id)}>
                <input type="checkbox" readOnly checked={draftPrefs.categories.includes(c.id)} />
                <i className={`fas ${c.icon}`}></i>
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="prefs-card">
          <h3><i className="fas fa-dollar-sign"></i> Minimum Salary</h3>
          <p className="prefs-desc">Only show jobs above this threshold</p>
          <div className="salary-range">
            <input
              type="range"
              min="0" max="200000" step="10000"
              value={draftPrefs.minSalary}
              onChange={(e) => updatePref('minSalary', parseInt(e.target.value))}
            />
            <div className="salary-labels">
              <span>Any</span>
              <span className="salary-display">{draftPrefs.minSalary > 0 ? `$${(draftPrefs.minSalary / 1000).toFixed(0)}K+` : 'Any salary'}</span>
              <span>$200K+</span>
            </div>
          </div>
        </div>

        <div className="prefs-card">
          <h3><i className="fas fa-list-check"></i> Job Types</h3>
          <p className="prefs-desc">Which types of positions interest you?</p>
          <div className="job-types-grid">
            {jobTypes.map(t => (
              <label key={t.id} className={`type-option ${draftPrefs.jobTypes.includes(t.id) ? 'selected' : ''}`}
                     onClick={() => toggleJobType(t.id)}>
                <input type="checkbox" readOnly checked={draftPrefs.jobTypes.includes(t.id)} />
                <i className={`fas ${t.icon}`}></i>
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="save-prefs-btn" onClick={handleSave} disabled={!isDirty}>
          <i className="fas fa-check-circle"></i> Save Preferences & Refresh Jobs
        </button>
      </div>
    </div>
  );
}
