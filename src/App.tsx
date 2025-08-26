// App.tsx
import React, { useState, useEffect } from 'react';
import { ProductServiceProvider } from './context/ProductServiceContext';
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import './App.css';
import ProductManagement from './components/ProductManagement/ProductManagement';
import OrderManagement from './components/OrderManagement/OrderManagement';
import AdminLogin from './components/Admin/AdminLogin';
import ProductList from './components/ProductList/ProductList';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add logout function
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && (user.role === 'Admin' || user.role === 'SuperAdmin')) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin/login" 
          element={
            !isAuthenticated ? 
            <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} /> : 
            <Navigate to="/orders" replace />
          } 
        />
        <Route 
          path="/orders" 
          element={
            isAuthenticated ? 
            <OrderManagement onLogout={handleLogout} /> : // Pass logout function
            <Navigate to="/admin/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to="/orders" replace /> : 
            <Navigate to="/admin/login" replace />
          } 
        />
      </Routes>
      
      {isAuthenticated && (
        <ProductServiceProvider>
          <div className="App">
            <header className="App-header">
              <h1>Product Management System</h1>
              {/* Add logout button in header */}
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </header>
            <main>
              <ProductManagement />
              {/* <ProductList/> */}
            </main>
          </div>
        </ProductServiceProvider>
      )}
    </BrowserRouter>
  );

}

export default App;