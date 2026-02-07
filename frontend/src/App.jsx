import { useCallback, useRef, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Styles (order matters: variables first, then global, then component-specific)
import './styles/variables.css';
import './styles/global.css';
import './styles/navbar.css';
import './styles/sidebar.css';
import './styles/card-stack.css';
import './styles/modal.css';
import './styles/grid.css';
import './styles/preferences.css';
import './styles/toast.css';
import './styles/responsive.css';

// Layout
import Navbar from './components/layout/Navbar';
import MainLayout from './components/layout/MainLayout';

// Views
import StackView from './components/stack/StackView';
import SavedView from './components/views/SavedView';
import ArchivedView from './components/views/ArchivedView';
import SkippedView from './components/views/SkippedView';
import PreferencesView from './components/views/PreferencesView';

// Shared
import JobDetailsModal from './components/shared/JobDetailsModal';
import SkipReasonModal from './components/shared/SkipReasonModal';
import ToastContainer from './components/shared/ToastContainer';

// Inner component that uses context
function AppInner() {
  const { state, dispatch, showToast } = useApp();
  const stackLoadRef = useRef(null);

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userB64 = params.get('linkedin_user');
    const authError = params.get('auth_error');
    if (userB64) {
      try {
        const user = JSON.parse(atob(userB64));
        dispatch({ type: 'SET_USER', payload: user });
        showToast(`Welcome, ${user.firstName || user.name}!`, 'success');
      } catch { /* ignore malformed data */ }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authError) {
      showToast('LinkedIn sign-in failed. Please try again.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSearch = useCallback((query) => {
    dispatch({ type: 'SWITCH_VIEW', payload: 'stack' });
    // stackLoadRef.current is the load function exposed by StackView
    stackLoadRef.current?.(query);
  }, [dispatch]);

  const handleSavePrefs = useCallback(() => {
    stackLoadRef.current?.('');
  }, []);

  const handleModalSkip = useCallback(() => {
    showToast('Skipped', 'error');
  }, [showToast]);

  const handleModalSave = useCallback(() => {
    if (state.modalJob) {
      dispatch({ type: 'SAVE_JOB', payload: state.modalJob });
      showToast(`Saved ${state.modalJob.title}`, 'success');
    }
  }, [state.modalJob, dispatch, showToast]);

  return (
    <>
      <Navbar onSearch={handleSearch} />
      <MainLayout stackCount={state.savedJobs.length}>
        <StackView ref={stackLoadRef} />
        <SavedView />
        <SkippedView />
        <ArchivedView />
        <PreferencesView onSavePrefs={handleSavePrefs} />
      </MainLayout>
      <JobDetailsModal onSkip={handleModalSkip} onSave={handleModalSave} />
      <SkipReasonModal />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
