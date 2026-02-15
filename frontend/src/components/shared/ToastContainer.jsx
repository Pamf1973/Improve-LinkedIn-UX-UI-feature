import { useApp } from '../../context/AppContext';
import { TOAST_ICONS } from '../../constants';

export default function ToastContainer() {
  const { state } = useApp();

  return (
    <div className="toast-container">
      {state.toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'default'}`}>
          <i className={`fas ${TOAST_ICONS[t.type] || TOAST_ICONS.default}`}></i>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
