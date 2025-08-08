import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  danger?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend = 'neutral', 
  danger = false 
}) => {
  const trendColors = {
    up: '#10b981',
    down: '#ef4444',
    neutral: '#6b7280'
  };

  return (
    <div className={`stats-card ${danger ? 'danger' : ''}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
      {trend !== 'neutral' && (
        <div className="stats-trend" style={{ color: trendColors[trend] }}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      )}
    </div>
  );
};

export default StatsCard;