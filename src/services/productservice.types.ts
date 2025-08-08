// services/productService.types.ts
import { Product } from '../types/product';
export interface IProductService {
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  getProductsBySubcategory(subcategoryId: number): Promise<Product[]>;
  getProductsByBrand(brandId: number): Promise<Product[]>;
}