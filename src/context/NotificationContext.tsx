import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((type: NotificationType, title: string, message?: string, duration = 5000) => {
    const id = `notif-${++counterRef.current}-${Date.now()}`;
    const notification: Notification = { id, type, title, message, duration };
    setNotifications(prev => [...prev, notification]);
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  }, [removeNotification]);

  const success = useCallback((title: string, message?: string) => addNotification('success', title, message), [addNotification]);
  const error = useCallback((title: string, message?: string) => addNotification('error', title, message, 8000), [addNotification]);
  const warning = useCallback((title: string, message?: string) => addNotification('warning', title, message, 6000), [addNotification]);
  const info = useCallback((title: string, message?: string) => addNotification('info', title, message), [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, success, error, warning, info }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
}
