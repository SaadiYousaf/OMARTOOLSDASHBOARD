// types/product.ts

export interface Product {
  id: number;
  subcategoryId: number;
  brandId: number;
  sku: string;
  name: string;
  description: string;
  specifications: string; // JSON formatted
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  weight?: number; // in kg
  dimensions?: string; // "LxWxH" format
  isFeatured: boolean;
  warrantyPeriod?: string; // "1 year", "2 years", etc.
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  variantType: string;
  variantValue: string;
  priceAdjustment: number;
  stockAdjustment: number;
  sku?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandDto {
  id: number;
  name: string;
  description?: string;  
  logoUrl?: string;      
  websiteUrl?: string;   
  createdAt?: string;    
  updatedAt?: string;
  isActive?: boolean;    
}
export interface CategoryDto {
  id: number;
  brandId: number;
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface SubcategoryDto {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}