import React from 'react';

interface SortableHeaderProps {
  label: string;
  column: string;
  sort: {
    column: string | null;
    direction: 'asc' | 'desc' | null;
    toggle: (column: string) => void;
  };
  style?: React.CSSProperties;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, sort, style, className }) => {
  const isActive = sort.column === column;
  const direction = isActive ? sort.direction : null;

  return (
    <th
      onClick={() => sort.toggle(column)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
      className={className}
      title={`Sort by ${label}`}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ display: 'inline-flex', flexDirection: 'column', fontSize: 9, lineHeight: 1, opacity: isActive ? 1 : 0.3 }}>
          <span style={{ color: direction === 'asc' ? '#072c62' : '#ccc' }}>▲</span>
          <span style={{ color: direction === 'desc' ? '#072c62' : '#ccc' }}>▼</span>
        </span>
      </span>
    </th>
  );
};

export default SortableHeader;
