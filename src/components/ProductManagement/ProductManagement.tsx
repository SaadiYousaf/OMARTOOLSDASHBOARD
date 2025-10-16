import React, { useEffect, useState, useMemo } from 'react';
import './ProductManagement.css';
import { Product, BrandDto, SubcategoryDto, CategoryDto, ProductImage } from '../../types/product';
import BrandManagement from '../Brands/BrandManagement';
import CategoryManagement from '../Category/CategoryManagement';
import SubcategoryManagement from '../Subcategory/SubcategoryManagement';
import { FiPlus, FiTrash2, FiX, FiCheck, FiUpload, FiHome, FiTag, FiLayers, FiGrid, FiDollarSign, FiSearch } from 'react-icons/fi';
import DashboardSidebar from './DasboardSidebar';
import DashboardHeader from './DashboardHeader';
import StatsCard from './StatsCard';
import RichTextEditor from '../Helper/RichTextEditor';
import {
    FiBox, FiTruck, FiCheckCircle, FiXCircle,
    FiFilter, FiRefreshCw, FiEye,
    FiEdit, FiArrowLeft, FiArrowRight
} from 'react-icons/fi'
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
const API_BASE_IMG_URL =process.env.REACT_APP_BASE_IMG_URL
const ProductManagement = () => {

    // State for all data entities
    const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
    const [brands, setBrands] = useState<BrandDto[]>([]);
    const [subcategories, setSubcategories] = useState<SubcategoryDto[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // UI state management
    const [activeManagementTab, setActiveManagementTab] = useState<'product' | 'brand' | 'category' | 'subcategory'>('product');
    const [activeProductTab, setActiveProductTab] = useState<'list' | 'form'>('list');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Product form state
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [filteredSubcategories, setFilteredSubcategories] = useState<SubcategoryDto[]>([]);
    const [filteredBrands, setFilteredBrands] = useState<BrandDto[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(3);


    // Status indicators
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Dashboard stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        featuredProducts: 0,
        outOfStock: 0,
        redemptionProducts: 0
    });

    const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/products/images/${imageId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete image');
        }

        // Remove the image from current product state
        setCurrentProduct(prev => ({
            ...prev!,
            images: prev!.images?.filter(img => img.id !== imageId) || []
        }));

        setSuccess(true);
        
        // Optional: Refresh the product data to ensure consistency
        await fetchInitialData();
        
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
        setIsLoading(false);
    }
};

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
    const filteredProducts = useMemo(() => {
        let results = products;

        if (searchTerm) {
            results = results.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.tagLine && product.tagLine.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (showFeaturedOnly) {
            results = results.filter(product => product.isFeatured);
        }

        return results;
    }, [searchTerm, showFeaturedOnly, products]);

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
                outOfStock: products.filter(p => p.stockQuantity <= 0).length,
                redemptionProducts: products.filter(p => p.isRedemption).length
            });
        }
    }, [products]);

    // Update filtered subcategories and brands when category changes
    useEffect(() => {
        if (selectedCategoryId) {
            // Filter subcategories for the selected category
            const filteredSubs = subcategories.filter(sub => sub.categoryId === selectedCategoryId);
            setFilteredSubcategories(filteredSubs);

            // Filter brands that have the selected category
            const filteredBrands = brands.filter(brand =>
                brand.categoryIds && brand.categoryIds.includes(selectedCategoryId)
            );
            setFilteredBrands(filteredBrands);

            // Update current product's subcategory if needed
            if (currentProduct && !filteredSubs.some(sub => sub.id === currentProduct.subcategoryId)) {
                setCurrentProduct(prev => ({
                    ...prev!,
                    subcategoryId: filteredSubs[0]?.id || ''
                }));
                setSelectedSubcategoryId(filteredSubs[0]?.id || null);
            }
        } else {
            setFilteredSubcategories(subcategories);
            setFilteredBrands(brands);
        }
    }, [selectedCategoryId, brands, subcategories, currentProduct]);

    // Update brand and category when editing a product
    useEffect(() => {
        if (currentProduct && currentProduct.subcategoryId) {
            // Find the subcategory to determine its category
            const subcategory = subcategories.find(s => s.id === currentProduct.subcategoryId);
            if (subcategory) {
                setSelectedCategoryId(subcategory.categoryId);

                // Find the brand if it exists
                if (currentProduct.brandId) {
                    setSelectedBrandId(currentProduct.brandId);
                }
            }
        }
    }, [currentProduct, subcategories]);

    // Filter products based on search term and featured filter
    useEffect(() => {
        let results = products;

        if (searchTerm) {
            results = results.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.tagLine && product.tagLine.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (showFeaturedOnly) {
            results = results.filter(product => product.isFeatured);
        }

       // setFilteredProducts(results);
    }, [searchTerm, showFeaturedOnly, products]);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    }, [currentPage, itemsPerPage, filteredProducts]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredProducts.length / itemsPerPage);
    }, [filteredProducts.length, itemsPerPage]);

    // Pagination function
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, showFeaturedOnly]);
    const paginate = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };


    // Main data fetching function
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [brandsRes, categoriesRes, subcategoriesRes, productsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/brands`),
                fetch(`${API_BASE_URL}/categories`),
                fetch(`${API_BASE_URL}/subcategories`),
                activeManagementTab === 'product' ? fetch(`${API_BASE_URL}/products`) : Promise.resolve(null)
            ]);

            // Handle brands response
            const brandsData = await brandsRes.json();
            setBrands(Array.isArray(brandsData) ? brandsData : []);
            setFilteredBrands(Array.isArray(brandsData) ? brandsData : []);

            // Handle categories response
            const categoriesData = await categoriesRes.json();
            setAllCategories(Array.isArray(categoriesData) ? categoriesData : []);

            // Handle subcategories response
            const subcategoriesData = await subcategoriesRes.json();
            const allSubs = Array.isArray(subcategoriesData) ? subcategoriesData : [];
            setSubcategories(allSubs);
            setFilteredSubcategories(allSubs);

            // Handle products response
            if (productsRes) {
                const productsData = await productsRes.json();
                // Ensure products is always an array
                setProducts(Array.isArray(productsData) ? productsData : []);
              //  setFilteredProducts(Array.isArray(productsData) ? productsData : []);
            }
        } catch (err) {
            setError('Failed to load initial data');
            // Reset all states to empty arrays on error
            setBrands([]);
            setFilteredBrands([]);
            setAllCategories([]);
            setSubcategories([]);
            setFilteredSubcategories([]);
            setProducts([]);
            //setFilteredProducts([]);
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

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryId = e.target.value;
        setSelectedCategoryId(categoryId);

        // Reset brand and subcategory when category changes
        setSelectedBrandId('');
        setSelectedSubcategoryId(null);

        setCurrentProduct(prev => ({
            ...prev!,
            categoryId,
            brandId: '',
            subcategoryId: ''
        }));
    };

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brandId = e.target.value;
        setSelectedBrandId(brandId);
        setCurrentProduct(prev => ({
            ...prev!,
            brandId
        }));
    };
    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subcategoryId = e.target.value;
        setSelectedSubcategoryId(subcategoryId);
        setCurrentProduct(prev => ({
            ...prev!,
            subcategoryId
        }));
    };

    


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(Array.from(e.target.files));
        }
    };

    // Image upload handler
    const uploadImages = async (productId: string) => {
        if (selectedImages.length === 0) return [];

        const uploadPromises = selectedImages.map(async (image, index) => {
            const formData = new FormData();
            formData.append('file', image);
            formData.append('productId', productId);
            formData.append('altText', currentProduct?.name || 'Product Image');
            formData.append('isPrimary', index === 0 ? 'true' : 'false');

            const response = await fetch(`${API_BASE_URL}/products/images`, {
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
const formatText = (type: string) => {
  const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  let formattedText = '';

  switch (type) {
    case 'bold':
      formattedText = `**${selectedText}**`;
      break;
    case 'italic':
      formattedText = `*${selectedText}*`;
      break;
    case 'heading':
      formattedText = `## ${selectedText}`;
      break;
    case 'bullet':
      formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
      break;
    default:
      formattedText = selectedText;
  }

  const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
  setCurrentProduct(prev => ({
    ...prev!,
    description: newValue
  }));

  // Restore cursor position
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start, start + formattedText.length);
  }, 0);
};

// JSON validation function
const isValidJson = (jsonString: string): boolean => {
  if (!jsonString.trim()) return true;
  
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
};
    // Product form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        // Validate required fields
        if (!currentProduct.brandId || !currentProduct.subcategoryId) {
            setError('Brand and Subcategory are required fields');
            return;
        }
          if (currentProduct.specifications && !isValidJson(currentProduct.specifications)) {
    setError('Please fix the JSON format in specifications before submitting.');
    return;
  }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const method = currentProduct.id ? 'PUT' : 'POST';
            const url = currentProduct.id
                ? `${API_BASE_URL}/products/${currentProduct.id}`
                : `${API_BASE_URL}/products`;

            // Ensure all required fields are included
            const productData = {
                ...currentProduct,
                // Ensure these are always included
                brandId: currentProduct.brandId,
                subcategoryId: currentProduct.subcategoryId,
                // Ensure boolean fields have proper values
                isActive: currentProduct.isActive !== false,
                isFeatured: currentProduct.isFeatured || false,
                isRedemption: currentProduct.isRedemption || false,
                // Ensure numeric fields are properly formatted
                price: Number(currentProduct.price) || 0,
                stockQuantity: Number(currentProduct.stockQuantity) || 0,
                discountPrice: currentProduct.discountPrice ? Number(currentProduct.discountPrice) : null,
                weight: currentProduct.weight ? Number(currentProduct.weight) : null,
            };

            const productResponse = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!productResponse.ok) {
                const errorData = await productResponse.json();
                throw new Error(errorData.message || `Failed to ${currentProduct.id ? 'update' : 'create'} product`);
            }

            const responseData = await productResponse.json();
            const productId = currentProduct.id || responseData.id;

            if (selectedImages.length > 0 && productId) {
                await uploadImages(productId);
            }

            await fetchInitialData();
            setSuccess(true);
            setCurrentProduct(null);
            setSelectedImages([]);
            setSelectedCategoryId('');
            setSelectedBrandId('');
            setSelectedSubcategoryId(null);
            setActiveProductTab('list');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    // Product CRUD operations
    const handleEdit = (product: Product) => {
        setCurrentProduct(product);
        setSelectedImages([]);
        setActiveProductTab('form');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`, {
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
        setSelectedCategoryId('');
        setSelectedBrandId('');
        setSelectedSubcategoryId(null);

        // Set default values for required fields
        const defaultCategoryId = allCategories.length > 0 ? allCategories[0].id : '';
        const defaultSubcategoryId = subcategories.length > 0 ? subcategories[0].id : '';
        const defaultBrandId = brands.length > 0 ? brands[0].id : '';

        setCurrentProduct({
            sku: '',
            name: '',
            description: '',
            specifications: '{}',
            price: 0,
            isRedemption: false,
            stockQuantity: 0,
            isFeatured: false,
            isActive: true,
            brandId: defaultBrandId,
            subcategoryId: defaultSubcategoryId,
            weight: undefined,
            dimensions: undefined,
            warrantyPeriod: undefined
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
                                    <StatsCard
                                        title="Redemption Products"
                                        value={stats.redemptionProducts}
                                        icon={<FiDollarSign />}
                                        trend="up"
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
                                            <>
                                                <div className="search-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginRight: '1rem' }}>
                                                    <div className="search-input-wrapper" style={{ position: 'relative' }}>
                                                        <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search products..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            style={{ paddingLeft: '35px', width: '250px', borderRadius: '4px', border: '1px solid #ddd', height: '38px' }}
                                                        />
                                                    </div>
                                                    <label className="featured-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={showFeaturedOnly}
                                                            onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                                                        />
                                                        Show Featured Only
                                                    </label>
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleNewProduct}
                                                    disabled={isLoading}
                                                >
                                                    <FiPlus /> New Product
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    setCurrentProduct(null);
                                                    setSelectedCategoryId('');
                                                    setSelectedBrandId('');
                                                    setSelectedSubcategoryId(null);
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
                                                        <th>TagLine</th>
                                                        <th>Price</th>
                                                        <th>Stock</th>
                                                        <th>Redemption</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {isLoading && !filteredProducts.length ? (
                                                        <tr>
                                                            <td colSpan={9} className="text-center">
                                                                <div className="loading-spinner">Loading products...</div>
                                                            </td>
                                                        </tr>
                                                    ) : filteredProducts.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={9} className="text-center">
                                                                <div className="no-results">No products found matching your criteria</div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        currentProducts.map((product) => (
                                                            <tr key={product.id}>
                                                                <td>{product.id}</td>
                                                                <td>
                                                                    {product.images?.[0]?.imageUrl ? (
                                                                        <img
                                                                            src={API_BASE_IMG_URL + product.images[0].imageUrl}
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
                                                                <td>{product.tagLine}</td>
                                                                <td>${product.price?.toFixed(2)}</td>
                                                                <td>
                                                                    <span className={`stock-badge ${product.stockQuantity > 10 ? 'in-stock' :
                                                                        product.stockQuantity > 0 ? 'low-stock' : 'out-of-stock'
                                                                        }`}>
                                                                        {product.stockQuantity}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${product.isRedemption ? 'redemption' : 'regular'
                                                                        }`}>
                                                                        {product.isRedemption ? 'Yes' : 'No'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'
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
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                            {totalPages > 0 && (
                                                <div className="pagination-container">
                                                    <div className="pagination-info">
                                                        Showing {Math.min(indexOfFirstItem + 1, filteredProducts.length)} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                                                    </div>

                                                    <div className="pagination-controls">
                                                        <div className="pagination-buttons">
                                                            <button
                                                                onClick={() => paginate(1)}
                                                                disabled={currentPage === 1}
                                                                className="pagination-edge"
                                                                title="First Page"
                                                            >
                                                                <FiArrowLeft /><FiArrowLeft />
                                                            </button>

                                                            <button
                                                                onClick={() => paginate(currentPage - 1)}
                                                                disabled={currentPage === 1}
                                                                className="pagination-nav"
                                                            >
                                                                <FiArrowLeft /> Previous
                                                            </button>

                                                            {/* Page number buttons with ellipsis for large number of pages */}
                                                            {(() => {
                                                                const pageButtons = [];
                                                                const maxVisiblePages = 5;
                                                                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                                                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                                                // Adjust if we're near the end
                                                                if (endPage - startPage + 1 < maxVisiblePages) {
                                                                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                                                }

                                                                // First page and ellipsis if needed
                                                                if (startPage > 1) {
                                                                    pageButtons.push(
                                                                        <button
                                                                            key={1}
                                                                            onClick={() => paginate(1)}
                                                                            className={currentPage === 1 ? 'active' : ''}
                                                                        >
                                                                            1
                                                                        </button>
                                                                    );

                                                                    if (startPage > 2) {
                                                                        pageButtons.push(
                                                                            <span key="start-ellipsis" className="pagination-ellipsis">
                                                                                ...
                                                                            </span>
                                                                        );
                                                                    }
                                                                }

                                                                // Page number buttons
                                                                for (let i = startPage; i <= endPage; i++) {
                                                                    pageButtons.push(
                                                                        <button
                                                                            key={i}
                                                                            onClick={() => paginate(i)}
                                                                            className={currentPage === i ? 'active' : ''}
                                                                        >
                                                                            {i}
                                                                        </button>
                                                                    );
                                                                }

                                                                // Last page and ellipsis if needed
                                                                if (endPage < totalPages) {
                                                                    if (endPage < totalPages - 1) {
                                                                        pageButtons.push(
                                                                            <span key="end-ellipsis" className="pagination-ellipsis">
                                                                                ...
                                                                            </span>
                                                                        );
                                                                    }

                                                                    pageButtons.push(
                                                                        <button
                                                                            key={totalPages}
                                                                            onClick={() => paginate(totalPages)}
                                                                            className={currentPage === totalPages ? 'active' : ''}
                                                                        >
                                                                            {totalPages}
                                                                        </button>
                                                                    );
                                                                }

                                                                return pageButtons;
                                                            })()}

                                                            <button
                                                                onClick={() => paginate(currentPage + 1)}
                                                                disabled={currentPage === totalPages}
                                                                className="pagination-nav"
                                                            >
                                                                Next <FiArrowRight />
                                                            </button>

                                                            <button
                                                                onClick={() => paginate(totalPages)}
                                                                disabled={currentPage === totalPages}
                                                                className="pagination-edge"
                                                                title="Last Page"
                                                            >
                                                                <FiArrowRight /><FiArrowRight />
                                                            </button>
                                                        </div>

                                                        <div className="pagination-page-size">
                                                            <label>Items per page:</label>
                                                            <select
                                                                value={itemsPerPage}
                                                                onChange={(e) => {
                                                                    setItemsPerPage(Number(e.target.value));
                                                                    setCurrentPage(1); // Reset to first page when changing page size
                                                                }}
                                                            >
                                                                <option value="3">3</option>
                                                                <option value="5">5</option>
                                                                <option value="10">10</option>
                                                                <option value="25">25</option>
                                                                <option value="50">50</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
                                                        <label>Tag Line</label>
                                                        <input
                                                            type="text"
                                                            name="tagLine"
                                                            placeholder="e.g., Best Seller, New Arrival, Limited Edition"
                                                            value={currentProduct?.tagLine || ''}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                        <div className="form-group">
                                                        <label>Description*</label>
                                                        <label>Description*</label>
  <RichTextEditor
    value={currentProduct?.description || ''}
    onChange={(newValue) => setCurrentProduct(prev => ({
      ...prev!,
      description: newValue
    }))}
    placeholder="Enter detailed product description with formatting..."
  />
  <div className="form-hint">
    Use the toolbar to format your text with bold, italics, lists, links, etc.
  </div>
                                                    </div>
                                                </div>

                                                <div className="form-section">
                                                    <h3>Category & Brand</h3>
                                                    <div className="form-group">
                                                        <label>Category*</label>
                                                        <select
                                                            value={selectedCategoryId || ''}
                                                            onChange={handleCategoryChange}
                                                            required
                                                        >
                                                            <option value="">Select Category</option>
                                                            {allCategories.map((category) => (
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
                                                            onChange={handleSubcategoryChange}
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
                                                    <div className="form-group">
                                                        <label>Brand*</label>
                                                        <select
                                                            name="brandId"
                                                            value={currentProduct?.brandId || ''}
                                                            onChange={handleBrandChange}
                                                            required
                                                        >
                                                            <option value="">Select Brand</option>
                                                            {filteredBrands.map((brand) => (
                                                                <option key={brand.id} value={brand.id}>
                                                                    {brand.name}
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
    
    {/* Display existing product images with delete option */}
    {currentProduct?.images && currentProduct.images.length > 0 && (
        <div className="existing-images">
            <h4>Current Images</h4>
            <div className="preview-container">
                {currentProduct.images.map((image, index) => (
                    <div key={image.id || index} className="image-preview existing">
                        <img
                            src={API_BASE_IMG_URL + image.imageUrl}
                            alt={image.altText || `Product Image ${index + 1}`}
                        />
                        <div className="image-info">
                            {index === 0 && <span className="primary-badge">Primary</span>}
                        </div>
                        <button
                            className="remove-image-btn"
                            onClick={() => handleDeleteImage(image.id)}
                            title="Delete image"
                            disabled={isLoading}
                        >
                            <FiX />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )}

    {/* Upload new images section */}
    <div className="form-group">
        <label className="file-upload-label">
            <FiUpload /> Upload New Product Images
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
                `${selectedImages.length} new files selected` :
                'No new files selected'}
        </div>
    </div>
    
    {/* Preview new selected images */}
    {selectedImages.length > 0 && (
        <div className="image-previews">
            <h4>New Images to Upload</h4>
            <div className="preview-container">
                {selectedImages.map((image, index) => (
                    <div key={index} className="image-preview new">
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
                                                            placeholder="e.g., 10x20x15"
                                                            value={currentProduct?.dimensions || ''}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Warranty Period</label>
                                                        <input
                                                            type="text"
                                                            name="warrantyPeriod"
                                                            placeholder="e.g., 1 year"
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
                                                    <div className="form-group checkbox-group">
                                                        <input
                                                            type="checkbox"
                                                            name="isRedemption"
                                                            checked={currentProduct?.isRedemption || false}
                                                            onChange={handleInputChange}
                                                            id="isRedemption"
                                                        />
                                                        <label htmlFor="isRedemption">Is Redemption Product</label>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Specifications (JSON)</label>
                                                        <div className="json-editor">
    <textarea
      name="specifications"
      value={currentProduct?.specifications || '{}'}
      onChange={handleInputChange}
      rows={4}
      className={isValidJson(currentProduct?.specifications || '{}') ? '' : 'json-error'}
    />
    {!isValidJson(currentProduct?.specifications || '{}') && (
      <div className="json-error-message">
        ❌ Invalid JSON format. Please check your syntax.
      </div>
    )}
    {isValidJson(currentProduct?.specifications || '{}') && 
     currentProduct?.specifications && 
     currentProduct.specifications !== '{}' && (
      <div className="json-success-message">
        ✅ Valid JSON
      </div>
    )}
  </div>
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
                                                        setSelectedCategoryId('');
                                                        setSelectedBrandId('');
                                                        setSelectedSubcategoryId(null);
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
                            onCategoryCreated={refreshData}
                        />
                    ) : (
                        <SubcategoryManagement
                            categories={allCategories}
                            onSubcategoryCreated={refreshData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;