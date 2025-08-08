import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface DashboardHeaderProps {
  title: string;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, onRefresh }) => {
  return (
    <header className="dashboard-header">
      <h1>{title}</h1>
      <div className="header-actions">
        <button className="btn-refresh" onClick={onRefresh} title="Refresh Data">
          <FiRefreshCw />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;