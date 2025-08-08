// context/ProductServiceContext.tsx
import React, { createContext, useContext } from 'react';
import { IProductService } from '../services/productservice.types';
import { ProductService } from '../services/productservice';

const ProductServiceContext = createContext<IProductService | null>(null);

export const ProductServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const productService = new ProductService();
  
  return (
    <ProductServiceContext.Provider value={productService}>
      {children}
    </ProductServiceContext.Provider>
  );
};

export const useProductService = () => {
  const context = useContext(ProductServiceContext);
  if (!context) {
    throw new Error('useProductService must be used within a ProductServiceProvider');
  }
  return context;
};