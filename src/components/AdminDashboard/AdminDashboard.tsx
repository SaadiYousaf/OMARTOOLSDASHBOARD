// AdminDashboard.tsx
import React, { useState ,useEffect} from 'react';
import DashboardSidebar from '../ProductManagement/DasboardSidebar'; 
import DashboardHeader from '../ProductManagement/DashboardHeader'; 
import ProductManagement from '../ProductManagement/ProductManagement'; 
import OrderManagement from '../OrderManagement/OrderManagement'; 
import BrandManagement from '../Brands/BrandManagement';
import CategoryManagement from '../Category/CategoryManagement';
import SubcategoryManagement from '../Subcategory/SubcategoryManagement';
import './AdminDashboard.css';
import { CategoryDto } from '../../types/product';
import BlogManagement from '../BlogManagement/BlogManagement';

interface AdminDashboardProps {
  onLogout: () => void;
}
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'order' | 'product' | 'brand' | 'category' | 'subcategory' | 'blog'>('order');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
   const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getPageTitle = () => {
    switch (activeTab) {
      case 'order': return 'Order Management';
      case 'product': return 'Product Management';
      case 'brand': return 'Brand Management';
      case 'category': return 'Category Management';
      case 'subcategory': return 'Subcategory Management';
      case 'blog': return 'Blog Management';
      default: return 'Admin Dashboard';
    }
  };

    useEffect(() => {
    fetchCategories();
  }, []);

  const refreshData = () => {
    console.log('Refreshing data...');

     if (activeTab === 'subcategory') {
      fetchCategories();
    }
  };

    const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`admin-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="dashboard-main">
        <DashboardHeader
          title={getPageTitle()}
          onRefresh={refreshData}
        />

                <div className="dashboard-content">
          {activeTab === 'order' && (
            <OrderManagement onLogout={onLogout} />
          )}
          {activeTab === 'product' && (
            <ProductManagement />
          )}
          {activeTab === 'brand' && (
            <BrandManagement onBrandCreated={refreshData} />
          )}
          {activeTab === 'category' && (
            <CategoryManagement onCategoryCreated={refreshData} />
          )}
          {activeTab === 'subcategory' && (
            <SubcategoryManagement 
               categories={categories} // You'll need to pass categories here or fetch them in SubcategoryManagement
              onSubcategoryCreated={refreshData} 
            />
          )}
           {activeTab === 'blog' && ( 
            <BlogManagement onLogout={onLogout} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;