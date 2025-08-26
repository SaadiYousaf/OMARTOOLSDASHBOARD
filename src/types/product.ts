// types/product.ts

export interface Product {
  id: string;
  subcategoryId: string;
  brandId: string;
  sku: string;
  name: string;
  description: string;
  specifications: string;       // JSON formatted
  price: number;
  tagLine:string;
  discountPrice?: number;
  stockQuantity: number;
  isRedemption: boolean; 
  weight?: number;              // in kg
  dimensions?: string;          // "LxWxH" format
  isFeatured: boolean;
  warrantyPeriod?: string;      // "1 year", "2 years", etc.
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantType: string;
  variantValue: string;
  priceAdjustment: number;
  stockAdjustment: number;
  sku?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Brand DTO matches updated Brand entity
export interface BrandDto {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  categoryIds: string[];          // Link to Category
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

// Category DTO matches updated Category entity
// In ../../types/product.ts
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;  // Make optional
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  //createdAt: string;
 // updatedAt?: string;
}

// Subcategory DTO matches updated Subcategory entity
export interface SubcategoryDto {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}
