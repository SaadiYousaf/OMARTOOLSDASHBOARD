import React, { useState, useEffect, useCallback,useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './BlogManagement.css';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  featuredImageUrl?: string;
  shortDescription?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  publishedAt?: string | null;
  images?: BlogImage[];
}

interface BlogImage {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

interface FilterOptions {
  isPublished?: boolean;
  isFeatured?: boolean;
  search: string;
}

interface BlogManagementProps {
  onLogout?: () => void;
    onCreateBlog?: () => void;
  onEditBlog?: (id: string) => void;
  onBack?: () => void;
}

interface BlogApiResponse {
  data?: Blog[];
  items?: Blog[];
  blogs?: Blog[];
  total?: number;
  totalPages?: number;
  page?: number;
  pageSize?: number;
}

const BlogManagement: React.FC<BlogManagementProps> = ({ onLogout,  onCreateBlog,
  onEditBlog ,onBack}) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: '',
    isPublished: undefined,
    isFeatured: undefined,
  });
    const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;
  const API_BASE_IMG_URL = process.env.REACT_APP_BASE_IMG_URL;
  const FRONTEND_BASE_URL = process.env.REACT_APP_FRONTEND_BASE_URL || 'http://localhost:3001';
 
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasInitialLoad = useRef<boolean>(false);
  // Helper function to get featured image URL
  const getFeaturedImageUrl = (blog: Blog): string => {
    // Priority 2: Check blog.images array (from blog_images table)
    if (blog.images && blog.images.length > 0) {
      const primaryImage = blog.images.find(img => img.isPrimary) || blog.images[0];
      if (primaryImage?.imageUrl) {
        return API_BASE_IMG_URL + primaryImage.imageUrl;
      }
    }
    
    // Fallback: default image
    return '/images/default-blog.jpg';
  };
 const handleSearchChange = (value: string) => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Update the search value immediately
    setFilterOptions(prev => ({ ...prev, search: value }));
    
    // Set a new timeout to fetch after user stops typing (500ms delay)
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
  };
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
    useEffect(() => {
    if (filterOptions.search !== searchInput) {
      setSearchInput(filterOptions.search);
    }
  }, [filterOptions.search]);

    useEffect(() => {
    if (!loading && hasInitialLoad.current && searchInputRef.current) {
      // Only restore focus if the input was focused before loading
      searchInputRef.current.focus();
    }
  }, [loading]);
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Request images to be included in the response
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'CreatedAt',
        sortDescending: 'true',
        includeImages: 'true' // Make sure backend includes images
      });

      if (filterOptions.search) {
        queryParams.append('search', filterOptions.search);
      }
      
      if (filterOptions.isPublished !== undefined) {
        queryParams.append('isPublished', filterOptions.isPublished.toString());
      }
      
      if (filterOptions.isFeatured !== undefined) {
        queryParams.append('isFeatured', filterOptions.isFeatured.toString());
      }

      const response = await fetch(`${API_BASE_URL}/blogs?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      
      if (response.status === 404) {
        setBlogs([]);
        setPagination(prev => ({
          ...prev,
          totalPages: 1,
          total: 0
        }));
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Failed to fetch blogs: ${response.status} ${response.statusText}`);
      }
      
      const data: BlogApiResponse = await response.json();
      
      // Handle different response structures
      const blogsData = data.data || data.items || data.blogs || [];
      
      const total = data.total || blogsData.length || 0;
      const totalPages = data.totalPages || Math.ceil(total / pagination.limit) || 1;
      
      setBlogs(blogsData as Blog[]);
      setPagination(prev => ({
        ...prev,
        totalPages,
        total
      }));
    } catch (error) {
      console.error('Error fetching blogs:', error);
   setBlogs([]);
      setPagination(prev => ({
        ...prev,
        totalPages: 1,
        total: 0
      }));
    } finally {
      setLoading(false);
      // Mark that initial load is done
      if (!hasInitialLoad.current) {
        hasInitialLoad.current = true;
      }
    }
  }, [API_BASE_URL, pagination.page, pagination.limit, filterOptions]);
 const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to update the filter after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      setFilterOptions(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
  };
    const handleSearchButtonClick = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setFilterOptions(prev => ({ ...prev, search: searchInput }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
 const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setFilterOptions(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // === HANDLER FUNCTIONS ===

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    if (key === 'search') {
      setSearchInput(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setFilterOptions(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setFilterOptions(prev => ({ ...prev, [key]: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

 const clearFilters = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchInput('');
    setFilterOptions({
      search: '',
      isPublished: undefined,
      isFeatured: undefined,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${errorText}`);
      }
      
      setBlogs(prev => prev.filter(blog => blog.id !== id));
      setSelectedBlogs(prev => prev.filter(blogId => blogId !== id));
      alert('Blog deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert(`Failed to delete blog: ${(error as Error).message}`);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedBlogs.length === 0) {
      alert('Please select blogs to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedBlogs.length} blog(s)?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      let successCount = 0;
      
      for (const blogId of selectedBlogs) {
        try {
          const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error deleting blog ${blogId}:`, error);
        }
      }
      
      setBlogs(prev => prev.filter(blog => !selectedBlogs.includes(blog.id)));
      setSelectedBlogs([]);
      alert(`Successfully deleted ${successCount} out of ${selectedBlogs.length} blog(s)`);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Failed to delete blogs');
    }
  };

  const handleBulkStatusUpdate = async (field: 'isPublished' | 'isFeatured' | 'isActive', value: boolean): Promise<void> => {
    if (selectedBlogs.length === 0) {
      alert('Please select blogs to update');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const updateDto = {
        blogIds: selectedBlogs,
        [field]: value
      };

      const response = await fetch(`${API_BASE_URL}/blogs/bulk-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateDto)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bulk update failed: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setBlogs(prev => prev.map(blog => 
          selectedBlogs.includes(blog.id) ? { ...blog, [field]: value } : blog
        ));
        alert(data.message);
      }
    } catch (error) {
      console.error('Error in bulk status update:', error);
      alert('Failed to update blogs');
    }
  };

  const handleSelectBlog = (blogId: string): void => {
    setSelectedBlogs(prev => 
      prev.includes(blogId) 
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
    );
  };

  const handleSelectAll = (): void => {
    if (selectedBlogs.length === blogs.length && blogs.length > 0) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(blogs.map(blog => blog.id));
    }
  };

  const handleStatusChange = async (blogId: string, statusType: keyof Blog, newValue: boolean): Promise<void> => {
    try {
      const token = localStorage.getItem('adminToken');
      const blog = blogs.find(b => b.id === blogId);
      if (!blog) return;

      // Create updated blog object
      const updatedBlog = {
        ...blog,
        [statusType]: newValue,
        updatedAt: new Date().toISOString()
      };

      // Remove navigation properties that backend doesn't expect
      const { categories, tags, ...blogPayload } = updatedBlog as any;

      const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blogPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${errorText}`);
      }
      
      setBlogs(prev => prev.map(b => 
        b.id === blogId ? { ...b, [statusType]: newValue } : b
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handlePageChange = (newPage: number): void => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };



  const handleClearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchInput('');
    setFilterOptions(prev => ({ ...prev, search: '' }));
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Focus back on the input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const getFilterCount = (): number => {
    let count = 0;
    if (filterOptions.search) count++;
    if (filterOptions.isPublished !== undefined) count++;
    if (filterOptions.isFeatured !== undefined) count++;
    return count;
  };

  // Get unique authors from blogs
  const getUniqueAuthors = (): string[] => {
    const authors = blogs.map(blog => blog.author || 'Admin');
    const uniqueAuthors: string[] = [];
    authors.forEach(author => {
      if (author.trim() !== '' && !uniqueAuthors.includes(author)) {
        uniqueAuthors.push(author);
      }
    });
    return uniqueAuthors;
  };

  if (loading && !hasInitialLoad.current) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading blogs...</p>
      </div>
    );
  }
  return (
    <div className="blog-management-container">
         {loading && hasInitialLoad.current && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <div className="blog-management-header">
        <h1>Blog Management</h1>
        <div className="back-navigation">
      <button 
        onClick={onBack || (() => navigate('/admin/dashboard(blog)'))}
        className="back-to-dashboard"
        style={{
          padding: '8px 16px',
          background: 'transparent',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}
      >
        <i className="fas fa-arrow-left"></i>
        Back to Dashboard
      </button>
    </div>
        <div className="header-controls">
        <div className="header-left">
           <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search blogs by title, author, or content..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
                className="search-input"
                disabled={loading && !hasInitialLoad.current}
              />
              
              {searchInput && (
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="clear-search-btn"
                  disabled={loading && !hasInitialLoad.current}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              {/* <button 
                type="button" 
                onClick={handleSearchButtonClick}
                className="search-btn"
                disabled={loading && !hasInitialLoad.current}
              >
                <i className="fas fa-search"></i> Search
              </button> */}
              <button 
                type="button" 
                onClick={() => setShowFilters(!showFilters)}
                className="filter-toggle-btn"
                disabled={loading && !hasInitialLoad.current}
              >
                <i className="fas fa-filter"></i> Filters {getFilterCount() > 0 && `(${getFilterCount()})`}
              </button>
            </div>
          </div>
          <div className="header-right">
          {onCreateBlog ? (
      <button 
        onClick={onCreateBlog}
        className="create-blog-btn"
      >
        <i className="fas fa-plus"></i> Create New Blog
      </button>
    ) : (
      <Link to="/admin/blog/create" className="create-blog-btn">
        <i className="fas fa-plus"></i> Create New Blog
      </Link>
    )}
            <button 
              onClick={fetchBlogs} 
              className="refresh-btn"
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h4>Filter Blogs</h4>
              <button 
                type="button" 
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                Clear All
              </button>
            </div>
            <div className="filter-grid">
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filterOptions.isPublished === undefined ? '' : filterOptions.isPublished.toString()}
                  onChange={(e) => handleFilterChange('isPublished', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Featured</label>
                <select
                  value={filterOptions.isFeatured === undefined ? '' : filterOptions.isFeatured.toString()}
                  onChange={(e) => handleFilterChange('isFeatured', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="true">Featured</option>
                  <option value="false">Not Featured</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Author</label>
                <select
                  value={filterOptions.search?.includes('author:') ? filterOptions.search.split('author:')[1] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleFilterChange('search', `${e.target.value}`);
                    } else {
                      handleFilterChange('search', '');
                    }
                  }}
                  className="filter-select"
                >
                  <option value="">All Authors</option>
                  {getUniqueAuthors().map(author => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedBlogs.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span>{selectedBlogs.length} blog(s) selected</span>
          </div>
          <div className="bulk-buttons">
            <button 
              onClick={() => handleBulkStatusUpdate('isPublished', true)}
              className="bulk-btn publish-btn"
            >
              <i className="fas fa-check-circle"></i> Publish
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('isPublished', false)}
              className="bulk-btn draft-btn"
            >
              <i className="fas fa-times-circle"></i> Unpublish
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('isFeatured', true)}
              className="bulk-btn feature-btn"
            >
              <i className="fas fa-star"></i> Feature
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('isFeatured', false)}
              className="bulk-btn unfeature-btn"
            >
              <i className="fas fa-star-half-alt"></i> Unfeature
            </button>
            <button 
              onClick={handleBulkDelete}
              className="bulk-btn delete-btn"
            >
              <i className="fas fa-trash"></i> Delete
            </button>
            <button 
              onClick={() => setSelectedBlogs([])}
              className="bulk-btn cancel-btn"
            >
              <i className="fas fa-times"></i> Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="blogs-table-wrapper">
           {loading && !hasInitialLoad.current ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="no-blogs-message">
            <i className="fas fa-newspaper"></i>
            <h3>No blogs found</h3>
            <p>
              {filterOptions.search || getFilterCount() > 0 
                ? 'Try adjusting your search or filters' 
                : 'Create your first blog post to get started'
              }
            </p>
            {(filterOptions.search || getFilterCount() > 0) ? (
              <button 
                onClick={clearFilters}
                className="create-first-btn"
              >
                Clear Filters
              </button>
            ) : (
              <Link to="/admin/blog/create" className="create-first-btn">
                Create Your First Blog
              </Link>
            )}
          </div>
        ) : (
          <>
            <table className="blogs-table">
              <thead>
                <tr>
                  <th className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedBlogs.length === blogs.length && blogs.length > 0}
                      onChange={handleSelectAll}
                      className="select-all-checkbox"
                    />
                  </th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Views</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(blog => (
                  <tr key={blog.id} className={selectedBlogs.includes(blog.id) ? 'selected-row' : ''}>
                    <td className="select-column">
                      <input
                        type="checkbox"
                        checked={selectedBlogs.includes(blog.id)}
                        onChange={() => handleSelectBlog(blog.id)}
                        className="blog-checkbox"
                      />
                    </td>
                    <td className="blog-title-cell">
                      <div className="blog-info">
                        <img 
                          src={getFeaturedImageUrl(blog)} 
                          alt={blog.title}
                          className="blog-thumbnail"
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-blog.jpg';
                            e.currentTarget.onerror = null;
                          }}
                        />
                        <div className="blog-details">
                          <strong className="blog-title">{blog.title}</strong>
                          {blog.shortDescription && (
                            <p className="blog-description">{blog.shortDescription}</p>
                          )}
                          <small className="blog-slug">/{blog.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>{blog.author || 'Admin'}</td>
                    <td>
                      <select
                        value={blog.isPublished ? 'published' : 'draft'}
                        onChange={(e) => 
                          handleStatusChange(blog.id, 'isPublished', e.target.value === 'published')
                        }
                        className={`status-select ${blog.isPublished ? 'published' : 'draft'}`}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={blog.isFeatured || false}
                          onChange={(e) => 
                            handleStatusChange(blog.id, 'isFeatured', e.target.checked)
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td className="view-count">{blog.viewCount || 0}</td>
                    <td>
                      {new Date(blog.createdAt).toLocaleDateString()}
                      {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                        <small className="updated-text">(Updated)</small>
                      )}
                    </td>
<td>
  <div className="action-buttons">
    {onEditBlog ? (
      <button 
        onClick={() => onEditBlog(blog.id)}
        className="btn-icon btn-edit"
        title="Edit"
      >
        <FiEdit />
      </button>
    ) : (
      <Link 
        to={`/admin/blog/edit/${blog.id}`}
        className="btn-icon btn-edit"
        title="Edit"
      >
        <FiEdit />
      </Link>
    )}
    <a 
      href={`${FRONTEND_BASE_URL}/blog/${blog.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-icon btn-view"
      title="View"
    >
      <FiEye />
    </a>
    <button
      onClick={() => handleDelete(blog.id)}
      className="btn-icon btn-delete"
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
            
            {blogs.length > 0 && pagination.totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="pagination-btn"
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="blog-stats">
        <div className="stat-item">
          <span className="stat-label">Total Blogs:</span>
          <span className="stat-value">{pagination.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Published:</span>
          <span className="stat-value">
            {blogs.filter(b => b.isPublished).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Featured:</span>
          <span className="stat-value">
            {blogs.filter(b => b.isFeatured).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Drafts:</span>
          <span className="stat-value">
            {blogs.filter(b => !b.isPublished).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;