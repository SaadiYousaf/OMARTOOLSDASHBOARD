import React from 'react';
import { FiHome, FiTag, FiLayers, FiGrid, FiChevronLeft, FiChevronRight, FiShoppingBag, FiBook, FiClipboard, FiPackage, FiTool, FiImage } from 'react-icons/fi';

interface DashboardSidebarProps {
  activeTab: 'order' | 'product' | 'brand' | 'category' | 'subcategory' | 'blog' | 'warranty' | 'bulk' | 'customkit' | 'homepage';
  onTabChange: (tab: 'order' | 'product' | 'brand' | 'category' | 'subcategory' | 'blog' | 'warranty' | 'bulk' | 'customkit' | 'homepage') => void;
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
           <li className={activeTab === 'order' ? 'active' : ''}>
            <button onClick={() => onTabChange('order')}>
              <FiShoppingBag />
              {!collapsed && <span>Order Management</span>}
            </button>
          </li>
          <li className={activeTab === 'product' ? 'active' : ''}>
            <button onClick={() => onTabChange('product')}>
              <FiHome />
              {!collapsed && <span>Products</span>}
            </button>
          </li>
           <li className={activeTab === 'bulk' ? 'active' : ''}>
            <button onClick={() => onTabChange('bulk')}>
              <FiPackage />
              {!collapsed && (
                <>
                  <span>Bulk Operations</span>
                </>
              )}
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
          <li>
            <li className={activeTab === 'blog' ? 'active' : ''}>
  <button onClick={() => onTabChange('blog')}>
    <FiBook /> {/* Import FiBook from react-icons/fi */}
    {!collapsed && <span>Blog Management</span>}
  </button>
</li>
          </li>
          <li className={activeTab === 'warranty' ? 'active' : ''}>
            <button onClick={() => onTabChange('warranty')}>
              <FiClipboard />
              {!collapsed && <span>Warranty Claims</span>}
            </button>
          </li>
          <li className={activeTab === 'customkit' ? 'active' : ''}>
            <button onClick={() => onTabChange('customkit')}>
              <FiTool />
              {!collapsed && <span>Custom Kits</span>}
            </button>
          </li>
          <li className={activeTab === 'homepage' ? 'active' : ''}>
            <button onClick={() => onTabChange('homepage')}>
              <FiImage />
              {!collapsed && <span>Homepage Settings</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;