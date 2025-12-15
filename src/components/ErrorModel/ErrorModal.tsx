// components/ErrorModal.tsx
import React from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'success';
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  type = 'error'
}) => {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      default: return 'bg-red-50';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-200';
      case 'warning': return 'border-yellow-200';
      default: return 'border-red-200';
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${getBgColor()} ${getBorderColor()}`}>
        <div className="modal-header">
          <div className="modal-title">
            <FiAlertCircle style={{ color: getIconColor(), marginRight: '8px' }} />
            <h3>{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-message">
            {message}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;