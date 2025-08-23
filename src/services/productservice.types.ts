// services/productservice.types.ts
import { Product } from '../types/product';

export interface IProductService {
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product>; // Changed from number to string
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>; // Changed from number to string
  deleteProduct(id: string): Promise<boolean>; // Changed from number to string
  getProductsBySubcategory(subcategoryId: string): Promise<Product[]>; // Changed from number to string
  getProductsByBrand(brandId: string): Promise<Product[]>; // Changed from number to string
}