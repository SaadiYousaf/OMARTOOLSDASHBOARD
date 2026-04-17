import React from 'react';
import { useNotification, NotificationType } from '../../context/NotificationContext';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <FiCheckCircle />,
  error: <FiXCircle />,
  warning: <FiAlertTriangle />,
  info: <FiInfo />,
};

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map(n => (
        <div key={n.id} className={`toast toast-${n.type}`}>
          <div className="toast-icon">{ICONS[n.type]}</div>
          <div className="toast-body">
            <div className="toast-title">{n.title}</div>
            {n.message && <div className="toast-message">{n.message}</div>}
          </div>
          <button className="toast-close" onClick={() => removeNotification(n.id)}>
            <FiX />
          </button>
          <div className="toast-progress" style={{ animationDuration: `${n.duration || 5000}ms` }} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
