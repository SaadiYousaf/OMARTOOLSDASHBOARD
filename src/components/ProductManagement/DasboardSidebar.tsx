import React from 'react';
import { FiHome, FiTag, FiLayers, FiGrid, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface DashboardSidebarProps {
  activeTab: 'product' | 'brand' | 'category' | 'subcategory';
  onTabChange: (tab: 'product' | 'brand' | 'category' | 'subcategory') => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  collapsed, 
  onToggleCollapse 
}) => {
  return (
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h3>Product Admin</h3>}
        <button className="sidebar-toggle" onClick={onToggleCollapse}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={activeTab === 'product' ? 'active' : ''}>
            <button onClick={() => onTabChange('product')}>
              <FiHome />
              {!collapsed && <span>Products</span>}
            </button>
          </li>
          <li className={activeTab === 'brand' ? 'active' : ''}>
            <button onClick={() => onTabChange('brand')}>
              <FiTag />
              {!collapsed && <span>Brands</span>}
            </button>
          </li>
          <li className={activeTab === 'category' ? 'active' : ''}>
            <button onClick={() => onTabChange('category')}>
              <FiLayers />
              {!collapsed && <span>Categories</span>}
            </button>
          </li>
          <li className={activeTab === 'subcategory' ? 'active' : ''}>
            <button onClick={() => onTabChange('subcategory')}>
              <FiGrid />
              {!collapsed && <span>Subcategories</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;