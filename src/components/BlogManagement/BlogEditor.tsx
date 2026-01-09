import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BlogEditor.css';
import RichTextEditor from '../Helper/RichTextEditor';

interface BlogData {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImageUrl: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive?: boolean;
  viewCount?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface BlogImage {
  id: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

interface TempImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface BlogResponse {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImageUrl: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  images?: BlogImage[];
}
interface BlogEditorProps {
  mode?: 'create' | 'edit';
  blogId?: string;
  onBack?: () => void;
  onSaved?: () => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ 
  mode = 'create',
  blogId,
  onBack,
  onSaved 
}) => {
//   const { id } = useParams<{ id: string }>();
const { id: paramId } = useParams<{ id: string }>();
const id = mode === 'edit' && blogId ? blogId : (paramId || 'create');
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [blogImages, setBlogImages] = useState<BlogImage[]>([]);
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<BlogData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const [blogData, setBlogData] = useState<BlogData>({
    title: '',
    slug: '',
    shortDescription: '',
    content: '',
    featuredImageUrl: '',
    author: 'Admin',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    isPublished: true,
    isFeatured: false
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5117/api';
  const API_BASE_IMG_URL = process.env.REACT_APP_BASE_IMG_URL || 'http://localhost:5117';

  // Helper function to get full image URL for display
  const getFullImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a blob URL (temporary), return as is
    if (imageUrl.startsWith('blob:')) {
      return imageUrl;
    }
    
    // Add base URL for relative paths from blog_images table
    return API_BASE_IMG_URL + imageUrl;
  };

  // Helper to get display URL for featured image
  const getFeaturedImageDisplayUrl = (): string => {
    if (!blogData.featuredImageUrl) return '';
    
    // If featuredImageUrl is a blob URL (temporary), use as is
    if (blogData.featuredImageUrl.startsWith('blob:')) {
      return blogData.featuredImageUrl;
    }
    
    // Otherwise, prepend API_BASE_IMG_URL for display
    return getFullImageUrl(blogData.featuredImageUrl);
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!blogData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!blogData.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blogData.slug)) {
      errors.slug = 'Slug must be URL-friendly (lowercase letters, numbers, hyphens)';
    }
    
    if (!blogData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (!blogData.author.trim()) {
      errors.author = 'Author is required';
    }
    
    // Field length validations
    if (blogData.shortDescription.length > 500) {
      errors.shortDescription = 'Short description must be 500 characters or less';
    }
    
    if (blogData.metaTitle.length > 60) {
      errors.metaTitle = 'Meta title must be 60 characters or less';
    }
    
    if (blogData.metaDescription.length > 160) {
      errors.metaDescription = 'Meta description must be 160 characters or less';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form has changes
  const checkIfDirty = (): boolean => {
    if (!originalData) return true; // New blog is always "dirty"
    
    // Compare current data with original data
    const fieldsToCompare: (keyof BlogData)[] = [
      'title', 'slug', 'shortDescription', 'content', 'author',
      'metaTitle', 'metaDescription', 'metaKeywords', 
      'isPublished', 'isFeatured', 'featuredImageUrl'
    ];
    
    for (const field of fieldsToCompare) {
      if (blogData[field] !== originalData[field]) {
        return true;
      }
    }
    
    // Check if images changed
    if (tempImages.length > 0) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    if (id && id !== 'create') {
      fetchBlog();
    } else {
      // For new blog, set originalData to empty state
      setOriginalData({
        title: '',
        slug: '',
        shortDescription: '',
        content: '',
        featuredImageUrl: '',
        author: 'Admin',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        isPublished: true,
        isFeatured: false
      });
      setIsDirty(true); // New blog is always "dirty"
    }
  }, [id]);

  // Update dirty state when data changes
  useEffect(() => {
    if (originalData) {
      setIsDirty(checkIfDirty());
    }
  }, [blogData, tempImages, originalData]);

  // Fetch blog data including images from blog_images table
  const fetchBlog = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Blog not found');
          navigate('/admin/blog');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BlogResponse = await response.json();
      
      // Handle blob URLs in featuredImageUrl
      let featuredImageUrl = data.featuredImageUrl || '';
      
      if (featuredImageUrl.startsWith('blob:')) {
        if (data.images && data.images.length > 0) {
          featuredImageUrl = data.images[0].imageUrl;
        } else {
          featuredImageUrl = '';
        }
      }
      
      // Create blog data object
      const blogDataObj = {
        id: data.id,
        title: data.title || '',
        slug: data.slug || '',
        shortDescription: data.shortDescription || '',
        content: data.content || '',
        featuredImageUrl: featuredImageUrl,
        author: data.author || 'Admin',
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        metaKeywords: data.metaKeywords || '',
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        isFeatured: data.isFeatured || false,
        isActive: data.isActive,
        viewCount: data.viewCount,
        publishedAt: data.publishedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      setBlogData(blogDataObj);
      setOriginalData(blogDataObj); // Store original data for dirty checking
      
      // Set blog images from blog_images table if available
      if (data.images && Array.isArray(data.images)) {
        setBlogImages(data.images);
      }
      
    } catch (error) {
      console.error('Error fetching blog:', error);
      setError('Failed to load blog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate URL-friendly slug
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '-')
      .replace(/-+/g, '-');
  };

  // Handle image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    
    // For new blogs (not saved yet)
    if (!id || id === 'create') {
      const tempImage: TempImage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file)
      };
      
      setTempImages(prev => [...prev, tempImage]);
      
      // If this is the first image, set it as featured
      if (!blogData.featuredImageUrl) {
        setBlogData(prev => ({
          ...prev,
          featuredImageUrl: tempImage.previewUrl
        }));
      }
      
      e.target.value = '';
      return;
    }

    // For existing blogs
    setUploadingImage(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('blogId', id);
    formData.append('altText', blogData.title || 'Blog image');
    formData.append('caption', '');
    formData.append('displayOrder', '0');
    formData.append('isPrimary', 'false');

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/blogs/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success && data.image) {
        // Add to blog images list
        setBlogImages(prev => [...prev, data.image]);
        
        // If this is the first image, set it as featured
        if (!blogData.featuredImageUrl) {
          setBlogData(prev => ({
            ...prev,
            featuredImageUrl: data.image.imageUrl
          }));
        }
        
        setSuccess('Image uploaded successfully!');
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Delete image
  const handleDeleteImage = async (imageId: string, isTemporary: boolean = false): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    // If temporary image (for new blog)
    if (isTemporary) {
      const imageToDelete = tempImages.find(img => img.id === imageId);
      if (imageToDelete) {
        URL.revokeObjectURL(imageToDelete.previewUrl);
        
        setTempImages(prev => prev.filter(img => img.id !== imageId));
        
        // If deleted image was featured, clear featured image or set another
        if (blogData.featuredImageUrl === imageToDelete.previewUrl) {
          const remainingTempImages = tempImages.filter(img => img.id !== imageId);
          setBlogData(prev => ({
            ...prev,
            featuredImageUrl: remainingTempImages.length > 0 ? remainingTempImages[0].previewUrl : ''
          }));
        }
      }
      return;
    }

    // For existing blog images
    setUploadingImage(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/blogs/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBlogImages(prev => prev.filter(img => img.id !== imageId));
        
        // If deleted image was featured, clear featured image
        const deletedImage = blogImages.find(img => img.id === imageId);
        if (deletedImage && blogData.featuredImageUrl === deletedImage.imageUrl) {
          setBlogData(prev => ({
            ...prev,
            featuredImageUrl: ''
          }));
        }
        
        setSuccess('Image deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete image');
      }
    } catch (err) {
      setError('Failed to delete image');
      console.error('Delete error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Set featured image
  const handleSetFeaturedImage = (imageUrl: string, isTemporary: boolean = false): void => {
    if (isTemporary) {
      setBlogData(prev => ({
        ...prev,
        featuredImageUrl: imageUrl
      }));
      return;
    }
    
    const blogImage = blogImages.find(img => 
      getFullImageUrl(img.imageUrl) === imageUrl || img.imageUrl === imageUrl
    );
    
    if (blogImage) {
      setBlogData(prev => ({
        ...prev,
        featuredImageUrl: blogImage.imageUrl
      }));
    } else {
      setBlogData(prev => ({
        ...prev,
        featuredImageUrl: imageUrl
      }));
    }
  };

  // Upload temporary images after blog is created
  const uploadTempImagesForNewBlog = async (blogId: string): Promise<void> => {
    if (tempImages.length === 0) return;

    for (const tempImage of tempImages) {
      const formData = new FormData();
      formData.append('file', tempImage.file);
      formData.append('blogId', blogId);
      formData.append('altText', blogData.title || 'Blog image');
      formData.append('caption', '');
      formData.append('displayOrder', '0');
      formData.append('isPrimary', 'false');

      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/blogs/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          if (blogData.featuredImageUrl === tempImage.previewUrl && data.image) {
            setBlogData(prev => ({
              ...prev,
              featuredImageUrl: data.image.imageUrl
            }));
          }
        }
        
        URL.revokeObjectURL(tempImage.previewUrl);
      } catch (err) {
        console.error('Failed to upload temp image:', err);
      }
    }
    
    setTempImages([]);
  };

  // Main form submission
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('adminToken');
      const currentTime = new Date().toISOString();
      
      let cleanFeaturedImageUrl = blogData.featuredImageUrl || '';
      
      if (cleanFeaturedImageUrl.startsWith('blob:')) {
        if (blogImages.length > 0) {
          cleanFeaturedImageUrl = blogImages[0].imageUrl;
        } else if (tempImages.length > 0) {
          cleanFeaturedImageUrl = '';
        } else {
          cleanFeaturedImageUrl = '';
        }
      }
      
      // Prepare payload according to backend BlogDto
      const blogPayload = {
        id: id && id !== 'create' ? id : undefined,
        title: blogData.title,
        slug: blogData.slug || generateSlug(blogData.title),
        shortDescription: blogData.shortDescription,
        content: blogData.content,
        featuredImageUrl: cleanFeaturedImageUrl,
        author: blogData.author,
        metaTitle: blogData.metaTitle,
        metaDescription: blogData.metaDescription,
        metaKeywords: blogData.metaKeywords,
        isPublished: blogData.isPublished,
        isFeatured: blogData.isFeatured,
        isActive: true,
        viewCount: id && id !== 'create' ? blogData.viewCount || 0 : 0,
        publishedAt: blogData.isPublished ? currentTime : null,
        createdAt: id && id !== 'create' ? blogData.createdAt : currentTime,
        updatedAt: id && id !== 'create' ? currentTime : undefined
      };

      const url = id && id !== 'create' 
        ? `${API_BASE_URL}/blogs/${id}`
        : `${API_BASE_URL}/blogs`;
      
      const method = id && id !== 'create' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blogPayload)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save blog';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const savedBlogId = result.id || (id && id !== 'create' ? id : result?.id);

      // Upload temporary images for new blogs
      if (!id || id === 'create') {
        await uploadTempImagesForNewBlog(savedBlogId);
      }

      setSuccess(id && id !== 'create' 
        ? 'Blog updated successfully!' 
        : 'Blog created successfully!'
      );

      // Update original data after successful save
      if (id && id !== 'create') {
        await fetchBlog(); // This will update originalData
      } else {
        // For new blogs, reset dirty state
        setIsDirty(false);
      }

      // Redirect after successful save for new blogs
      setTimeout(() => {
        if (!id || id === 'create') {
          navigate(`/admin/blog/edit/${savedBlogId}`);
        }
      }, 1500);

      setTimeout(() => {
  if (!id || id === 'create') {
    navigate(`/admin/blog/edit/${savedBlogId}`);
  }
}, 1500);
      
    } catch (error) {
      console.error('Error saving blog:', error);
      setError(`Failed to save blog: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      tempImages.forEach(tempImage => {
        URL.revokeObjectURL(tempImage.previewUrl);
      });
    };
  }, [tempImages]);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target;
    
    setBlogData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Auto-generate slug from title
    if (name === 'title' && !blogData.slug) {
      setBlogData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = e.target;
    setBlogData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle content change
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    setBlogData(prev => ({
      ...prev,
      content: value
    }));
    
    // Clear content error
    if (formErrors.content) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };

  // Generate slug manually
  const handleGenerateSlug = (): void => {
    if (blogData.title) {
      const newSlug = generateSlug(blogData.title);
      setBlogData(prev => ({
        ...prev,
        slug: newSlug
      }));
      
      // Clear slug error
      if (formErrors.slug) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      }
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Check if submit should be enabled
  const isSubmitEnabled = (): boolean => {
    if (saving || uploadingImage) return false;
    if (!isDirty) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading blog editor...</p>
      </div>
    );
  }

  // Get all images (temporary + uploaded) with proper URLs for display
  const allImages = [
    ...tempImages.map(img => ({ 
      id: img.id, 
      imageUrl: img.previewUrl, 
      isTemporary: true,
      originalUrl: img.previewUrl
    })),
    ...blogImages.map(img => ({ 
      id: img.id, 
      imageUrl: getFullImageUrl(img.imageUrl),
      originalUrl: img.imageUrl,
      isTemporary: false 
    }))
  ];

  // Check if an image is featured
  const isImageFeatured = (image: any): boolean => {
    if (image.isTemporary) {
      return blogData.featuredImageUrl === image.imageUrl;
    } else {
      return blogData.featuredImageUrl === image.originalUrl;
    }
  };

  return (
    <div className="blog-editor-container">
    
      <div className="editor-header">
        <h1>{mode === 'edit' ? 'Edit Blog' : 'Create New Blog'}</h1>
        <div className="header-actions">
<button 
  type="button" 
  onClick={onBack || (() => navigate('/admin/blog'))} 
  className="btn-cancel"
  disabled={saving || uploadingImage}
>
  Cancel
</button>
<button 
  type="button" 
  onClick={handleSubmit} 
  disabled={!isSubmitEnabled()} 
  className="btn-save"
>
  {saving ? (
    <>
      <i className="fas fa-spinner fa-spin"></i> Saving...
    </>
  ) : (
    <>
      <i className="fas fa-save"></i> {mode === 'edit' ? 'Update Blog' : 'Publish Blog'}
    </>
  )}
</button>
          {!isDirty && id && id !== 'create' && (
            <div className="no-changes-message">
              <i className="fas fa-info-circle"></i> No changes to save
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {success && (
        <div className="alert success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-main">
          <div className="form-left">
            {/* Basic Information */}
            <div className="form-section">
              <h2>
                <i className="fas fa-info-circle"></i> Basic Information
              </h2>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={blogData.title}
                  onChange={handleInputChange}
                  placeholder="Enter blog title"
                  required
                  disabled={saving || uploadingImage}
                  className={formErrors.title ? 'error' : ''}
                />
                {formErrors.title && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {formErrors.title}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Slug *</label>
                <div className="slug-input-group">
                  <input
                    type="text"
                    name="slug"
                    value={blogData.slug}
                    onChange={handleInputChange}
                    placeholder="blog-url-slug"
                    required
                    disabled={saving || uploadingImage}
                    className={formErrors.slug ? 'error' : ''}
                  />
                  <button 
                    type="button" 
                    onClick={handleGenerateSlug}
                    className="generate-slug-btn"
                    disabled={saving || uploadingImage || !blogData.title}
                  >
                    Generate
                  </button>
                </div>
                <small className="help-text">URL-friendly version of the title</small>
                {formErrors.slug && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {formErrors.slug}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  name="shortDescription"
                  value={blogData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description for listing pages (max 500 characters)"
                  rows={3}
                  maxLength={500}
                  disabled={saving || uploadingImage}
                  className={formErrors.shortDescription ? 'error' : ''}
                />
                <small className="help-text">
                  {blogData.shortDescription.length}/500 characters
                </small>
                {formErrors.shortDescription && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {formErrors.shortDescription}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  name="author"
                  value={blogData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  required
                  disabled={saving || uploadingImage}
                  className={formErrors.author ? 'error' : ''}
                />
                {formErrors.author && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {formErrors.author}
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div className="form-section">
              <h2>
                <i className="fas fa-edit"></i> Content
              </h2>
 <div className="form-group">
    <label>Blog Content *</label>
    <RichTextEditor
      value={blogData.content}
      onChange={(content) => {
        setBlogData(prev => ({ ...prev, content }));
        // Clear content error
        if (formErrors.content) {
          setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.content;
            return newErrors;
          });
        }
      }}
      placeholder="Write your blog content here..."
    />
    <div className="content-help">
      <small className="help-text">
        Content length: {blogData.content.length} characters
      </small>
    </div>
    {formErrors.content && (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i> {formErrors.content}
      </div>
    )}
  </div>
            </div>

            {/* SEO Section */}
            <div className="form-section">
              <h2>
                <i className="fas fa-search"></i> SEO Settings
              </h2>
              <div className="form-group">
                <label>Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={blogData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="SEO title for search engines (max 60 characters)"
                  maxLength={60}
                  disabled={saving || uploadingImage}
                  className={formErrors.metaTitle ? 'error' : ''}
                />
                <small className="help-text">
                  Recommended: 50-60 characters. Current: {blogData.metaTitle.length}
                </small>
                {formErrors.metaTitle && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {formErrors.metaTitle}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={blogData.metaDescription}
                  onChange={handleInputChange}
                  placeholder="SEO description for search engines (max 160 characters)"
                  rows={3}
                  maxLength={160}
                  disabled={saving || uploadingImage}
                  className={formErrors.metaDescription ? 'error' : ''}
                />
                <small className="help-text">
                  Recommended: 150-160 characters. Current: {blogData.metaDescription.length}
                </small>
                {formErrors.metaDescription && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {formErrors.metaDescription}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Meta Keywords</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={blogData.metaKeywords}
                  onChange={handleInputChange}
                  placeholder="keyword1, keyword2, keyword3"
                  disabled={saving || uploadingImage}
                />
                <small className="help-text">Separate keywords with commas</small>
              </div>
            </div>
          </div>

          <div className="form-right">
            {/* Publish Settings */}
            <div className="form-section sidebar-section">
              <h3>
                <i className="fas fa-cog"></i> Publish Settings
              </h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={blogData.isPublished}
                    onChange={handleCheckboxChange}
                    disabled={saving || uploadingImage}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={blogData.isFeatured}
                    onChange={handleCheckboxChange}
                    disabled={saving || uploadingImage}
                  />
                  <span>Featured post</span>
                </label>
              </div>
            </div>

            {/* Featured Image */}
            <div className="form-section sidebar-section">
              <h3>
                <i className="fas fa-image"></i> Featured Image
              </h3>
              {blogData.featuredImageUrl ? (
                <div className="featured-image-preview">
                  <img 
                    src={getFeaturedImageDisplayUrl()} 
                    alt="Featured" 
                    onError={(e) => {
                      e.currentTarget.src = '/images/default-blog.jpg';
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="featured-image-actions">
                    <button 
                      type="button" 
                      onClick={() => setBlogData(prev => ({ ...prev, featuredImageUrl: '' }))}
                      className="btn-remove"
                      disabled={saving || uploadingImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="image-upload-area" 
                  onClick={() => !(saving || uploadingImage) && imageUploadRef.current?.click()}
                  style={{ 
                    cursor: (saving || uploadingImage) ? 'not-allowed' : 'pointer', 
                    opacity: (saving || uploadingImage) ? 0.7 : 1 
                  }}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>{uploadingImage ? 'Uploading...' : 'Click to upload featured image'}</p>
                  <small>JPG, PNG, GIF, WEBP • Max 5MB</small>
                  <input
                    ref={imageUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={saving || uploadingImage}
                  />
                </div>
              )}
            </div>

            {/* Image Gallery Section */}
            <div className="form-section sidebar-section">
              <h3>
                <i className="fas fa-images"></i> Image Gallery
              </h3>
              <div className="image-upload-section">
                <button 
                  type="button"
                  onClick={() => !(saving || uploadingImage) && imageUploadRef.current?.click()}
                  className="file-upload-btn"
                  disabled={saving || uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : 'Add Images'}
                </button>
                
                {allImages.length > 0 && (
                  <div className="image-preview-list">
                    <h4>Images</h4>
                    <div className="image-list">
                      {allImages.map((image) => (
                        <div key={image.id} className={`image-item ${isImageFeatured(image) ? 'featured' : ''}`}>
                          <img 
                            src={image.imageUrl} 
                            alt="Blog image"
                            onClick={() => !(saving || uploadingImage) && handleSetFeaturedImage(
                              image.isTemporary ? image.imageUrl : image.originalUrl,
                              image.isTemporary
                            )}
                            onError={(e) => {
                              e.currentTarget.src = '/images/default-blog.jpg';
                              e.currentTarget.onerror = null;
                            }}
                          />
                          <div className="image-item-actions">
                            {isImageFeatured(image) && (
                              <span className="featured-badge">Featured</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(image.id, image.isTemporary)}
                              className="delete-image-btn"
                              disabled={saving || uploadingImage}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Blog Info */}
            <div className="form-section sidebar-section">
              <h3>
                <i className="fas fa-info-circle"></i> Blog Info
              </h3>
              <div className="info-grid">
                {id && id !== 'create' && (
                  <>
                    <div className="info-item">
                      <label>Blog ID:</label>
                      <span className="info-value">{id}</span>
                    </div>
                    <div className="info-item">
                      <label>Created:</label>
                      <span className="info-value">
                        {blogData.createdAt ? new Date(blogData.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Views:</label>
                      <span className="info-value">{blogData.viewCount || 0}</span>
                    </div>
                    {blogData.updatedAt && blogData.updatedAt !== blogData.createdAt && (
                      <div className="info-item">
                        <label>Last Updated:</label>
                        <span className="info-value">
                          {new Date(blogData.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="info-item">
                      <label>Images:</label>
                      <span className="info-value">{blogImages.length}</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      <span className="info-value">
                        {blogData.isPublished ? 'Published' : 'Draft'}
                        {blogData.isFeatured && ' ★'}
                      </span>
                    </div>
                  </>
                )}
                {(!id || id === 'create') && (
                  <div className="info-item">
                    <label>Status:</label>
                    <span className="info-value">New Blog</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

<div className="form-footer">
  <button 
    type="button" 
    onClick={onBack || (() => navigate('/admin/blog'))} 
    className="btn-cancel"
    disabled={saving || uploadingImage}
  >
    Cancel
  </button>
  <button 
    type="button" 
    onClick={handleSubmit} 
    disabled={!isSubmitEnabled()} 
    className="btn-save"
  >
    {saving ? (
      <>
        <i className="fas fa-spinner fa-spin"></i> Saving...
      </>
    ) : (
      <>
        <i className="fas fa-save"></i> {mode === 'edit' ? 'Update Blog' : 'Publish Blog'}
      </>
    )}
  </button>
</div>
    </div>
  );
};

export default BlogEditor;