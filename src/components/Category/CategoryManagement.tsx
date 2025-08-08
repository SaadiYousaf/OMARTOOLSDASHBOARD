import React, { useState, useEffect } from 'react';
import { CategoryDto, BrandDto } from '../../types/product';
import './CategoryManagement.css'

const CategoryManagement = ({ brands, onCategoryCreated }: { 
    brands: BrandDto[], 
    onCategoryCreated: () => void 
}) => {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [newCategory, setNewCategory] = useState<Omit<CategoryDto, 'id'>>({ 
        name: '', 
        brandId: brands[0]?.id || 0,
        description: '',
        imageUrl: '',
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        isActive: true,
        updatedAt: undefined
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:5117/api/categories');
            if (!res.ok) throw new Error('Failed to fetch categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            setError('Failed to load categories');
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch('http://localhost:5117/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCategory,
                    createdAt: new Date().toISOString() // Ensure fresh timestamp
                }),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create category');
            }

            // Reset form to initial state
            setNewCategory({ 
                name: '', 
                brandId: brands[0]?.id || 0,
                description: '',
                imageUrl: '',
                displayOrder: 0,
                createdAt: new Date().toISOString(),
                isActive: true,
                updatedAt: undefined
            });
            
            // Refresh categories list and notify parent
            await fetchCategories();
            onCategoryCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCategory(prev => ({
            ...prev,
            [name]: name === 'brandId' || name === 'displayOrder' ? Number(value) : value
        }));
    };

    const toggleCategoryDetails = (id: number) => {
        setExpandedCategoryId(expandedCategoryId === id ? null : id);
    };

    return (
        <div className="category-management-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Category Management</h1>
                    <p>Create and manage product categories</p>
                </div>
                <div className="stats-card">
                    <div className="stat-item">
                        <span>Total Categories</span>
                        <strong>{categories.length}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Active</span>
                        <strong>{categories.filter(c => c.isActive).length}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Brands</span>
                        <strong>{brands.length}</strong>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="form-section">
                    <div className="form-card">
                        <h2>Create New Category</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Category Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={newCategory.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter category name"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="brandId">Brand *</label>
                                    <select
                                        id="brandId"
                                        name="brandId"
                                        value={newCategory.brandId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {brands.map((brand) => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={newCategory.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter category description"
                                    required
                                    rows={3}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="imageUrl">Image URL *</label>
                                <input
                                    type="text"
                                    id="imageUrl"
                                    name="imageUrl"
                                    value={newCategory.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                    required
                                />
                                {newCategory.imageUrl && (
                                    <div className="image-preview">
                                        <img 
                                            src={newCategory.imageUrl} 
                                            alt="Preview" 
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                        <span>Image Preview</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="displayOrder">Display Order *</label>
                                    <input
                                        type="number"
                                        id="displayOrder"
                                        name="displayOrder"
                                        value={newCategory.displayOrder}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        required
                                        min="0"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={newCategory.isActive}
                                            onChange={(e) => setNewCategory(prev => ({
                                                ...prev,
                                                isActive: e.target.checked
                                            }))}
                                        />
                                        <span className="checkmark"></span>
                                        Active Category
                                    </label>
                                </div>
                            </div>
                            
                            <div className="form-footer">
                                <button 
                                    type="submit" 
                                    className={`submit-btn ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Creating...
                                        </>
                                    ) : 'Create Category'}
                                </button>
                                
                                {error && <div className="error-message">{error}</div>}
                            </div>
                        </form>
                    </div>
                </div>
                
                <div className="list-section">
                    <div className="list-header">
                        <h2>Existing Categories</h2>
                        <div className="search-filter">
                            <input type="text" placeholder="Search categories..." />
                            <select>
                                <option>All Brands</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="categories-list">
                        {categories.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📁</div>
                                <h3>No categories found</h3>
                                <p>Create your first category to get started</p>
                            </div>
                        ) : (
                            <div className="categories-container">
                                {categories.map((category) => (
                                    <div 
                                        key={category.id} 
                                        className={`category-card ${expandedCategoryId === category.id ? 'expanded' : ''}`}
                                    >
                                        <div 
                                            className="category-summary" 
                                            onClick={() => toggleCategoryDetails(category.id)}
                                        >
                                            <div className="category-image">
                                                {category.imageUrl ? (
                                                    <img 
                                                        src={category.imageUrl} 
                                                        alt={category.name} 
                                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                                    />
                                                ) : (
                                                    <div className="image-placeholder">📷</div>
                                                )}
                                            </div>
                                            <div className="category-info">
                                                <h3>{category.name}</h3>
                                                <div className="category-meta">
                                                    <span className={`status ${category.isActive ? 'active' : 'inactive'}`}>
                                                        {category.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="brand">
                                                        {brands.find(b => b.id === category.brandId)?.name || 'Unknown'}
                                                    </span>
                                                    <span className="order">Order: {category.displayOrder}</span>
                                                </div>
                                            </div>
                                            <div className="expand-icon">
                                                {expandedCategoryId === category.id ? '▲' : '▼'}
                                            </div>
                                        </div>
                                        
                                        {expandedCategoryId === category.id && (
                                            <div className="category-details">
                                                <p>{category.description}</p>
                                                <div className="category-meta-full">
                                                    <div>
                                                        <strong>Created:</strong> 
                                                        <span>{new Date(category.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {category.updatedAt && (
                                                        <div>
                                                            <strong>Updated:</strong> 
                                                            <span>{new Date(category.updatedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong>Brand ID:</strong> 
                                                        <span>{category.brandId}</span>
                                                    </div>
                                                </div>
                                                <div className="category-actions">
                                                    <button className="action-btn edit">Edit</button>
                                                    <button className="action-btn delete">Delete</button>
                                                    <button className="action-btn deactivate">
                                                        {category.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;