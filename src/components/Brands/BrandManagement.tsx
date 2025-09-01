import React, { useState, useEffect } from 'react';
import './BrandManagement.css';

// Define types based on the backend controller
interface CategoryDto {
  id: string;
  name: string;
}

interface BrandDto {
  id: string;
  categoryIds: string[]; 
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ProductDto {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface BrandImage {
  id: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

const BrandManagement = ({ onBrandCreated }: { onBrandCreated: () => void }) => {
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<{ [key: string]: ProductDto[] }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [brandForm, setBrandForm] = useState<BrandDto>({
    id: '',
    categoryIds: [],
    name: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    isActive: true,
    createdAt: new Date().toISOString()
  });

  const [brandImages, setBrandImages] = useState<BrandImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof BrandDto; direction: 'asc' | 'desc' } | null>(null);
  const [showProducts, setShowProducts] = useState<string | null>(null);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 
  const fetchBrands = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/brands`);
      if (!res.ok) throw new Error('Failed to fetch brands');
      const data = await res.json();
      setBrands(data);
    } catch (err) {
      setError('Failed to load brands. Please check your connection.');
    } finally {
      setIsFetching(false);
    }
  };

  const fetchCategories = async () => {
    setIsFetchingCategories(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories. Please check your connection.');
    } finally {
      setIsFetchingCategories(false);
    }
  };

  const fetchProductsByBrand = async (brandId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/brands/${brandId}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(prev => ({ ...prev, [brandId]: data }));
    } catch (err) {
      setError(`Failed to load products for brand ${brandId}`);
    }
  };

  const fetchBrandImages = async (brandId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/brands/${brandId}/images`);
      if (!res.ok) throw new Error('Failed to fetch brand images');
      const data = await res.json();
      setBrandImages(data);
    } catch (err) {
      setError('Failed to load brand images');
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, brandId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsImageLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('brandId', brandId);
    formData.append('altText', 'Brand image');
    formData.append('isPrimary', 'true');

    try {
      const response = await fetch(`${API_BASE_URL}/brands/images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh brand images
        if (isEditing) {
          fetchBrandImages(brandId);
        }
        setSuccess('Image uploaded successfully!');
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setIsImageLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    setIsImageLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/brands/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh brand images
        if (isEditing && brandForm.id) {
          fetchBrandImages(brandForm.id);
        }
        setSuccess('Image deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete image');
      }
    } catch (err) {
      setError('Failed to delete image');
    } finally {
      setIsImageLoading(false);
    }
  };

  useEffect(() => {
    if (isEditing && brandForm.id) {
      fetchBrandImages(brandForm.id);
    } else {
      setBrandImages([]);
    }
  }, [isEditing, brandForm.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!brandForm.name.trim()) {
      setError('Brand name is required');
      setIsLoading(false);
      return;
    }

    if (brandForm.categoryIds.length === 0)  {
      setError('At least one category is required');
      setIsLoading(false);
      return;
    }

    try {
      let url = `${API_BASE_URL}/brands`;
      let method = 'POST';

      if (isEditing) {
        url = `${API_BASE_URL}/brands/${brandForm.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} brand`);
      }

      resetForm();
      fetchBrands();
      onBrandCreated();
      setSuccess(`Brand ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (brand: BrandDto) => {
    setBrandForm(brand);
    setIsEditing(true);
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if brand has products
      const productsRes = await fetch(`${API_BASE_URL}/brands/${id}/products`);
      if (!productsRes.ok) throw new Error('Failed to check products');
      
      const productsData = await productsRes.json();

      if (productsData.length > 0) {
        throw new Error('Cannot delete brand with associated products');
      }

      // Delete brand
      const res = await fetch(`${API_BASE_URL}/brands/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete brand');

      fetchBrands();
      setSuccess('Brand deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brand');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBrandForm({
      id: '',
      categoryIds: [],
      name: '',
      description: '',
      logoUrl: '',
      websiteUrl: '',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setIsEditing(false);
    setBrandImages([]);
  };

  const handleCategoryChange = (categoryId: string) => {
    setBrandForm(prev => {
      const newCategoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      
      return {
        ...prev,
        categoryIds: newCategoryIds
      };
    });
  };

  const handleSort = (key: keyof BrandDto) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBrands = React.useMemo(() => {
    if (!sortConfig) return brands;

    return [...brands].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (valB == null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [brands, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBrands = sortedBrands.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Brand Management</h1>
        <div className="header-actions">
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              resetForm();
            }}
          >
            {isEditing ? 'Edit Brand' : 'Create Brand'}
          </button>
          <button
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            View Brands
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'create' && (
          <div className="create-brand-section">
            <div className="card">
              <div className="card-header">
                <h2>{isEditing ? 'Edit Brand' : 'Create New Brand'}</h2>
                <p>{isEditing ? 'Update the brand details' : 'Fill in the details to create a new brand'}</p>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-grid expanded-form">
                    <div className="form-group">
                      <label>Brand Name*</label>
                      <input
                        type="text"
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        placeholder="Enter brand name"
                        required
                        className="large-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Categories*</label>
                      <div className="category-selector">
                        {categories.map(category => (
                          <div key={category.id} className="category-checkbox">
                            <input
                              type="checkbox"
                              id={`category-${category.id}`}
                              checked={brandForm.categoryIds.includes(category.id)}
                              onChange={() => handleCategoryChange(category.id)}
                            />
                            <label htmlFor={`category-${category.id}`}>
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {isFetchingCategories && (
                        <div className="loading-text">Loading categories...</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Logo URL</label>
                      <div className="input-with-preview">
                        <input
                          type="text"
                          value={brandForm.logoUrl}
                          onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="large-input"
                        />
                        {brandForm.logoUrl && (
                          <img
                            src={brandForm.logoUrl}
                            alt="Logo preview"
                            className="logo-preview"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Website URL</label>
                      <input
                        type="text"
                        value={brandForm.websiteUrl}
                        onChange={(e) => setBrandForm({ ...brandForm, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="large-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <div className="status-toggle large-toggle">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={brandForm.isActive}
                            onChange={(e) => setBrandForm({ ...brandForm, isActive: e.target.checked })}
                          />
                          <span className="slider round"></span>
                        </label>
                        <span className="status-label">
                          {brandForm.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={brandForm.description}
                        onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                        placeholder="Enter brand description"
                        rows={5}
                        className="large-textarea"
                      />
                    </div>

                    {/* Image upload section */}
                    {isEditing && (
                      <div className="form-group full-width">
                        <label>Brand Images</label>
                        <div className="image-upload-section">
                          <label className="file-upload-btn">
                            {isImageLoading ? 'Uploading...' : 'Upload Image'}
                            <input
                              type="file"
                              onChange={(e) => handleImageUpload(e, brandForm.id)}
                              accept="image/*"
                              disabled={isImageLoading}
                            />
                          </label>
                          
                          {brandImages.length > 0 && (
                            <div className="image-preview-list">
                              <h4>Current Images</h4>
                              <div className="image-list">
                                {brandImages.map((image) => (
                                  <div key={image.id} className="image-item">
                                    <img src={image.imageUrl} alt={image.altText} />
                                    <button
                                      type="button"
                                      className="delete-image-btn"
                                      onClick={() => handleDeleteImage(image.id)}
                                      disabled={isImageLoading}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={resetForm}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner"></span>
                          {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                      ) : isEditing ? 'Update Brand' : 'Create Brand'}
                    </button>
                  </div>

                  {error && <div className="alert error">{error}</div>}
                  {success && <div className="alert success">{success}</div>}
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="brand-list-section">
            <div className="card">
              <div className="card-header">
                <h2>Brand Directory</h2>
                <p>Manage all your brands in one place</p>

                <div className="card-actions">
                  <div className="search-box">
                    <input type="text" placeholder="Search brands..." />
                    <button className="search-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </button>
                  </div>
                  <button className="primary-btn small">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="table-container">
                  {isFetching ? (
                    <div className="loading-skeleton">
                      {[...Array(5)].map((_, i) => (
                        <div className="skeleton-row" key={i}>
                          <div className="skeleton-cell"></div>
                          <div className="skeleton-cell"></div>
                          <div className="skeleton-cell"></div>
                          <div className="skeleton-cell"></div>
                          <div className="skeleton-cell"></div>
                          <div className="skeleton-cell"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <table className="brands-table">
                        <thead>
                          <tr>
                            <th onClick={() => handleSort('name')}>
                              Brand Name
                              {sortConfig?.key === 'name' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th>Categories</th>
                            <th>Description</th>
                            <th onClick={() => handleSort('createdAt')}>
                              Created
                              {sortConfig?.key === 'createdAt' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th onClick={() => handleSort('isActive')}>
                              Status
                              {sortConfig?.key === 'isActive' && (
                                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentBrands.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="empty-state">
                                <div className="empty-content">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                  </svg>
                                  <p>No brands found</p>
                                  <button
                                    className="text-btn"
                                    onClick={() => setActiveTab('create')}
                                  >
                                    Create your first brand
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            currentBrands.map((brand) => (
                              <React.Fragment key={brand.id}>
                                <tr>
                                  <td>
                                    <div className="brand-info">
                                      {brand.logoUrl && (
                                        <img
                                          src={brand.logoUrl}
                                          alt={brand.name}
                                          className="brand-logo"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                      )}
                                      <span>{brand.name}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="category-list">
                                      {brand.categoryIds.map(categoryId => (
                                        <span key={categoryId} className="category-tag">
                                          {getCategoryName(categoryId)}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="truncate-text">
                                      {brand.description || '-'}
                                    </div>
                                  </td>
                                  <td>
                                    {brand.createdAt
                                      ? new Date(brand.createdAt).toLocaleDateString()
                                      : 'N/A'}
                                  </td>
                                  <td>
                                    <span className={`status-badge ${brand.isActive ? 'active' : 'inactive'}`}>
                                      {brand.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="action-buttons">
                                      <button
                                        className="icon-btn edit-btn"
                                        onClick={() => handleEdit(brand)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                      </button>
                                      <button
                                        className="icon-btn delete-btn"
                                        onClick={() => handleDelete(brand.id)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="3 6 5 6 21 6"></polyline>
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                          <line x1="10" y1="11" x2="10" y2="17"></line>
                                          <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                      </button>
                                      <button
                                        className="icon-btn view-btn"
                                        onClick={() => {
                                          if (showProducts === brand.id) {
                                            setShowProducts(null);
                                          } else {
                                            setShowProducts(brand.id);
                                            if (!products[brand.id]) {
                                              fetchProductsByBrand(brand.id);
                                            }
                                          }
                                        }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <line x1="12" y1="8" x2="12" y2="12"></line>
                                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {showProducts === brand.id && (
                                  <tr>
                                    <td colSpan={6} className="product-details">
                                      <div className="product-list-header">
                                        <h4>Products</h4>
                                        {!products[brand.id] && (
                                          <span>Loading products...</span>
                                        )}
                                      </div>

                                      {products[brand.id] && (
                                        <>
                                          {products[brand.id].length === 0 ? (
                                            <div className="no-products">
                                              No products found for this brand
                                            </div>
                                          ) : (
                                            <ul className="product-list">
                                              {products[brand.id].map(product => (
                                                <li key={product.id} className="product-item">
                                                  <div className="product-info">
                                                    <span className="product-name">{product.name}</span>
                                                    <span className="product-sku">{product.sku}</span>
                                                    <span className="product-price">${product.price.toFixed(2)}</span>
                                                  </div>
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </tbody>
                      </table>

                      {totalPages > 1 && (
                        <div className="pagination">
                          <button
                            className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>

                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                              onClick={() => paginate(i + 1)}
                            >
                              {i + 1}
                            </button>
                          ))}

                          <button
                            className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandManagement;