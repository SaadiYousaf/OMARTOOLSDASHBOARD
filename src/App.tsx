// App.tsx
import React from 'react';
import { ProductServiceProvider } from './context/ProductServiceContext';
import ProductList from './components/ProductList/ProductList';
import { Routes, Route } from "react-router-dom";
import './App.css';
import ProductManagement from './components/ProductManagement/ProductManagement';

function App() {
  return (
    <ProductServiceProvider>
      <div className="App">
        <header className="App-header">
          <h1>Product Management System</h1>
        </header>
        <main>
          <ProductManagement/>
          <ProductList />
        </main>
      </div>
    </ProductServiceProvider>
  );
}

export default App;