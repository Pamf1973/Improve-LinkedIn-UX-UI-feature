import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

const AppContext = createContext(null);

const PREFIX = 'mp_';
function lsGet(k, fallback) {
  try { const v = localStorage.getItem(PREFIX + k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(k, v) { localStorage.setItem(PREFIX + k, JSON.stringify(v)); }

const DEFAULT_PREFS = {
  skills: ['JavaScript', 'React', 'Design', 'Figma', 'CSS', 'Python'],
  categories: ['software-dev', 'design'],
  minSalary: 0,
  jobTypes: ['full_time', 'contract'],
};

const MOCK_USER = {
  name: 'Morgan Park',
  firstName: 'Morgan',
  lastName: 'Park',
  title: 'Senior Product Designer · Growth & Platform',
  location: 'Seattle, Washington, United States',
  headline: 'Designing systems that turn complex workflows into calm, confident decisions',
  picture: 'https://ui-avatars.com/api/?name=Morgan%20Park&background=0a66c2&color=fff&size=100&bold=true',
  isMock: true,
};

const initialState = {
  activeView: 'stack',
  savedJobs: lsGet('saved', []),
  archivedJobs: lsGet('archived', []),
  skippedJobs: lsGet('skipped', []),
  pendingSkipJob: null,
  preferences: lsGet('prefs', DEFAULT_PREFS),
  viewedCount: parseInt(lsGet('viewedCount', '0')) || 0,
  toasts: [],
  modalJob: null,
  theme: lsGet('theme', 'light'),
  user: lsGet('user', MOCK_USER),
};

let toastId = 0;

function reducer(state, action) {
  switch (action.type) {
    case 'SWITCH_VIEW':
      return { ...state, activeView: action.payload };

    case 'SAVE_JOB': {
      if (state.savedJobs.find(j => j.id === action.payload.id)) return state;
      const saved = [{ ...action.payload, opened: false, savedAt: Date.now() }, ...state.savedJobs];
      lsSet('saved', saved);
      return { ...state, savedJobs: saved };
    }
    case 'REMOVE_SAVED': {
      const saved = state.savedJobs.filter(j => j.id !== action.payload);
      lsSet('saved', saved);
      return { ...state, savedJobs: saved };
    }
    case 'MARK_OPENED': {
      const saved = state.savedJobs.map(j => j.id === action.payload ? { ...j, opened: true } : j);
      lsSet('saved', saved);
      return { ...state, savedJobs: saved };
    }

    case 'ARCHIVE_JOB': {
      if (state.archivedJobs.find(j => j.id === action.payload.id)) return state;
      const archived = [{ ...action.payload, archivedAt: Date.now() }, ...state.archivedJobs];
      lsSet('archived', archived);
      return { ...state, archivedJobs: archived };
    }
    case 'REMOVE_ARCHIVED': {
      const archived = state.archivedJobs.filter(j => j.id !== action.payload);
      lsSet('archived', archived);
      return { ...state, archivedJobs: archived };
    }
    case 'RESTORE_FROM_ARCHIVE': {
      const job = state.archivedJobs.find(j => j.id === action.payload);
      if (!job) return state;
      const archived = state.archivedJobs.filter(j => j.id !== action.payload);
      const saved = [{ ...job, opened: false, savedAt: Date.now() }, ...state.savedJobs];
      lsSet('archived', archived);
      lsSet('saved', saved);
      return { ...state, archivedJobs: archived, savedJobs: saved };
    }
    case 'CLEAR_ARCHIVED':
      lsSet('archived', []);
      return { ...state, archivedJobs: [] };

    case 'UPDATE_PREFERENCES': {
      const prefs = { ...state.preferences, ...action.payload };
      lsSet('prefs', prefs);
      return { ...state, preferences: prefs };
    }

    case 'SHOW_TOAST':
      return { ...state, toasts: [...state.toasts, { id: ++toastId, ...action.payload }] };
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    case 'OPEN_MODAL':
      return { ...state, modalJob: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, modalJob: null };

    case 'INCREMENT_VIEWED': {
      const count = state.viewedCount + 1;
      lsSet('viewedCount', count);
      return { ...state, viewedCount: count };
    }

    case 'SET_THEME': {
      lsSet('theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
      return { ...state, theme: action.payload };
    }

    case 'SET_PENDING_SKIP':
      return { ...state, pendingSkipJob: action.payload };
    case 'CLEAR_PENDING_SKIP':
      return { ...state, pendingSkipJob: null };

    case 'SKIP_JOB': {
      const { job, skipReason } = action.payload;
      if (state.skippedJobs.find(j => j.id === job.id)) return state;
      const skipped = [{ ...job, skipReason, skippedAt: Date.now() }, ...state.skippedJobs].slice(0, 100);
      lsSet('skipped', skipped);
      return { ...state, skippedJobs: skipped };
    }
    case 'REMOVE_SKIPPED': {
      const skipped = state.skippedJobs.filter(j => j.id !== action.payload);
      lsSet('skipped', skipped);
      return { ...state, skippedJobs: skipped };
    }
    case 'RESTORE_FROM_SKIPPED': {
      const job = state.skippedJobs.find(j => j.id === action.payload);
      if (!job) return state;
      const skipped = state.skippedJobs.filter(j => j.id !== action.payload);
      const saved = [{ ...job, opened: false, savedAt: Date.now() }, ...state.savedJobs];
      lsSet('skipped', skipped);
      lsSet('saved', saved);
      return { ...state, skippedJobs: skipped, savedJobs: saved };
    }
    case 'CLEAR_SKIPPED':
      lsSet('skipped', []);
      return { ...state, skippedJobs: [] };

    case 'SET_USER': {
      lsSet('user', action.payload);
      return { ...state, user: action.payload };
    }
    case 'LOGOUT':
      lsSet('user', null);
      return { ...state, user: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Init theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, []);

  const showToast = useCallback((msg, type = 'default', ms = 1500) => {
    const id = ++toastId;
    dispatch({ type: 'SHOW_TOAST', payload: { msg, type } });
    if (navigator.vibrate) navigator.vibrate(type === 'success' ? [50, 30, 50] : 30);
    setTimeout(() => dispatch({ type: 'DISMISS_TOAST', payload: id }), ms);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: next });
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch, showToast, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
