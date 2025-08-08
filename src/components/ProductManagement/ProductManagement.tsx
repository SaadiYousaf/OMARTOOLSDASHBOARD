import React, { useEffect, useState } from 'react';
import './ProductManagement.css';
import { Product, BrandDto, SubcategoryDto, CategoryDto, ProductImage } from '../../types/product';
import BrandManagement from '../Brands/BrandManagement';
import CategoryManagement from '../Category/CategoryManagement';
import SubcategoryManagement from '../Subcategory/SubcategoryManagement';
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiUpload, FiHome, FiTag, FiLayers, FiGrid } from 'react-icons/fi';
import DashboardSidebar from './DasboardSidebar';
import DashboardHeader from './DashboardHeader';
import StatsCard from './StatsCard';

const ProductManagement = () => {
    // State for all data entities
    const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
    const [brands, setBrands] = useState<BrandDto[]>([]);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [subcategories, setSubcategories] = useState<SubcategoryDto[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    
    // UI state management
    const [activeManagementTab, setActiveManagementTab] = useState<'product' | 'brand' | 'category' | 'subcategory'>('product');
    const [activeProductTab, setActiveProductTab] = useState<'list' | 'form'>('list');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // Product form state
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [filteredSubcategories, setFilteredSubcategories] = useState<SubcategoryDto[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    
    // Status indicators
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Dashboard stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        featuredProducts: 0,
        outOfStock: 0
    });

    // Fetch all initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Update stats when products change
    useEffect(() => {
        if (products.length > 0) {
            setStats({
                totalProducts: products.length,
                activeProducts: products.filter(p => p.isActive).length,
                featuredProducts: products.filter(p => p.isFeatured).length,
                outOfStock: products.filter(p => p.stockQuantity <= 0).length
            });
        }
    }, [products]);

    // Filter categories based on selected brand
    useEffect(() => {
        if (selectedBrandId) {
            const filtered = allCategories.filter(cat => cat.brandId === selectedBrandId);
            setCategories(filtered);
            setSelectedCategoryId(null);
        } else {
            setCategories(allCategories);
        }
    }, [selectedBrandId, allCategories]);

    // Filter subcategories based on selected category
    useEffect(() => {
        if (selectedCategoryId) {
            const filtered = subcategories.filter(sub => sub.categoryId === selectedCategoryId);
            setFilteredSubcategories(filtered);

            if (currentProduct && !filtered.some(sub => sub.id === currentProduct.subcategoryId)) {
                setCurrentProduct(prev => ({
                    ...prev!,
                    subcategoryId: filtered[0]?.id || 0
                }));
            }
        } else {
            setFilteredSubcategories(subcategories);
        }
    }, [selectedCategoryId, subcategories, currentProduct]);

    // Main data fetching function
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [brandsRes, categoriesRes, subcategoriesRes, productsRes] = await Promise.all([
                fetch('http://localhost:5117/api/brands'),
                fetch('http://localhost:5117/api/categories'),
                fetch('http://localhost:5117/api/subcategories'),
                activeManagementTab === 'product' ? fetch('http://localhost:5117/api/products') : Promise.resolve(null)
            ]);
            
            setBrands(await brandsRes.json());
            const allCats = await categoriesRes.json();
            setAllCategories(allCats);
            setCategories(allCats);
            setSubcategories(await subcategoriesRes.json());
            
            if (productsRes) {
                const productsData = await productsRes.json();
                setProducts(productsData);
            }
        } catch (err) {
            setError('Failed to load initial data');
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh data when management tab changes
    useEffect(() => {
        fetchInitialData();
    }, [activeManagementTab]);

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setCurrentProduct(prev => ({
            ...prev!,
            [name]: type === 'number' ? parseFloat(value) :
                type === 'checkbox' ? checked :
                    value
        }));
    };

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brandId = Number(e.target.value);
        setSelectedBrandId(brandId);
        setCurrentProduct(prev => ({
            ...prev!,
            brandId
        }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryId = Number(e.target.value);
        setSelectedCategoryId(categoryId);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(Array.from(e.target.files));
        }
    };

    // Image upload handler
    const uploadImages = async (productId: number) => {
        if (selectedImages.length === 0) return [];

        const uploadPromises = selectedImages.map(async (image, index) => {
            const formData = new FormData();
            formData.append('file', image);
            formData.append('productId', productId.toString());
            formData.append('altText', currentProduct?.name || 'Product Image');
            formData.append('isPrimary', index === 0 ? 'true' : 'false');

            const response = await fetch('http://localhost:5117/api/products/images', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Image upload failed: ${errorText}`);
            }
            return await response.json();
        });

        return await Promise.all(uploadPromises);
    };

    // Product form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const method = currentProduct.id ? 'PUT' : 'POST';
            const url = currentProduct.id 
                ? `http://localhost:5117/api/products/${currentProduct.id}`
                : 'http://localhost:5117/api/products';

            const productResponse = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentProduct),
            });

            if (!productResponse.ok) {
                throw new Error(await productResponse.text());
            }

            const productData = await productResponse.json();
            const productId = currentProduct.id || productData.id;

            if (selectedImages.length > 0 && productId) {
                await uploadImages(productId);
            }

            await fetchInitialData();
            setSuccess(true);
            setCurrentProduct(null);
            setSelectedImages([]);
            setActiveProductTab('list');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    // Product CRUD operations
    const handleEdit = (product: Product) => {
        const subcategory = subcategories.find(sub => sub.id === product.subcategoryId);
        const categoryId = subcategory?.categoryId || null;

        setSelectedBrandId(product.brandId);
        setSelectedCategoryId(categoryId);
        setCurrentProduct(product);
        setSelectedImages([]);
        setActiveProductTab('form');
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5117/api/products/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Delete failed');
            await fetchInitialData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewProduct = () => {
        setSelectedBrandId(null);
        setSelectedCategoryId(null);
        setCurrentProduct({
            sku: '',
            name: '',
            description: '',
            specifications: '{}',
            price: 0,
            stockQuantity: 0,
            isFeatured: false,
            isActive: true,
            brandId: brands[0]?.id || 0,
            subcategoryId: subcategories[0]?.id || 0
        });
        setSelectedImages([]);
        setActiveProductTab('form');
    };

    // Refresh all data
    const refreshData = () => {
        fetchInitialData();
    };

    return (
        <div className={`dashboard-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <DashboardSidebar 
                activeTab={activeManagementTab}
                onTabChange={setActiveManagementTab}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            <div className="dashboard-main">
                <DashboardHeader 
                    title={activeManagementTab === 'product' ? 'Product Management' : 
                          activeManagementTab === 'brand' ? 'Brand Management' :
                          activeManagementTab === 'category' ? 'Category Management' : 'Subcategory Management'}
                    onRefresh={refreshData}
                />
                
                {error && (
                    <div className="alert alert-error">
                        <div className="alert-content">
                            {error}
                        </div>
                        <button className="alert-close" onClick={() => setError(null)}>
                            <FiX />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <div className="alert-content">
                            <FiCheck className="alert-icon" /> Operation completed successfully!
                        </div>
                        <button className="alert-close" onClick={() => setSuccess(false)}>
                            <FiX />
                        </button>
                    </div>
                )}

                <div className="dashboard-content">
                    {activeManagementTab === 'product' ? (
                        <>
                            {activeProductTab === 'list' && (
                                <div className="stats-grid">
                                    <StatsCard 
                                        title="Total Products" 
                                        value={stats.totalProducts} 
                                        icon={<FiTag />}
                                        trend="up"
                                    />
                                    <StatsCard 
                                        title="Active Products" 
                                        value={stats.activeProducts} 
                                        icon={<FiCheck />}
                                        trend="neutral"
                                    />
                                    <StatsCard 
                                        title="Featured Products" 
                                        value={stats.featuredProducts} 
                                        icon={<FiPlus />}
                                        trend="up"
                                    />
                                    <StatsCard 
                                        title="Out of Stock" 
                                        value={stats.outOfStock} 
                                        icon={<FiX />}
                                        trend="down"
                                        danger
                                    />
                                </div>
                            )}

                            <div className="card">
                                <div className="card-header">
                                    <h2>
                                        {activeProductTab === 'list' ? 'Product List' : 
                                         currentProduct?.id ? 'Edit Product' : 'Create New Product'}
                                    </h2>
                                    <div className="card-actions">
                                        {activeProductTab === 'list' ? (
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleNewProduct}
                                                disabled={isLoading}
                                            >
                                                <FiPlus /> New Product
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    setCurrentProduct(null);
                                                    setActiveProductTab('list');
                                                }}
                                                disabled={isLoading}
                                            >
                                                Back to List
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card-body">
                                    {activeProductTab === 'list' ? (
                                        <div className="table-responsive">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Image</th>
                                                        <th>Name</th>
                                                        <th>SKU</th>
                                                        <th>Price</th>
                                                        <th>Stock</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {isLoading && !products.length ? (
                                                        <tr>
                                                            <td colSpan={8} className="text-center">
                                                                <div className="loading-spinner">Loading products...</div>
                                                            </td>
                                                        </tr>
                                                    ) : products.map((product) => (
                                                        <tr key={product.id}>
                                                            <td>{product.id}</td>
                                                            <td>
                                                                {product.images?.[0]?.imageUrl ? (
                                                                    <img 
                                                                        src={product.images[0].imageUrl} 
                                                                        alt={product.name} 
                                                                        className="product-thumbnail"
                                                                    />
                                                                ) : (
                                                                    <div className="thumbnail-placeholder">
                                                                        <FiTag />
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="product-name">{product.name}</div>
                                                                <div className="product-brand">
                                                                    {brands.find(b => b.id === product.brandId)?.name}
                                                                </div>
                                                            </td>
                                                            <td>{product.sku}</td>
                                                            <td>${product.price?.toFixed(2)}</td>
                                                            <td>
                                                                <span className={`stock-badge ${
                                                                    product.stockQuantity > 10 ? 'in-stock' : 
                                                                    product.stockQuantity > 0 ? 'low-stock' : 'out-of-stock'
                                                                }`}>
                                                                    {product.stockQuantity}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${
                                                                    product.isActive ? 'active' : 'inactive'
                                                                }`}>
                                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                                    {product.isFeatured && product.isActive && ' ★'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="action-buttons">
                                                                    <button
                                                                        className="btn-icon btn-edit"
                                                                        onClick={() => handleEdit(product)}
                                                                        disabled={isLoading}
                                                                        title="Edit"
                                                                    >
                                                                        <FiEdit />
                                                                    </button>
                                                                    <button
                                                                        className="btn-icon btn-delete"
                                                                        onClick={() => handleDelete(product.id!)}
                                                                        disabled={isLoading}
                                                                        title="Delete"
                                                                    >
                                                                        <FiTrash2 />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="product-form">
                                            <div className="form-grid">
                                                <div className="form-section">
                                                    <h3>Basic Information</h3>
                                                    <div className="form-group">
                                                        <label>SKU*</label>
                                                        <input
                                                            type="text"
                                                            name="sku"
                                                            value={currentProduct?.sku || ''}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Name*</label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={currentProduct?.name || ''}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Description*</label>
                                                        <textarea
                                                            name="description"
                                                            value={currentProduct?.description || ''}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-section">
                                                    <h3>Category & Brand</h3>
                                                    <div className="form-group">
                                                        <label>Brand*</label>
                                                        <select
                                                            name="brandId"
                                                            value={currentProduct?.brandId || ''}
                                                            onChange={handleBrandChange}
                                                            required
                                                        >
                                                            <option value="">Select Brand</option>
                                                            {brands.map((brand) => (
                                                                <option key={brand.id} value={brand.id}>
                                                                    {brand.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Category*</label>
                                                        <select
                                                            name="categoryId"
                                                            value={selectedCategoryId || ''}
                                                            onChange={handleCategoryChange}
                                                            required
                                                            disabled={!currentProduct?.brandId}
                                                        >
                                                            <option value="">Select Category</option>
                                                            {categories
                                                                .filter(cat => !currentProduct?.brandId || cat.brandId === currentProduct.brandId)
                                                                .map((category) => (
                                                                    <option key={category.id} value={category.id}>
                                                                        {category.name}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Subcategory*</label>
                                                        <select
                                                            name="subcategoryId"
                                                            value={currentProduct?.subcategoryId || ''}
                                                            onChange={handleInputChange}
                                                            required
                                                            disabled={!selectedCategoryId}
                                                        >
                                                            <option value="">Select Subcategory</option>
                                                            {filteredSubcategories.map((sub) => (
                                                                <option key={sub.id} value={sub.id}>
                                                                    {sub.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-section">
                                                    <h3>Pricing & Inventory</h3>
                                                    <div className="form-group">
                                                        <label>Price*</label>
                                                        <input
                                                            type="number"
                                                            name="price"
                                                            step="0.01"
                                                            min="0"
                                                            value={currentProduct?.price || ''}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Discount Price</label>
                                                        <input
                                                            type="number"
                                                            name="discountPrice"
                                                            step="0.01"
                                                            min="0"
                                                            value={currentProduct?.discountPrice || ''}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Stock Quantity*</label>
                                                        <input
                                                            type="number"
                                                            name="stockQuantity"
                                                            min="0"
                                                            value={currentProduct?.stockQuantity || ''}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-section">
                                                    <h3>Images</h3>
                                                    <div className="form-group">
                                                        <label className="file-upload-label">
                                                            <FiUpload /> Upload Product Images
                                                            <input
                                                                type="file"
                                                                multiple
                                                                onChange={handleImageChange}
                                                                accept="image/*"
                                                                className="file-upload-input"
                                                            />
                                                        </label>
                                                        <div className="file-upload-hint">
                                                            {selectedImages.length > 0 ? 
                                                                `${selectedImages.length} files selected` : 
                                                                'No files selected'}
                                                        </div>
                                                    </div>
                                                    {selectedImages.length > 0 && (
                                                        <div className="image-previews">
                                                            <h4>Selected Images</h4>
                                                            <div className="preview-container">
                                                                {selectedImages.map((image, index) => (
                                                                    <div key={index} className="image-preview">
                                                                        <img
                                                                            src={URL.createObjectURL(image)}
                                                                            alt={`Preview ${index + 1}`}
                                                                        />
                                                                        <button 
                                                                            className="remove-image-btn"
                                                                            onClick={() => {
                                                                                setSelectedImages(prev => 
                                                                                    prev.filter((_, i) => i !== index)
                                                                                );
                                                                            }}
                                                                        >
                                                                            <FiX />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="form-section">
                                                    <h3>Additional Information</h3>
                                                    <div className="form-group">
                                                        <label>Weight (kg)</label>
                                                        <input
                                                            type="number"
                                                            name="weight"
                                                            step="0.01"
                                                            min="0"
                                                            value={currentProduct?.weight || ''}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Dimensions (W×H×D)</label>
                                                        <input
                                                            type="text"
                                                            name="dimensions"
                                                            value={currentProduct?.dimensions || ''}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Warranty Period</label>
                                                        <input
                                                            type="text"
                                                            name="warrantyPeriod"
                                                            value={currentProduct?.warrantyPeriod || ''}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-section">
                                                    <h3>Settings</h3>
                                                    <div className="form-group checkbox-group">
                                                        <input
                                                            type="checkbox"
                                                            name="isFeatured"
                                                            checked={currentProduct?.isFeatured || false}
                                                            onChange={handleInputChange}
                                                            id="isFeatured"
                                                        />
                                                        <label htmlFor="isFeatured">Featured Product</label>
                                                    </div>
                                                    <div className="form-group checkbox-group">
                                                        <input
                                                            type="checkbox"
                                                            name="isActive"
                                                            checked={currentProduct?.isActive !== false}
                                                            onChange={handleInputChange}
                                                            id="isActive"
                                                        />
                                                        <label htmlFor="isActive">Active</label>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Specifications (JSON)</label>
                                                        <textarea
                                                            name="specifications"
                                                            value={currentProduct?.specifications || '{}'}
                                                            onChange={handleInputChange}
                                                            rows={4}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-actions">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary btn-lg"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Saving...' : currentProduct?.id ? 'Update Product' : 'Create Product'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setCurrentProduct(null);
                                                        setActiveProductTab('list');
                                                    }}
                                                    disabled={isLoading}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : activeManagementTab === 'brand' ? (
                        <BrandManagement 
                            onBrandCreated={refreshData} 
                        />
                    ) : activeManagementTab === 'category' ? (
                        <CategoryManagement 
                            brands={brands} 
                            onCategoryCreated={refreshData} 
                        />
                    ) : (
                        <SubcategoryManagement  
                            categories={categories} 
                            onSubcategoryCreated={refreshData} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;