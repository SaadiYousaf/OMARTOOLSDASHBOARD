import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiImage, FiUpload, FiEdit2, FiTrash2, FiLink, FiType,
  FiHash, FiEye, FiRefreshCw, FiX, FiLayers, FiMonitor,
} from 'react-icons/fi';
import { httpClient, ApiError } from '../../services/httpClient';
import { API_BASE_IMG_URL } from '../../config';
import { useNotification } from '../../context/NotificationContext';
import OmerImage from '../shared/OmerImage';
import './HomepageSettings.css';

interface HeroImage {
  id: string;
  section: string;
  imageUrl: string;
  altText: string | null;
  linkUrl: string | null;
  ctaText: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface UploadFormState {
  file: File | null;
  previewUrl: string;
  altText: string;
  linkUrl: string;
  ctaText: string;
  displayOrder: number;
}

interface EditState {
  image: HeroImage;
  altText: string;
  linkUrl: string;
  ctaText: string;
  displayOrder: number;
  isActive: boolean;
}

const defaultUpload = (): UploadFormState => ({
  file: null,
  previewUrl: '',
  altText: '',
  linkUrl: '',
  ctaText: 'Shop Now',
  displayOrder: 0,
});

const RETRY_DELAYS = [1000, 2000, 4000, 16000];

const HomepageSettings: React.FC = () => {
  const notify = useNotification();
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; });

  const [mainImages, setMainImages] = useState<HeroImage[]>([]);
  const [secondaryImages, setSecondaryImages] = useState<HeroImage[]>([]);
  const [headerImages, setHeaderImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [mainUpload, setMainUpload] = useState<UploadFormState>(defaultUpload());
  const [secondaryUpload, setSecondaryUpload] = useState<UploadFormState>(defaultUpload());
  const [headerUpload, setHeaderUpload] = useState<UploadFormState>(defaultUpload());
  const [mainUploading, setMainUploading] = useState(false);
  const [secondaryUploading, setSecondaryUploading] = useState(false);
  const [headerUploading, setHeaderUploading] = useState(false);

  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [mainDragover, setMainDragover] = useState(false);
  const [secondaryDragover, setSecondaryDragover] = useState(false);
  const [headerDragover, setHeaderDragover] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    let lastErr: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
      }
      try {
        const all = await httpClient.get<HeroImage[]>('/site-settings/hero-images/all', true);
        setMainImages(all.filter(i => i.section === 'main'));
        setSecondaryImages(all.filter(i => i.section === 'secondary'));
        setHeaderImages(all.filter(i => i.section === 'header'));
        setIsLoading(false);
        return;
      } catch (err) {
        lastErr = err;
        if (err instanceof ApiError && err.statusCode >= 400 && err.statusCode < 500) break;
      }
    }
    setIsLoading(false);
    notifyRef.current.error('Failed to load hero images', lastErr instanceof Error ? lastErr.message : undefined);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileSelect = (
    file: File,
    section: 'main' | 'secondary' | 'header',
    setter: React.Dispatch<React.SetStateAction<UploadFormState>>
  ) => {
    const previewUrl = URL.createObjectURL(file);
    setter(prev => ({ ...prev, file, previewUrl }));
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section: 'main' | 'secondary' | 'header',
    setter: React.Dispatch<React.SetStateAction<UploadFormState>>
  ) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file, section, setter);
    e.target.value = '';
  };

  const handleDrop = (
    e: React.DragEvent,
    section: 'main' | 'secondary' | 'header',
    setter: React.Dispatch<React.SetStateAction<UploadFormState>>,
    setDrag: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file, section, setter);
    }
  };

  const handleUpload = async (
    section: 'main' | 'secondary' | 'header',
    upload: UploadFormState,
    setter: React.Dispatch<React.SetStateAction<UploadFormState>>,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!upload.file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('section', section);
      formData.append('altText', upload.altText);
      formData.append('linkUrl', upload.linkUrl);
      formData.append('ctaText', upload.ctaText || 'Shop Now');
      formData.append('displayOrder', String(upload.displayOrder));

      await httpClient.postFormData('/site-settings/hero-images', formData, true);
      const sectionLabel = section === 'main' ? 'Main Slider' : section === 'secondary' ? 'Secondary Banner' : 'Header Banner';
      notify.success('Image uploaded', `Image added to ${sectionLabel}`);
      setter(defaultUpload());
      await loadImages();
    } catch (err) {
      notify.error('Upload failed', err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this hero image? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await httpClient.delete(`/site-settings/hero-images/${id}`, true);
      notify.success('Image deleted');
      setMainImages(prev => prev.filter(i => i.id !== id));
      setSecondaryImages(prev => prev.filter(i => i.id !== id));
      setHeaderImages(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      notify.error('Delete failed', err instanceof Error ? err.message : undefined);
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (image: HeroImage) => {
    setEditState({
      image,
      altText: image.altText || '',
      linkUrl: image.linkUrl || '',
      ctaText: image.ctaText || 'Shop Now',
      displayOrder: image.displayOrder,
      isActive: image.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    setIsSaving(true);
    try {
      const updated = await httpClient.patch<{ image: HeroImage }>(
        `/site-settings/hero-images/${editState.image.id}`,
        {
          altText: editState.altText,
          linkUrl: editState.linkUrl,
          ctaText: editState.ctaText,
          displayOrder: editState.displayOrder,
          isActive: editState.isActive,
        },
        true
      );
      const img = updated.image;
      const update = (list: HeroImage[]) =>
        list.map(i => (i.id === img.id ? { ...i, ...img } : i));
      setMainImages(update);
      setSecondaryImages(update);
      setHeaderImages(update);
      notify.success('Image updated');
      setEditState(null);
    } catch (err) {
      notify.error('Update failed', err instanceof Error ? err.message : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSkeleton = () => (
    <div className="hs-images-grid">
      {[1, 2, 3].map(i => (
        <div key={i} className="hs-skeleton hs-skeleton-card" />
      ))}
    </div>
  );

  const renderImageCard = (image: HeroImage) => {
    const imgSrc = image.imageUrl ? `${API_BASE_IMG_URL}${image.imageUrl}` : undefined;
    const isDeleting = deletingId === image.id;

    return (
      <div key={image.id} className={`hs-img-card${!image.isActive ? ' hs-img-card--inactive' : ''}`}>
        <div className="hs-img-preview">
          <OmerImage src={imgSrc} alt={image.altText || 'Hero image'} />
          <span className="hs-img-order-badge">#{image.displayOrder}</span>
          {!image.isActive && <span className="hs-img-inactive-badge">Hidden</span>}
          <div className="hs-img-actions-overlay">
            <button
              className="hs-img-action-btn hs-img-action-btn--edit"
              onClick={() => openEdit(image)}
              title="Edit"
            >
              <FiEdit2 /> Edit
            </button>
            <button
              className="hs-img-action-btn hs-img-action-btn--delete"
              onClick={() => handleDelete(image.id)}
              disabled={isDeleting}
              title="Delete"
            >
              {isDeleting ? <span className="hs-spinner" /> : <FiTrash2 />}
              {isDeleting ? '' : 'Delete'}
            </button>
          </div>
        </div>
        <div className="hs-img-info">
          {image.altText && (
            <div className="hs-img-info-row">
              <FiType /><span title={image.altText}>{image.altText}</span>
            </div>
          )}
          {image.linkUrl && (
            <div className="hs-img-info-row">
              <FiLink /><span title={image.linkUrl}>{image.linkUrl}</span>
            </div>
          )}
          {image.ctaText && image.ctaText !== 'none' && (
            <span className="hs-img-cta">{image.ctaText}</span>
          )}
        </div>
      </div>
    );
  };

  const renderUploadZone = (
    section: 'main' | 'secondary' | 'header',
    upload: UploadFormState,
    setter: React.Dispatch<React.SetStateAction<UploadFormState>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
    dragover: boolean,
    setDrag: React.Dispatch<React.SetStateAction<boolean>>,
    uploading: boolean,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>
  ) => (
    <>
      {!upload.file ? (
        <div
          className={`hs-upload-zone${dragover ? ' hs-upload-zone--dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => handleDrop(e, section, setter, setDrag)}
        >
          <div className="hs-upload-zone-inner">
            <FiUpload className="hs-upload-icon" />
            <div className="hs-upload-text">
              <h4>Upload hero image</h4>
              <p>Click or drag & drop · JPG, PNG, WebP, GIF</p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hs-upload-file-input"
            accept="image/*"
            onChange={e => handleFileInputChange(e, section, setter)}
          />
        </div>
      ) : (
        <div className="hs-upload-form">
          <div className="hs-upload-form-title">
            <FiUpload /> New image details
          </div>
          <OmerImage src={upload.previewUrl} alt="Preview" className="hs-upload-preview" size="lg" />
          <div className="hs-form-row">
            <div className="hs-form-group">
              <label>Alt text</label>
              <input
                type="text"
                placeholder="e.g. Summer sale banner"
                value={upload.altText}
                onChange={e => setter(p => ({ ...p, altText: e.target.value }))}
              />
            </div>
            <div className="hs-form-group">
              <label>Link URL</label>
              <input
                type="text"
                placeholder="/category/power-tools"
                value={upload.linkUrl}
                onChange={e => setter(p => ({ ...p, linkUrl: e.target.value }))}
              />
            </div>
          </div>
          <div className="hs-form-row">
            <div className="hs-form-group">
              <label>CTA Button text</label>
              <input
                type="text"
                placeholder="Shop Now"
                value={upload.ctaText}
                onChange={e => setter(p => ({ ...p, ctaText: e.target.value }))}
              />
            </div>
            <div className="hs-form-group">
              <label>Display order</label>
              <input
                type="number"
                min={0}
                value={upload.displayOrder}
                onChange={e => setter(p => ({ ...p, displayOrder: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="hs-form-actions">
            <button
              className="hs-btn hs-btn--secondary"
              onClick={() => setter(defaultUpload())}
              disabled={uploading}
            >
              <FiX /> Cancel
            </button>
            <button
              className="hs-btn hs-btn--primary"
              onClick={() => handleUpload(section, upload, setter, setUploading)}
              disabled={uploading}
            >
              {uploading ? <span className="hs-spinner" /> : <FiUpload />}
              {uploading ? 'Uploading…' : 'Upload Image'}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="hs-page">
      <div className="hs-header">
        <div>
          <h1>Homepage Settings</h1>
          <p>Manage header promotional banner, main hero slider, and secondary banner images</p>
        </div>
        <div className="hs-header-actions">
          <button className="hs-btn hs-btn--secondary" onClick={loadImages} disabled={isLoading}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Main Hero Slider */}
      <div className="hs-section">
        <div className="hs-section-header">
          <div className="hs-section-header-left">
            <div className="hs-section-icon hs-section-icon--main">
              <FiLayers />
            </div>
            <div>
              <h2 className="hs-section-title">Main Hero Slider</h2>
              <p className="hs-section-subtitle">Full-width banner carousel at the top of the home page</p>
            </div>
          </div>
          <span className="hs-section-count">{mainImages.length} image{mainImages.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="hs-section-body">
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              {mainImages.length > 0 ? (
                <div className="hs-images-grid">
                  {mainImages
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(renderImageCard)}
                </div>
              ) : (
                <div className="hs-images-grid">
                  <div className="hs-empty-state">
                    <FiImage />
                    <span>No main slider images yet. Upload one below.</span>
                  </div>
                </div>
              )}
              {renderUploadZone(
                'main', mainUpload, setMainUpload,
                mainInputRef, mainDragover, setMainDragover,
                mainUploading, setMainUploading
              )}
            </>
          )}
        </div>
      </div>

      {/* Secondary Hero Banner */}
      <div className="hs-section">
        <div className="hs-section-header">
          <div className="hs-section-header-left">
            <div className="hs-section-icon hs-section-icon--secondary">
              <FiEye />
            </div>
            <div>
              <h2 className="hs-section-title">Secondary Hero Banner</h2>
              <p className="hs-section-subtitle">Smaller banner section displayed below the main slider</p>
            </div>
          </div>
          <span className="hs-section-count">{secondaryImages.length} image{secondaryImages.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="hs-section-body">
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              {secondaryImages.length > 0 ? (
                <div className="hs-images-grid">
                  {secondaryImages
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(renderImageCard)}
                </div>
              ) : (
                <div className="hs-images-grid">
                  <div className="hs-empty-state">
                    <FiImage />
                    <span>No secondary banner images yet. Upload one below.</span>
                  </div>
                </div>
              )}
              {renderUploadZone(
                'secondary', secondaryUpload, setSecondaryUpload,
                secondaryInputRef, secondaryDragover, setSecondaryDragover,
                secondaryUploading, setSecondaryUploading
              )}
            </>
          )}
        </div>
      </div>

      {/* Header Promotional Banner */}
      <div className="hs-section">
        <div className="hs-section-header">
          <div className="hs-section-header-left">
            <div className="hs-section-icon hs-section-icon--header">
              <FiMonitor />
            </div>
            <div>
              <h2 className="hs-section-title">Header Promotional Banner</h2>
              <p className="hs-section-subtitle">Full-width image strip displayed at the top of every page, below the navigation bar</p>
            </div>
          </div>
          <span className="hs-section-count">{headerImages.length} image{headerImages.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="hs-section-body">
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              {headerImages.length > 0 ? (
                <div className="hs-images-grid">
                  {headerImages
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(renderImageCard)}
                </div>
              ) : (
                <div className="hs-images-grid">
                  <div className="hs-empty-state">
                    <FiMonitor />
                    <span>No header banner images yet. Upload one below.</span>
                  </div>
                </div>
              )}
              {renderUploadZone(
                'header', headerUpload, setHeaderUpload,
                headerInputRef, headerDragover, setHeaderDragover,
                headerUploading, setHeaderUploading
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editState && (
        <div className="hs-edit-overlay" onClick={e => { if (e.target === e.currentTarget) setEditState(null); }}>
          <div className="hs-edit-modal">
            <div className="hs-edit-modal-header">
              <h3><FiEdit2 style={{ marginRight: 8 }} />Edit Hero Image</h3>
              <button className="hs-btn hs-btn--secondary hs-btn--sm" onClick={() => setEditState(null)}>
                <FiX />
              </button>
            </div>
            <div className="hs-edit-modal-body">
              <OmerImage
                src={editState.image.imageUrl ? `${API_BASE_IMG_URL}${editState.image.imageUrl}` : undefined}
                alt="Preview"
                className="hs-edit-preview"
                size="lg"
              />

              <div className="hs-form-row">
                <div className="hs-form-group">
                  <label><FiType style={{ marginRight: 4 }} />Alt text</label>
                  <input
                    type="text"
                    value={editState.altText}
                    placeholder="Describe the image"
                    onChange={e => setEditState(p => ({ ...p!, altText: e.target.value }))}
                  />
                </div>
                <div className="hs-form-group">
                  <label><FiLink style={{ marginRight: 4 }} />Link URL</label>
                  <input
                    type="text"
                    value={editState.linkUrl}
                    placeholder="/category/tools"
                    onChange={e => setEditState(p => ({ ...p!, linkUrl: e.target.value }))}
                  />
                </div>
              </div>
              <div className="hs-form-row">
                <div className="hs-form-group">
                  <label><FiType style={{ marginRight: 4 }} />CTA button text</label>
                  <input
                    type="text"
                    value={editState.ctaText}
                    placeholder="Shop Now"
                    onChange={e => setEditState(p => ({ ...p!, ctaText: e.target.value }))}
                  />
                </div>
                <div className="hs-form-group">
                  <label><FiHash style={{ marginRight: 4 }} />Display order</label>
                  <input
                    type="number"
                    min={0}
                    value={editState.displayOrder}
                    onChange={e => setEditState(p => ({ ...p!, displayOrder: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="hs-toggle-row">
                <label>Show on website</label>
                <label className="hs-toggle">
                  <input
                    type="checkbox"
                    checked={editState.isActive}
                    onChange={e => setEditState(p => ({ ...p!, isActive: e.target.checked }))}
                  />
                  <span className="hs-toggle-slider" />
                </label>
              </div>

              <div className="hs-form-actions" style={{ marginTop: 20 }}>
                <button className="hs-btn hs-btn--secondary" onClick={() => setEditState(null)} disabled={isSaving}>
                  <FiX /> Cancel
                </button>
                <button className="hs-btn hs-btn--primary" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <span className="hs-spinner" /> : <FiEdit2 />}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageSettings;
