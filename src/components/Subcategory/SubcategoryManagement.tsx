import React, { useState, useEffect } from 'react';
import { SubcategoryDto, CategoryDto } from '../../types/product';
import './SubcategoryManagement.css'

const SubcategoryManagement = ({ 
    categories, 
    onSubcategoryCreated 
}: { 
    categories: CategoryDto[], 
    onSubcategoryCreated: () => void 
}) => {
    const [subcategories, setSubcategories] = useState<SubcategoryDto[]>([]);
    const [newSubcategory, setNewSubcategory] = useState<Omit<SubcategoryDto, 'id'>>({ 
        name: '', 
        categoryId: categories[0]?.id || 0,
        description: '',
        imageUrl: '',
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        isActive: true,
        updatedAt: undefined
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedSubcategoryId, setExpandedSubcategoryId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchSubcategories();
    }, []);

    const fetchSubcategories = async () => {
        try {
            const res = await fetch('http://localhost:5117/api/subcategories');
            if (!res.ok) throw new Error('Failed to fetch subcategories');
            const data = await res.json();
            setSubcategories(data);
        } catch (err) {
            setError('Failed to load subcategories');
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch('http://localhost:5117/api/subcategories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newSubcategory,
                    createdAt: new Date().toISOString()
                }),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create subcategory');
            }

            setNewSubcategory({ 
                name: '', 
                categoryId: categories[0]?.id || 0,
                description: '',
                imageUrl: '',
                displayOrder: 0,
                createdAt: new Date().toISOString(),
                isActive: true,
                updatedAt: undefined
            });
            
            await fetchSubcategories();
            onSubcategoryCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create subcategory');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewSubcategory(prev => ({
            ...prev,
            [name]: name === 'categoryId' || name === 'displayOrder' ? Number(value) : value
        }));
    };

    const toggleSubcategoryDetails = (id: number) => {
        setExpandedSubcategoryId(expandedSubcategoryId === id ? null : id);
    };

    const filteredSubcategories = subcategories.filter(subcat => {
        const matchesSearch = subcat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             subcat.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = filterCategory === 'all' || 
                              subcat.categoryId === parseInt(filterCategory);
        
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Subcategory Management</h1>
                    <p>Create and manage product subcategories</p>
                </div>
                <div className="stats-card">
                    <div className="stat-item">
                        <span>Total Subcategories</span>
                        <strong>{subcategories.length}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Active</span>
                        <strong>{subcategories.filter(s => s.isActive).length}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Categories</span>
                        <strong>{categories.length}</strong>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="form-section">
                    <div className="form-card">
                        <h2>Create New Subcategory</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Subcategory Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={newSubcategory.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter subcategory name"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="categoryId">Category *</label>
                                    <select
                                        id="categoryId"
                                        name="categoryId"
                                        value={newSubcategory.categoryId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
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
                                    value={newSubcategory.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter subcategory description"
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
                                    value={newSubcategory.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                    required
                                />
                                {newSubcategory.imageUrl && (
                                    <div className="image-preview">
                                        <img 
                                            src={newSubcategory.imageUrl} 
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
                                        value={newSubcategory.displayOrder}
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
                                            checked={newSubcategory.isActive}
                                            onChange={(e) => setNewSubcategory(prev => ({
                                                ...prev,
                                                isActive: e.target.checked
                                            }))}
                                        />
                                        <span className="checkmark"></span>
                                        Active Subcategory
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
                                    ) : 'Create Subcategory'}
                                </button>
                                
                                {error && <div className="error-message">{error}</div>}
                            </div>
                        </form>
                    </div>
                </div>
                
                <div className="list-section">
                    <div className="list-header">
                        <h2>Existing Subcategories</h2>
                        <div className="search-filter">
                            <input 
                                type="text" 
                                placeholder="Search subcategories..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="subcategories-list">
                        {filteredSubcategories.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📂</div>
                                <h3>No subcategories found</h3>
                                <p>Create your first subcategory to get started</p>
                            </div>
                        ) : (
                            <div className="subcategories-container">
                                {filteredSubcategories.map((subcategory) => (
                                    <div 
                                        key={subcategory.id} 
                                        className={`subcategory-card ${expandedSubcategoryId === subcategory.id ? 'expanded' : ''}`}
                                    >
                                        <div 
                                            className="subcategory-summary" 
                                            onClick={() => toggleSubcategoryDetails(subcategory.id)}
                                        >
                                            <div className="subcategory-image">
                                                {subcategory.imageUrl ? (
                                                    <img 
                                                        src={subcategory.imageUrl} 
                                                        alt={subcategory.name} 
                                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                                    />
                                                ) : (
                                                    <div className="image-placeholder">📷</div>
                                                )}
                                            </div>
                                            <div className="subcategory-info">
                                                <h3>{subcategory.name}</h3>
                                                <div className="subcategory-meta">
                                                    <span className={`status ${subcategory.isActive ? 'active' : 'inactive'}`}>
                                                        {subcategory.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="category">
                                                        {categories.find(c => c.id === subcategory.categoryId)?.name || 'Unknown'}
                                                    </span>
                                                    <span className="order">Order: {subcategory.displayOrder}</span>
                                                </div>
                                            </div>
                                            <div className="expand-icon">
                                                {expandedSubcategoryId === subcategory.id ? '▲' : '▼'}
                                            </div>
                                        </div>
                                        
                                        {expandedSubcategoryId === subcategory.id && (
                                            <div className="subcategory-details">
                                                <p>{subcategory.description}</p>
                                                <div className="subcategory-meta-full">
                                                    <div>
                                                        <strong>Created:</strong> 
                                                        <span>{new Date(subcategory.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {subcategory.updatedAt && (
                                                        <div>
                                                            <strong>Updated:</strong> 
                                                            <span>{new Date(subcategory.updatedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong>Category ID:</strong> 
                                                        <span>{subcategory.categoryId}</span>
                                                    </div>
                                                </div>
                                                <div className="subcategory-actions">
                                                    <button className="action-btn edit">Edit</button>
                                                    <button className="action-btn delete">Delete</button>
                                                    <button className="action-btn deactivate">
                                                        {subcategory.isActive ? 'Deactivate' : 'Activate'}
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

export default SubcategoryManagement;