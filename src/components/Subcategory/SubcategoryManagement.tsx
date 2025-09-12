import React, { useState, useEffect } from 'react';
import { SubcategoryDto, CategoryDto } from '../../types/product';
import './SubcategoryManagement.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
interface SubcategoryImage {
  id: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

const SubcategoryManagement = ({
  categories,
  onSubcategoryCreated
}: {
  categories: CategoryDto[],
  onSubcategoryCreated: () => void
}) => {
  const [subcategories, setSubcategories] = useState<SubcategoryDto[]>([]);
  const [formData, setFormData] = useState<Omit<SubcategoryDto, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    categoryId: categories[0]?.id || '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true,
  });
  const [subcategoryImages, setSubcategoryImages] = useState<SubcategoryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubcategoryId, setExpandedSubcategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: 'delete' | 'toggle' | 'update' | null }>({});

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subcategories`);
      if (!res.ok) throw new Error('Failed to fetch subcategories');
      const data = await res.json();
      setSubcategories(data);
    } catch (err) {
      setError('Failed to load subcategories');
      console.error(err);
    }
  };

  const fetchSubcategoryImages = async (subcategoryId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/subcategories/${subcategoryId}/images`);
      if (!res.ok) throw new Error('Failed to fetch subcategory images');
      
      const data = await res.json();
      setSubcategoryImages(data);
    } catch (err) {
      console.error('Failed to fetch subcategory images', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, subcategoryId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('subcategoryId', subcategoryId);
    formData.append('altText', 'Subcategory image');
    formData.append('isPrimary', 'true');

    try {
      const response = await fetch(`${API_BASE_URL}/subcategories/images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh subcategory images
        if (editingId) {
          fetchSubcategoryImages(editingId);
        }
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setIsLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/subcategories/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh subcategory images
        if (editingId) {
          fetchSubcategoryImages(editingId);
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

  useEffect(() => {
    if (editingId) {
      fetchSubcategoryImages(editingId);
    } else {
      setSubcategoryImages([]);
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = editingId
        ? `${API_BASE_URL}/subcategories/${editingId}`
        : `${API_BASE_URL}/subcategories`;

      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId 
        ? { ...formData, id: editingId }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${editingId ? 'update' : 'create'} subcategory`);
      }

      // Reset form
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        description: '',
        imageUrl: '',
        displayOrder: 0,
        isActive: true,
      });

      await fetchSubcategories();
      onSubcategoryCreated();

      if (editingId) {
        setEditingId(null);
        setExpandedSubcategoryId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingId ? 'update' : 'create'} subcategory`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'displayOrder' ? Number(value) : value
    }));
  };

  const toggleSubcategoryDetails = (id: string) => {
    setExpandedSubcategoryId(expandedSubcategoryId === id ? null : id);
  };

  const handleEditClick = (subcategory: SubcategoryDto) => {
    setEditingId(subcategory.id);
    setExpandedSubcategoryId(null);

    setFormData({
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      description: subcategory.description || '',
      imageUrl: subcategory.imageUrl || '',
      displayOrder: subcategory.displayOrder || 0,
      isActive: subcategory.isActive || true,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/subcategories/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete subcategory');
      }

      await fetchSubcategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subcategory');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleToggleActive = async (subcategory: SubcategoryDto) => {
    setActionLoading(prev => ({ ...prev, [subcategory.id]: 'toggle' }));
    setError(null);

    try {
      const updatedSubcategory = { 
        ...subcategory, 
        isActive: !subcategory.isActive,
      };

      const res = await fetch(`${API_BASE_URL}/subcategories/${subcategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSubcategory),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update subcategory status');
      }

      await fetchSubcategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subcategory status');
    } finally {
      setActionLoading(prev => ({ ...prev, [subcategory.id]: null }));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      imageUrl: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  const filteredSubcategories = subcategories.filter(subcat => {
    const matchesSearch = subcat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subcat.description && subcat.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' ||
      subcat.categoryId === filterCategory;

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
            <h2>{editingId ? 'Edit Subcategory' : 'Create New Subcategory'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Subcategory Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
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
                    value={formData.categoryId}
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
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter subcategory description"
                  rows={3}
                />
              </div>

              {/* Image upload section (only when editing) */}
              {editingId && (
                <div className="form-group">
                  <label>Subcategory Images</label>
                  <div className="image-upload-section">
                    <label className="file-upload-btn">
                      Upload Image
                      <input
                        type="file"
                        onChange={(e) => handleImageUpload(e, editingId)}
                        accept="image/*"
                      />
                    </label>
                    
                    {subcategoryImages.length > 0 && (
                      <div className="image-preview-list">
                        <h4>Current Images</h4>
                        <div className="image-list">
                          {subcategoryImages.map((image) => (
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="displayOrder">Display Order *</label>
                  <input
                    type="number"
                    id="displayOrder"
                    name="displayOrder"
                    value={formData.displayOrder}
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
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({
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
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingId ? 'Update Subcategory' : 'Create Subcategory'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={cancelEdit}
                    disabled={isLoading}
                  >
                    Cancel Edit
                  </button>
                )}

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
                            <span>{subcategory.createdAt ? new Date(subcategory.createdAt).toLocaleDateString() : 'N/A'}</span>
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
                          <button
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(subcategory);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(subcategory.id);
                            }}
                            disabled={actionLoading[subcategory.id] === 'delete'}
                          >
                            {actionLoading[subcategory.id] === 'delete' ? (
                              <span className="spinner small"></span>
                            ) : 'Delete'}
                          </button>
                          <button
                            className="action-btn deactivate"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(subcategory);
                            }}
                            disabled={actionLoading[subcategory.id] === 'toggle'}
                          >
                            {actionLoading[subcategory.id] === 'toggle' ? (
                              <span className="spinner small"></span>
                            ) : subcategory.isActive ? 'Deactivate' : 'Activate'}
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