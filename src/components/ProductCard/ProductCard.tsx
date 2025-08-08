// components/ProductCard.tsx
import React from 'react';
import { Product, ProductImage, ProductVariant } from '../../types/product';

interface ProductCardProps {
  product: Product;
  onVariantSelect?: (variant: ProductVariant) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const mainImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasVariants = product.variants && product.variants.length > 0;
  const finalPrice = product.discountPrice || product.price;
  console.log('Product data:', product);
  console.log('Main image:', mainImage);
  return (
    <div className="product-card">
      {/* Image Section */}
      {mainImage && (
        <div className="product-image-container">
          <img 
            src={mainImage.imageUrl} 
            alt={product.name}
            className="product-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
          {product.isFeatured && (
            <div className="featured-badge">Featured</div>
          )}
        </div>
      )}

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-meta">
          <span className="product-sku">SKU: {product.sku}</span>
          {product.warrantyPeriod && (
            <span className="warranty">Warranty: {product.warrantyPeriod}</span>
          )}
        </div>

        {/* Pricing */}
        <div className="product-pricing">
          {product.discountPrice ? (
            <>
              <span className="original-price">${product.price.toFixed(2)}</span>
              <span className="current-price">${product.discountPrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="current-price">${product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Stock Status */}
        <div className={`stock-status ${product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stockQuantity > 0 ? 
            `${product.stockQuantity} in stock` : 
            'Out of stock'}
        </div>

        {/* Specifications */}
        {product.specifications && typeof product.specifications === 'object' && (
          <div className="product-specs">
            <h4>Specifications:</h4>
            <ul>
              {Object.entries(product.specifications).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {String(value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variants */}
        {hasVariants && (
          <div className="product-variants">
            <select className="variant-selector">
              {product.variants?.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.variantValue} (+${variant.priceAdjustment})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dimensions */}
        {product.dimensions && (
          <div className="product-dimensions">
            Dimensions: {product.dimensions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;