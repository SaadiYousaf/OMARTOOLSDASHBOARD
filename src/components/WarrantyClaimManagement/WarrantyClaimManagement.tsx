import React, { useEffect, useState, useMemo } from 'react';
import './WarrantyClaimManagement.css';
import { 
  WarrantyClaimDto, 
  WarrantyDashboardStats,
  UpdateWarrantyClaimStatusDto, 
  WarrantyClaimImageDto,
  ProductClaimDto
} from '../../types/warranty';
import { 
  FiSearch, FiFilter, FiRefreshCw, FiEye, FiEdit, FiTrash2, 
  FiCheck, FiX, FiDownload, FiPrinter, FiMail, FiUser, 
  FiCalendar, FiPackage, FiClipboard, FiAlertCircle,
  FiCheckCircle, FiClock, FiXCircle, FiArchive,
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi';
import StatsCard from '../ProductManagement/StatsCard';
import DashboardHeader from '../ProductManagement/DashboardHeader';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_BASE_IMG_URL = process.env.REACT_APP_BASE_IMG_URL;

const WarrantyClaimManagement: React.FC = () => {
  // State for data
  const [claims, setClaims] = useState<WarrantyClaimDto[]>([]);
  const [stats, setStats] = useState<WarrantyDashboardStats>({
    totalClaims: 0,
    submittedCount: 0,
    underReviewCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    completedCount: 0,
    monthlyStats: []
  });
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaimDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [claimTypeFilter, setClaimTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [previewImage, setPreviewImage] = useState<{ image: WarrantyClaimImageDto; index: number } | null>(null);
const [downloading, setDownloading] = useState<string | null>(null);
const [downloadProgress, setDownloadProgress] = useState(0);
const [downloadingAll, setDownloadingAll] = useState(false);
  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<UpdateWarrantyClaimStatusDto>({
    status: 'picked_up',
    statusNotes: '',
    assignedTo: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
const [editFormData, setEditFormData] = useState<{
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  claimType: string;
  model:string;
  serial:string;
  FaultDesc:string;
  commonFaultDescription: string;
  products: Array<{
    id?: string;
    modelNumber: string;
    serialNumber: string;
    faultDescription: string;
  }>;
}>({
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
  claimType: '',
  commonFaultDescription: '',
  model:'',
  serial:'',
  FaultDesc:'',
  products: []
});

const handleDownloadImage = async (image: WarrantyClaimImageDto) => {
  setDownloading(image.id);
  
  try {
    // Extract filename from imageUrl
    const imageUrl = image.imageUrl;
    const filename = imageUrl.split('/').pop();
    
    if (!filename) {
      throw new Error('Could not extract filename');
    }
    
    
    // Use API endpoint WITHOUT credentials
    const apiUrl = `${API_BASE_URL}/warrantyclaims/fault/${filename}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      // REMOVE credentials: 'include' - it's causing the CORS issue
      // credentials: 'include'  // ❌ Remove this line
    });
    
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    // Create filename
    const extension = image.fileType?.replace('.', '') || 'jpg';
    const downloadFilename = image.fileName || `fault-image-${image.id}.${extension}`;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    setSuccess(`Image downloaded: ${downloadFilename}`);
    setTimeout(() => setSuccess(null), 3000);
    
  } catch (error) {
    
    // Fallback: Try direct download without API
    try {
      const imageUrl = image.imageUrl;
      const filename = imageUrl.split('/').pop();
      if (filename) {
        // Try without API endpoint
        const directUrl = `${window.location.origin}/api/warrantyclaims/fault/${filename}`;
        
        // Create iframe for download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = directUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 5000);
      }
    } catch (fallbackError) {
      setError(`Failed to download image. Please check console for details.`);
    }
  } finally {
    setDownloading(null);
  }
};

const handleEditClaim = (claim: WarrantyClaimDto) => {
  setSelectedClaim(claim);
  
  // Check the original format of the claim
  const hasProducts = claim.products && claim.products.length > 0;
  const isSingleProduct = !hasProducts && (claim.modelNumber || claim.faultDescription);
  
  if (hasProducts) {
    // This is a multi-product claim - populate ONLY products array
    setEditFormData({
      fullName: claim.fullName,
      email: claim.email,
      phoneNumber: claim.phoneNumber,
      address: claim.address,
      claimType: claim.claimType,
      model: '', // DON'T populate single fields
      serial: '',
      FaultDesc: '',
      commonFaultDescription: claim.commonFaultDescription || '',
      products: (claim.products || []).map(product => ({
        id: product.id,
        modelNumber: product.modelNumber,
        serialNumber: product.serialNumber || '',
        faultDescription: product.faultDescription || ''
      }))
    });
  } else if (isSingleProduct) {
    // This is a single product claim - populate ONLY single fields
    setEditFormData({
      fullName: claim.fullName,
      email: claim.email,
      phoneNumber: claim.phoneNumber,
      address: claim.address,
      claimType: claim.claimType,
      model: claim.modelNumber,
      serial: claim.serialNumber || '',
      FaultDesc: claim.faultDescription || '',
      commonFaultDescription: claim.commonFaultDescription || '',
      products: [] // EMPTY array for single product claims
    });
  } else {
    // Fallback for claims with no product data (shouldn't happen)
    setEditFormData({
      fullName: claim.fullName,
      email: claim.email,
      phoneNumber: claim.phoneNumber,
      address: claim.address,
      claimType: claim.claimType,
      model: '',
      serial: '',
      FaultDesc: '',
      commonFaultDescription: claim.commonFaultDescription || '',
      products: []
    });
  }
  
  setShowEditModal(true);
};

const handleEditSubmit = async () => {
  if (!selectedClaim) return;

  setIsLoading(true);
  try {
    // Always include basic fields
    const updateData: any = {
      fullName: editFormData.fullName,
      email: editFormData.email,
      phoneNumber: editFormData.phoneNumber,
      address: editFormData.address,
      claimType: editFormData.claimType,
      commonFaultDescription: editFormData.commonFaultDescription
    };

    // Add product data based on which format is being used
    if (editFormData.products.length > 0) {
      // Multi-product format
      updateData.products = editFormData.products.filter(p => 
        p.modelNumber || p.serialNumber || p.faultDescription
      );
    } else {
      // Single product format (or no product data)
      updateData.legacyModelNumber = editFormData.model;
      updateData.legacySerialNumber = editFormData.serial;
      updateData.legacyFaultDescription = editFormData.FaultDesc;
    }

    console.log('Sending update:', updateData); // For debugging

    const response = await fetch(`${API_BASE_URL}/warrantyclaims/${selectedClaim.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update claim: ${errorText}`);
    }

    await fetchInitialData();
    setSuccess('Claim updated successfully');
    setShowEditModal(false);
    setSelectedClaim(null);
    setTimeout(() => setSuccess(null), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to update claim');
  } finally {
    setIsLoading(false);
  }
};
// Add product to edit form
const handleAddProduct = () => {
  setEditFormData(prev => ({
    ...prev,
    products: [
      ...prev.products,
      { modelNumber: '', serialNumber: '', faultDescription: '' }
    ]
  }));
};

// Remove product from edit form
const handleRemoveProduct = (index: number) => {
  setEditFormData(prev => ({
    ...prev,
    products: prev.products.filter((_, i) => i !== index)
  }));
};

// Update product field
const handleProductChange = (index: number, field: string, value: string) => {
  setEditFormData(prev => ({
    ...prev,
    products: prev.products.map((product, i) =>
      i === index ? { ...product, [field]: value } : product
    )
  }));
};
const handleDownloadAllImages = async (images: WarrantyClaimImageDto[]) => {
  if (!images || images.length === 0) return;
  
  setDownloadingAll(true);
  setDownloadProgress(0);
  
  try {
    const zip = new JSZip();
    const claimNumber = selectedClaim?.claimNumber || 'claim';
    
    let successCount = 0;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = image.imageUrl.split('/').pop();
      
      if (!filename) continue;
      
      try {
        // Use API endpoint WITHOUT credentials
        const apiUrl = `${API_BASE_URL}/warrantyclaims/fault/${filename}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET'
          // NO credentials
        });
        
        
        if (response.ok) {
          const blob = await response.blob();
          
          if (blob.size > 0) {
            const extension = image.fileType?.replace('.', '') || 'jpg';
            const zipFilename = `image-${i + 1}.${extension}`;
            zip.file(zipFilename, blob);
            successCount++;
          }
        }
      } catch (error) {
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / images.length) * 100);
      setDownloadProgress(progress);
    }
    
    
    if (successCount > 0) {
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warranty-${claimNumber}-images.zip`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess(`Downloaded ${successCount} images as ZIP`);
    } else {
      // Fallback: Download images one by one
      setError('ZIP failed. Downloading images individually...');
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const filename = image.imageUrl.split('/').pop();
        
        if (filename) {
          // Create iframe to trigger download
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `${API_BASE_URL}/warrantyclaims/fault/${filename}`;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
          
          // Delay between downloads
          if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }
    
  } catch (error) {
    setError('Failed to download. Please try individual images.');
  } finally {
    setDownloadingAll(false);
    setDownloadProgress(0);
  }
};
const handleImagePreview = (image: WarrantyClaimImageDto, index: number) => {
  setPreviewImage({ image, index });
};


const handleNextImage = () => {
  if (previewImage && selectedClaim) {
    const nextIndex = (previewImage.index + 1) % selectedClaim.faultImages.length;
    setPreviewImage({ 
      image: selectedClaim.faultImages[nextIndex], 
      index: nextIndex 
    });
  }
};

const handlePrevImage = () => {
  if (previewImage && selectedClaim) {
    const prevIndex = previewImage.index === 0 
      ? selectedClaim.faultImages.length - 1 
      : previewImage.index - 1;
    setPreviewImage({ 
      image: selectedClaim.faultImages[prevIndex], 
      index: prevIndex 
    });
  }
};

  // Fetch all data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update stats when claims change
  useEffect(() => {
    if (claims.length > 0) {
      updateStats(claims);
    }
  }, [claims]);

  // Filter claims based on search and filters
  const filteredClaims = useMemo(() => {
    let results = claims;

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(claim =>
        claim.claimNumber.toLowerCase().includes(term) ||
        claim.fullName.toLowerCase().includes(term) ||
        claim.email.toLowerCase().includes(term) ||
        claim.phoneNumber.toLowerCase().includes(term) ||
        claim.modelNumber.toLowerCase().includes(term) ||
           (claim.products && claim.products.some(product => 
      product.modelNumber.toLowerCase().includes(term) ||
      (product.serialNumber && product.serialNumber.toLowerCase().includes(term))
    ))  // <-- Fixed: Added closing parenthesis and curly brace
  );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(claim => claim.status === statusFilter);
    }

    // Apply claim type filter
    if (claimTypeFilter !== 'all') {
      results = results.filter(claim => claim.claimType === claimTypeFilter);
    }

    // Apply date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      results = results.filter(claim => new Date(claim.submittedAt) >= fromDate);
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      results = results.filter(claim => new Date(claim.submittedAt) <= toDate);
    }

    return results;
  }, [claims, searchTerm, statusFilter, claimTypeFilter, dateRange]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClaims = filteredClaims.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);

  // Main data fetching functions
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [claimsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/warrantyclaims`),
        fetch(`${API_BASE_URL}/warrantyclaims/dashboard/stats`)
      ]);

      if (!claimsRes.ok) throw new Error('Failed to fetch claims');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');

      const claimsData = await claimsRes.json();
      const statsData = await statsRes.json();

      setClaims(claimsData.data || claimsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setClaims([]);
      setStats({
        totalClaims: 0,
        submittedCount: 0,
        underReviewCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        completedCount: 0,
        monthlyStats: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (claimsList: WarrantyClaimDto[]) => {
    const newStats: WarrantyDashboardStats = {
      totalClaims: claimsList.length,
      submittedCount: claimsList.filter(c => c.status === 'submitted').length,
      underReviewCount: claimsList.filter(c => c.status === 'picked_up').length,
      approvedCount: claimsList.filter(c => c.status === 'approved').length,
      rejectedCount: claimsList.filter(c => c.status === 'rejected').length,
      completedCount: claimsList.filter(c => c.status === 'completed').length,
      monthlyStats: []
    };
    setStats(newStats);
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: <FiClock /> },
      picked_up: { label: 'Picked Up', color: 'bg-yellow-100 text-yellow-800', icon: <FiAlertCircle /> },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <FiXCircle /> },
      completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: <FiArchive /> }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, color: 'bg-gray-100 text-gray-800', icon: <FiClipboard /> };

    return (
      <span className={`status-badge ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Claim type badge component
  const ClaimTypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const typeConfig = {
      'warranty-inspection': { label: 'Warranty Inspection', color: 'bg-blue-50 text-blue-700' },
      'service-repair': { label: 'Service Repair', color: 'bg-green-50 text-green-700' },
      'firstup-failure': { label: 'Firstup Failure', color: 'bg-orange-50 text-orange-700' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || 
                   { label: type, color: 'bg-gray-50 text-gray-700' };

    return <span className={`type-badge ${config.color}`}>{config.label}</span>;
  };

  // CRUD operations
  const handleViewDetails = (claim: WarrantyClaimDto) => {
    setSelectedClaim(claim);
  };

  const handleUpdateStatus = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (claim) {
      setStatusUpdateData({
        status: claim.status,
        statusNotes: claim.statusNotes || '',
        assignedTo: claim.assignedTo || ''
      });
      setSelectedClaim(claim);
      setShowStatusModal(true);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!window.confirm('Are you sure you want to delete this claim?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/warrantyclaims/${claimId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete claim');

      await fetchInitialData();
      setSuccess('Claim deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete claim');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusSubmit = async () => {
    if (!selectedClaim) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/warrantyclaims/${selectedClaim.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdateData)
      });

      if (!response.ok) throw new Error('Failed to update status');

      await fetchInitialData();
      setSuccess('Status updated successfully');
      setShowStatusModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintClaim = async (claimId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/warrantyclaims/${claimId}/print`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `warranty-claim-${claimId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to generate print file');
    }
  };

  // Date formatting helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="warranty-dashboard-container">
      <DashboardHeader
        title="Warranty Claim Management"
        onRefresh={fetchInitialData}
      />

      {error && (
        <div className="alert alert-error">
          <div className="alert-content">{error}</div>
          <button className="alert-close" onClick={() => setError(null)}>
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <div className="alert-content">
            <FiCheck className="alert-icon" /> {success}
          </div>
          <button className="alert-close" onClick={() => setSuccess(null)}>
            <FiX />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          icon={<FiClipboard />}
          trend="up"
        />
        <StatsCard
          title="Submitted"
          value={stats.submittedCount}
          icon={<FiClock />}
          trend="neutral"
        />
        <StatsCard
          title="Picked Up"
          value={stats.underReviewCount}
          icon={<FiAlertCircle />}
          trend="up"
        />
        <StatsCard
          title="Approved"
          value={stats.approvedCount}
          icon={<FiCheckCircle />}
          trend="up"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejectedCount}
          icon={<FiXCircle />}
          trend="down"
        />
        <StatsCard
          title="Completed"
          value={stats.completedCount}
          icon={<FiArchive />}
          trend="up"
        />
      </div>

      {/* Main Content Card */}
      <div className="card">
        <div className="card-header">
          <h2>Warranty Claims</h2>
          <div className="card-actions">
            {/* Search and Filters */}
            <div className="search-controls">
              <div className="search-input-wrapper">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by claim #, name, email, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="picked_up">Picked Up</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={claimTypeFilter}
                onChange={(e) => setClaimTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="warranty-inspection">Warranty Inspection</option>
                <option value="service-repair">Service Repair</option>
                <option value="firstup-failure">Firstup Failure</option>
              </select>

              <div className="date-range">
                <input
                  type="date"
                  placeholder="From Date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                />
                <span>to</span>
                <input
                  type="date"
                  placeholder="To Date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                />
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setClaimTypeFilter('all');
                  setDateRange({ from: '', to: '' });
                }}
                disabled={isLoading}
              >
                <FiRefreshCw /> Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Claims Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Products</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && claims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      <div className="loading-spinner">Loading claims...</div>
                    </td>
                  </tr>
                ) : currentClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      <div className="no-results">No warranty claims found</div>
                    </td>
                  </tr>
                ) : (
                  currentClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <div className="claim-number">
                          <strong>{claim.claimNumber}</strong>
                          <div className="claim-id">{claim.id.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{claim.fullName}</div>
                          <div className="customer-contact">
                            {claim.email} • {claim.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td>
                        <ClaimTypeBadge type={claim.claimType} />
                      </td>
                      <td>
  <div className="product-info">
    <div className="products-count">
      <FiPackage /> {claim.products?.length || 1} product(s)
    </div>
    {claim.products && claim.products.length > 0 && (
      <div className="products-preview">
        {claim.products.slice(0, 2).map((product, idx) => (
          <span key={idx} className="product-chip">
            {product.modelNumber}
          </span>
        ))}
        {claim.products.length > 2 && (
          <span className="product-chip-more">
            +{claim.products.length - 2} more
          </span>
        )}
      </div>
    )}
    {/* Keep backward compatibility for old claims without products array */}
    {(!claim.products || claim.products.length === 0) && claim.modelNumber && (
      <div className="model-number">
        {claim.modelNumber}
        {claim.serialNumber && (
          <div className="serial-number">
            SN: {claim.serialNumber}
          </div>
        )}
      </div>
    )}
  </div>
                      </td>
                      <td>
                        <div className="date-info">
                          {formatDate(claim.submittedAt)}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={claim.status} />
                      </td>
                      <td>
                        {claim.assignedTo ? (
                          <div className="assigned-to">
                            <FiUser /> {claim.assignedTo}
                          </div>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-view"
                            onClick={() => handleViewDetails(claim)}
                            title="View Details"
                          >
                            <FiEye />
                          </button>
                          <button
      className="btn-icon btn-edit"
      onClick={() => handleEditClaim(claim)}
      title="Edit Claim"
    >
      <FiEdit />
    </button>
                          {/* <button
                            className="btn-icon btn-edit"
                            onClick={() => handleUpdateStatus(claim.id)}
                            title="Update Status"
                          >
                            <FiEdit />
                          </button> */}
                          <button
                            className="btn-icon btn-print"
                            onClick={() => handlePrintClaim(claim.id)}
                            title="Print Claim"
                          >
                            <FiPrinter />
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteClaim(claim.id)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClaims.length)} 
                  of {filteredClaims.length} claims
                </div>
                <div className="pagination-controls">
                  <div className="pagination-buttons">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="pagination-nav"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-nav"
                    >
                      Previous
                    </button>
                    
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
  let pageNum: number; // Add type annotation here
  
  if (totalPages <= 5) {
    pageNum = i + 1;
  } else if (currentPage <= 3) {
    pageNum = i + 1;
  } else if (currentPage >= totalPages - 2) {
    pageNum = totalPages - 4 + i;
  } else {
    pageNum = currentPage - 2 + i;
  }
  
  return (
    <button
      key={pageNum}
      onClick={() => setCurrentPage(pageNum)}
      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
    >
      {pageNum}
    </button>
  );
})}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="pagination-nav"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="pagination-nav"
                    >
                      Last
                    </button>
                  </div>
                  
                  <div className="pagination-page-size">
                    <label>Items per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
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
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedClaim && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Claim Status</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowStatusModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Claim #:</strong> {selectedClaim.claimNumber}</p>
                <p><strong>Customer:</strong> {selectedClaim.fullName}</p>
                <p><strong>Product:</strong> {selectedClaim.modelNumber}</p>
                <p><strong>Current Status:</strong> <StatusBadge status={selectedClaim.status} /></p>
              </div>
              
              <div className="form-group">
                <label>New Status *</label>
                <select
                  value={statusUpdateData.status}
                  onChange={(e) => setStatusUpdateData({
                    ...statusUpdateData,
                    status: e.target.value as any
                  })}
                >
                  <option value="submitted">Submitted</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  placeholder="Enter assignee name"
                  value={statusUpdateData.assignedTo}
                  onChange={(e) => setStatusUpdateData({
                    ...statusUpdateData,
                    assignedTo: e.target.value
                  })}
                />
              </div>
              
              <div className="form-group">
                <label>Status Notes</label>
                <textarea
                  placeholder="Add notes about this status change..."
                  value={statusUpdateData.statusNotes}
                  onChange={(e) => setStatusUpdateData({
                    ...statusUpdateData,
                    statusNotes: e.target.value
                  })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowStatusModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStatusSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Details Modal */}
      {selectedClaim && !showStatusModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Claim Details: {selectedClaim.claimNumber}</h3>
              <button 
                className="modal-close" 
                onClick={() => setSelectedClaim(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="claim-details-grid">
                <div className="detail-section">
                  <h4><FiUser /> Customer Information</h4>
                  <p><strong>Name:</strong> {selectedClaim.fullName}</p>
                  <p><strong>Email:</strong> {selectedClaim.email}</p>
                  <p><strong>Phone:</strong> {selectedClaim.phoneNumber}</p>
                  <p><strong>Address:</strong> {selectedClaim.address}</p>
                </div>
                
                <div className="detail-section">
  <h4><FiPackage /> Products Information</h4>
  
  {/* Show common fault description if available */}
  {selectedClaim.commonFaultDescription && (
    <div className="common-fault-description">
      <strong>Common Issue:</strong> {selectedClaim.commonFaultDescription}
    </div>
  )}
  
  {/* Products List */}
  <div className="products-list">
    {(selectedClaim.products && selectedClaim.products.length > 0) ? (
      selectedClaim.products.map((product, index) => (
        <div key={product.id || index} className="product-item">
          <div className="product-header">
            <span className="product-number">Product #{index + 1}</span>
          </div>
          <div className="product-details">
            <p><strong>Model:</strong> {product.modelNumber}</p>
            {product.serialNumber && (
              <p><strong>Serial:</strong> {product.serialNumber}</p>
            )}
            {product.faultDescription && (
              <p><strong>Specific Fault:</strong> {product.faultDescription}</p>
            )}
          </div>
        </div>
      ))
    ) : (
      /* Backward compatibility for single product */
      <div className="product-item">
        <div className="product-details">
          <p><strong>Model:</strong> {selectedClaim.modelNumber}</p>
          {selectedClaim.serialNumber && (
            <p><strong>Serial:</strong> {selectedClaim.serialNumber}</p>
          )}
          {selectedClaim.faultDescription && (
            <p><strong>Fault Description:</strong> {selectedClaim.faultDescription}</p>
          )}
        </div>
      </div>
    )}
  </div>
</div>
                
                <div className="detail-section">
                  <h4><FiClipboard /> Claim Status</h4>
                  <p><strong>Status:</strong> <StatusBadge status={selectedClaim.status} /></p>
                  <p><strong>Assigned To:</strong> {selectedClaim.assignedTo || 'Unassigned'}</p>
                  <p><strong>Reviewed:</strong> {selectedClaim.reviewedAt ? formatDate(selectedClaim.reviewedAt) : 'Not reviewed'}</p>
                  <p><strong>Completed:</strong> {selectedClaim.completedAt ? formatDate(selectedClaim.completedAt) : 'Not completed'}</p>
                </div>
                
<div className="detail-section full-width">
  <h4><FiAlertCircle /> Fault Description</h4>
  <div className="fault-description">
    {/* Show common description if available, otherwise show first product's or single description */}
    {selectedClaim.commonFaultDescription || 
     (selectedClaim.products && selectedClaim.products.length > 0 
      ? selectedClaim.products[0].faultDescription 
      : selectedClaim.faultDescription)}
  </div>
</div>
                
                {selectedClaim.statusNotes && (
                  <div className="detail-section full-width">
                    <h4>Status Notes</h4>
                    <div className="status-notes">
                      {selectedClaim.statusNotes}
                    </div>
                  </div>
                )}
                
                {selectedClaim.proofOfPurchasePath && (
                  <div className="detail-section">
                    <h4>Proof of Purchase</h4>
                    <div className="file-attachment">
                      <FiDownload />
                      <a 
                        href={API_BASE_IMG_URL + selectedClaim.proofOfPurchasePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedClaim.proofOfPurchaseFileName}
                      </a>
                    </div>
                  </div>
                )}
                
{selectedClaim.faultImages.length > 0 && (
  <div className="detail-section full-width">
    <div className="gallery-header">
      <h4>
        <FiAlertCircle /> Fault Images 
        <span className="image-counter">{selectedClaim.faultImages.length}</span>
      </h4>
<button 
  className="download-all-btn"
  onClick={() => handleDownloadAllImages(selectedClaim.faultImages)}
  disabled={selectedClaim.faultImages.length === 0 || downloadingAll}
>
  <FiDownload /> 
  {downloadingAll ? `Downloading... ${downloadProgress}%` : 'Download All as ZIP'}
</button>
    </div>
    
    <div className="image-gallery">
      {selectedClaim.faultImages.map((image, index) => (
        <div key={image.id} className="image-thumbnail">
          <img 
            src={API_BASE_IMG_URL + image.imageUrl} 
            alt={`Fault image ${index + 1}`}
            onClick={() => handleImagePreview(image, index)}
          />
          <div className="image-info">
            {Math.round(image.fileSize / 1024)}KB
          </div>
          <div className="image-overlay">
            <div className="image-actions">
              <button
                className="image-action-btn view"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImagePreview(image, index);
                }}
                title="View Full Size"
              >
                <FiEye />
              </button>
              <button
                className="image-action-btn download"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadImage(image);
                }}
                title="Download"
              >
                <FiDownload />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedClaim(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedClaim(null);
                  handleUpdateStatus(selectedClaim.id);
                }}
              >
                Update Status
              </button>
              <button
                className="btn btn-success"
                onClick={() => handlePrintClaim(selectedClaim.id)}
              >
                <FiPrinter /> Print Claim
              </button>
            </div>
          </div>
        </div>
      )}
      {previewImage && selectedClaim && (
  <div className="modal-overlay image-preview-modal">
    <div className="modal">
      <button 
        className="preview-close-btn"
        onClick={() => setPreviewImage(null)}
      >
        <FiX />
      </button>
      <div className="image-preview-content">
        <div className="preview-image-container">
          <img 
            src={API_BASE_IMG_URL + previewImage.image.imageUrl} 
            alt={`Fault image ${previewImage.index + 1}`}
          />
        </div>
        <div className="preview-navigation">
          <button className="nav-btn" onClick={handlePrevImage}>
            <FiChevronLeft />
          </button>
          <button className="nav-btn" onClick={handleNextImage}>
            <FiChevronRight />
          </button>
        </div>
        <div className="preview-info">
          <div className="preview-info-content">
            <div className="preview-file-info">
              <span>Image {previewImage.index + 1} of {selectedClaim.faultImages.length}</span>
              <span>{(previewImage.image.fileSize / 1024).toFixed(1)} KB</span>
              <span>{previewImage.image.fileName}</span>
            </div>
            <button 
              className="preview-download-btn"
              onClick={() => handleDownloadImage(previewImage.image)}
            >
              <FiDownload /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
{showEditModal && selectedClaim && (
  <div className="modal-overlay">
    <div className="modal modal-lg">
      <div className="modal-header">
        <h3>Edit Claim: {selectedClaim.claimNumber}</h3>
        <button 
          className="modal-close" 
          onClick={() => setShowEditModal(false)}
        >
          <FiX />
        </button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Customer Name *</label>
          <input
            type="text"
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
            placeholder="Full name"
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
            placeholder="Email address"
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            value={editFormData.phoneNumber}
            onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
            placeholder="Phone number"
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <textarea
            value={editFormData.address}
            onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
            placeholder="Full address"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Claim Type *</label>
          <select
            value={editFormData.claimType}
            onChange={(e) => setEditFormData({...editFormData, claimType: e.target.value})}
          >
            <option value="">Select claim type</option>
            <option value="warranty-inspection">Warranty Inspection</option>
            <option value="service-repair">Service Repair</option>
            <option value="firstup-failure">Firstup Failure</option>
          </select>
        </div>

        <div className="form-group">
          <label>Common Fault Description</label>
          <textarea
            value={editFormData.commonFaultDescription}
            onChange={(e) => setEditFormData({...editFormData, commonFaultDescription: e.target.value})}
            placeholder="Describe the common fault for all products..."
            rows={3}
          />
        </div>

        {/* Show single product section ONLY if there are NO products in the array */}
        {editFormData.products.length === 0 ? (
          <div className="single-product-section">
            <h4>Product Information</h4>
            <div className="single-product-fields">
              <div className="form-group">
                <label>Model Number *</label>
                <input
                  type="text"
                  value={editFormData.model}
                  onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                  placeholder="Model number"
                />
              </div>

              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  value={editFormData.serial}
                  onChange={(e) => setEditFormData({...editFormData, serial: e.target.value})}
                  placeholder="Serial number"
                />
              </div>

              <div className="form-group">
                <label>Fault Description</label>
                <textarea
                  value={editFormData.FaultDesc}
                  onChange={(e) => setEditFormData({...editFormData, FaultDesc: e.target.value})}
                  placeholder="Describe the fault..."
                  rows={3}
                />
              </div>
            </div>
            
            {/* Conversion option - only for single product claims */}
            {(editFormData.model || editFormData.FaultDesc) && (
              <div className="conversion-section">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    // Convert from single product to multi-product
                    setEditFormData(prev => ({
                      ...prev,
                      products: [{
                        modelNumber: prev.model || '',
                        serialNumber: prev.serial || '',
                        faultDescription: prev.FaultDesc || ''
                      }],
                      model: '',
                      serial: '',
                      FaultDesc: ''
                    }));
                  }}
                >
                  <FiPackage /> Convert to Multi-Product Format
                </button>
              </div>
            )}
          </div>
        ) : (
          // Show multi-product section if there ARE products in the array
          <div className="products-edit-section">
            <div className="section-header">
              <h4>Products ({editFormData.products.length})</h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddProduct}
              >
                <FiPackage /> Add Product
              </button>
            </div>

            {editFormData.products.map((product, index) => (
              <div key={index} className="product-edit-card">
                <div className="product-header">
                  <h5>Product #{index + 1}</h5>
                  {editFormData.products.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon btn-delete btn-sm"
                      onClick={() => handleRemoveProduct(index)}
                      title="Remove Product"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <div className="product-fields">
                  <div className="form-group">
                    <label>Model Number *</label>
                    <input
                      type="text"
                      value={product.modelNumber}
                      onChange={(e) => handleProductChange(index, 'modelNumber', e.target.value)}
                      placeholder="Model number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Serial Number</label>
                    <input
                      type="text"
                      value={product.serialNumber}
                      onChange={(e) => handleProductChange(index, 'serialNumber', e.target.value)}
                      placeholder="Serial number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Specific Fault Description</label>
                    <textarea
                      value={product.faultDescription}
                      onChange={(e) => handleProductChange(index, 'faultDescription', e.target.value)}
                      placeholder="Describe fault for this specific product..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Conversion option - only for multi-product claims */}
            {/* <div className="conversion-section">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (window.confirm('This will convert to single product format. Only the first product will be kept. Continue?')) {
                    // Convert from multi-product to single product
                    const firstProduct = editFormData.products[0];
                    setEditFormData(prev => ({
                      ...prev,
                      products: [],
                      model: firstProduct?.modelNumber || '',
                      serial: firstProduct?.serialNumber || '',
                      FaultDesc: firstProduct?.faultDescription || ''
                    }));
                  }
                }}
              >
                <FiPackage /> Convert to Single Product Format
              </button>
            </div> */}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={() => setShowEditModal(false)}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleEditSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Claim'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
  
};

export default WarrantyClaimManagement;


