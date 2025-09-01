// services/productService.ts
import { Product, ProductImage, ProductVariant } from '../types/product';
import { IProductService } from './productservice.types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5117/api';

export class ProductService implements IProductService {
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Product[] = await response.json();
      return data.map(this.transformProductData);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const product: Product = await response.json();
      return this.transformProductData(product);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter(product => product.isFeatured);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newProduct: Product = await response.json();
      return this.transformProductData(newProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedProduct: Product = await response.json();
      return this.transformProductData(updatedProduct);
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  async getProductsBySubcategory(subcategoryId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products?subcategoryId=${subcategoryId}`);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data: Product[] = await response.json();
      return data.map(this.transformProductData);
    } catch (error) {
      console.error(`Error fetching products for subcategory ${subcategoryId}:`, error);
      throw error;
    }
  }
  

  async getProductsByBrand(brandId: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter(product => product.brandId === brandId);
    } catch (error) {
      console.error(`Error fetching products for brand ${brandId}:`, error);
      throw error;
    }
  }

  private transformProductData=(product: Product): Product=> {
    // Ensure specifications remains a string as per your interface
    let specifications = product.specifications || '{}';
    try {
      // Verify it's valid JSON but keep as string
      JSON.parse(specifications);
    } catch (e) {
      console.warn('Invalid JSON in specifications for product', product.id);
      specifications = '{}';
    }

    // Process images with proper typing
    const images: ProductImage[] = (product.images || []).map(img => ({
      id: img.id,
      productId: img.productId,
      // Fix the image URL based on what the API returns
      imageUrl: this.fixImageUrl(img.imageUrl),
      altText: img.altText || product.name,
      displayOrder: img.displayOrder || 0,
      isPrimary: img.isPrimary || false,
      isActive: img.isActive !== false,
      createdAt: img.createdAt
    }));

    // Sort images by displayOrder
    images.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return {
      ...product,
      specifications,
      images,
      variants: product.variants || []
    };
  }
  private fixImageUrl(url: string): string {
    if (!url) return '/placeholder-product.png';
    
    // If URL is already absolute (starts with http)
    if (url.startsWith('http')) return url;
    
    // If URL starts with /, prepend base URL
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    
    // Otherwise assume it's relative to API
    return `${API_BASE_URL}/images/${url}`;
}
}


