import React, { useState, useEffect } from 'react';
import { CategoryDto } from '../../types/product';
import './CategoryManagement.css';

interface CategoryManagementProps {
    onCategoryCreated: () => void;
}

interface CategoryImage {
    id: string;
    imageUrl: string;
    altText: string;
    displayOrder: number;
    isPrimary: boolean;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
    onCategoryCreated
}) => {
    // ===============================
    // STATE MANAGEMENT
    // ===============================
    const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
    const [displayedCategories, setDisplayedCategories] = useState<CategoryDto[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);

    const [newCategory, setNewCategory] = useState<Omit<CategoryDto, 'id'>>({
        name: '',
        description: '',
        imageUrl: '',
        displayOrder: 0,
        isActive: true,
    });

    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // ===============================
    // FETCH CATEGORIES
    // ===============================
    const fetchCategories = async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5117/api/categories`, { signal });
            if (!res.ok) throw new Error('Failed to fetch categories');

            const data = await res.json();

            if (!Array.isArray(data)) {
                throw new Error('Invalid API response format');
            }

            setAllCategories(data);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError('Failed to load categories');
                console.error(err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ===============================
    // FETCH CATEGORY IMAGES
    // ===============================
    const fetchCategoryImages = async (categoryId: string) => {
        try {
            const res = await fetch(`http://localhost:5117/api/categories/${categoryId}/images`);
            if (!res.ok) throw new Error('Failed to fetch category images');
            
            const data = await res.json();
            setCategoryImages(data);
        } catch (err) {
            console.error('Failed to fetch category images', err);
        }
    };

    // ===============================
    // FILTER AND PAGINATE CATEGORIES
    // ===============================
    useEffect(() => {
        let filtered = [...allCategories];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(category =>
                category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply active filter
        if (isActiveFilter !== null) {
            filtered = filtered.filter(category => category.isActive === isActiveFilter);
        }

        // Calculate pagination
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        setTotalPages(totalPages);

        // Handle current page bounds
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage < 1 && totalPages > 0) {
            setCurrentPage(1);
        }

        // Get current page items
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageItems = filtered.slice(startIndex, endIndex);

        setDisplayedCategories(pageItems);
    }, [allCategories, currentPage, searchTerm, isActiveFilter, pageSize]);

    // ===============================
    // USE EFFECTS
    // ===============================
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        fetchCategories(signal);

        return () => controller.abort();
    }, []);

    // Fetch images when editing a category
    useEffect(() => {
        if (editingCategory) {
            fetchCategoryImages(editingCategory.id);
        } else {
            setCategoryImages([]);
        }
    }, [editingCategory]);

    // ===============================
    // FORM HANDLING
    // ===============================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const target = editingCategory ? setEditingCategory : setNewCategory;
        target((prev: any) => ({
            ...prev,
            [name]: name === 'displayOrder' ? Number(value) : value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        const target = editingCategory ? setEditingCategory : setNewCategory;
        target((prev: any) => ({
            ...prev,
            [name]: checked
        }));
    };

    // ===============================
    // VALIDATION
    // ===============================
    const validateCategory = (category: Omit<CategoryDto, 'id'> | CategoryDto) => {
        if (!category.name.trim()) return 'Name is required';
        if (!category.description?.trim()) return 'Description is required';
        if (category.displayOrder < 0) return 'Display order must be non-negative';
        return null;
    };

    // ===============================
    // IMAGE HANDLING
    // ===============================
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('categoryId', categoryId);
        formData.append('altText', 'Category image');
        formData.append('isPrimary', 'true');

        try {
            const response = await fetch('http://localhost:5117/api/categories/images', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Image uploaded successfully');
                // Refresh category images
                if (editingCategory) {
                    fetchCategoryImages(editingCategory.id);
                }
            } else {
                setError(data.message || 'Failed to upload image');
            }
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setIsLoading(false);
            // Reset the file input
            e.target.value = '';
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`http://localhost:5117/api/categories/images/${imageId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Image deleted successfully');
                // Refresh category images
                if (editingCategory) {
                    fetchCategoryImages(editingCategory.id);
                }
            } else {
                setError(data.message || 'Failed to delete image');
            }
        } catch (err) {
            setError('Failed to delete image');
        } finally {
            setIsLoading(false);
        }
    };

    // ===============================
    // CRUD OPERATIONS
    // ===============================
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate before submission
        const validationError = validateCategory(newCategory);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Convert to PascalCase for backend
            const requestBody = {
                Name: newCategory.name,
                Description: newCategory.description,
                ImageUrl: newCategory.imageUrl,
                DisplayOrder: newCategory.displayOrder,
                IsActive: newCategory.isActive
            };

            const res = await fetch('http://localhost:5117/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create category');
            }

            setSuccess('Category created successfully');
            resetForm();
            fetchCategories();
            onCategoryCreated();
        } catch (err: any) {
            setError(err.message || 'Failed to create category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        // Validate before submission
        const validationError = validateCategory(editingCategory);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Convert to PascalCase for backend
            const requestBody = {
                Name: editingCategory.name,
                Description: editingCategory.description,
                ImageUrl: editingCategory.imageUrl,
                DisplayOrder: editingCategory.displayOrder,
                IsActive: editingCategory.isActive
            };

            const res = await fetch(`http://localhost:5117/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update category');
            }

            setSuccess('Category updated successfully');
            setEditingCategory(null);
            fetchCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to update category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`http://localhost:5117/api/categories/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete category');
            }

            setSuccess('Category deleted successfully');
            fetchCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to delete category');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`http://localhost:5117/api/categories/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update status');
            }

            setSuccess('Status updated successfully');
            fetchCategories();
        } catch (err: any) {
            setError(err.message || 'Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    // ===============================
    // HELPERS
    // ===============================
    const resetForm = () => {
        setNewCategory({
            name: '',
            description: '',
            imageUrl: '',
            displayOrder: 0,
            isActive: true,
        });
        setError(null);
        setSuccess(null);
    };

    const startEditing = (category: CategoryDto) => {
        setEditingCategory(category);
        setError(null);
        setSuccess(null);
    };

    const cancelEditing = () => {
        setEditingCategory(null);
        setError(null);
        setSuccess(null);
    };

    // ===============================
    // PAGINATION
    // ===============================
    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const renderPagination = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
                    disabled={currentPage === i}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    // ===============================
    // RENDER
    // ===============================
    return (
        <div className="category-management-dashboard">
            {/* HEADER */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Category Management</h1>
                    <p>Create and manage product categories</p>
                </div>
                <div className="stats-card">
                    <div className="stat-item">
                        <span>Total Categories</span>
                        <strong>{allCategories?.length || 0}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Active</span>
                        <strong>{(allCategories || []).filter(c => c.isActive).length}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Inactive</span>
                        <strong>{(allCategories || []).filter(c => !c.isActive).length}</strong>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <div className="dashboard-content">
                {/* FORM */}
                <div className="form-section">
                    <div className="form-card">
                        <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
                        <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                            {/* NAME */}
                            <div className="form-group">
                                <label htmlFor="name">Category Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={editingCategory ? editingCategory.name : newCategory.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter category name"
                                    required
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editingCategory ? editingCategory.description : newCategory.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter category description"
                                    required
                                    rows={3}
                                />
                            </div>

                            {/* DISPLAY ORDER & ACTIVE */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="displayOrder">Display Order *</label>
                                    <input
                                        type="number"
                                        id="displayOrder"
                                        name="displayOrder"
                                        value={editingCategory ? editingCategory.displayOrder : newCategory.displayOrder}
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
                                            checked={editingCategory ? editingCategory.isActive : newCategory.isActive}
                                            onChange={handleCheckboxChange}
                                        />
                                        <span className="checkmark"></span>
                                        Active Category
                                    </label>
                                </div>
                            </div>

                            {/* IMAGE UPLOAD (only when editing) */}
                            {editingCategory && (
                                <div className="form-group">
                                    <label>Category Images</label>
                                    <div className="image-upload-section">
                                        <label className="file-upload-btn">
                                            Upload Image
                                            <input
                                                type="file"
                                                onChange={(e) => handleImageUpload(e, editingCategory.id)}
                                                accept="image/*"
                                            />
                                        </label>
                                        
                                        {categoryImages.length > 0 && (
                                            <div className="image-preview-list">
                                                <h4>Current Images</h4>
                                                <div className="image-list">
                                                    {categoryImages.map((image) => (
                                                        <div key={image.id} className="image-item">
                                                            <img src={image.imageUrl} alt={image.altText} />
                                                            <button
                                                                type="button"
                                                                className="delete-image-btn"
                                                                onClick={() => handleDeleteImage(image.id)}
                                                                disabled={isLoading}
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

                            {/* BUTTONS */}
                            <div className="form-footer">
                                {editingCategory && (
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={cancelEditing}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className={`submit-btn ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner"></span>
                                            {editingCategory ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : editingCategory ? 'Update Category' : 'Create Category'}
                                </button>

                                {error && <div className="error-message">{error}</div>}
                                {success && <div className="success-message">{success}</div>}
                            </div>
                        </form>
                    </div>
                </div>

                {/* LIST */}
                <div className="list-section">
                    <div className="list-header">
                        <h2>Existing Categories</h2>
                        <div className="search-filter">
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                value={isActiveFilter === null ? 'all' : String(isActiveFilter)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setIsActiveFilter(
                                        value === 'all' ? null : value === 'true'
                                    );
                                }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="true">Active Only</option>
                                <option value="false">Inactive Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="categories-list">
                        {isLoading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading categories...</p>
                            </div>
                        ) : displayedCategories.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📁</div>
                                <h3>No categories found</h3>
                                <p>Create your first category to get started</p>
                            </div>
                        ) : (
                            <>
                                <div className="categories-container">
                                    {displayedCategories.map((category) => (
                                        <div key={category.id} className="category-card">
                                            <div className="category-summary">
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
                                                        <span className="order">Order: {category.displayOrder}</span>
                                                    </div>
                                                    <p className="truncated-description">
                                                        {category.description
                                                            ? (category.description.length > 100
                                                                ? `${category.description.substring(0, 100)}...`
                                                                : category.description)
                                                            : 'No description'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="category-actions">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => startEditing(category)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className="action-btn deactivate"
                                                    onClick={() => handleToggleActive(category.id, category.isActive)}
                                                >
                                                    {category.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="pagination-controls">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>

                                        {renderPagination()}

                                        <button
                                            className="pagination-btn"
                                            onClick={() => goToPage(currentPage + 1)}
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
    );
};

export default CategoryManagement;