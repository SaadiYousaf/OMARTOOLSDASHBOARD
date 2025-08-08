import React, { useState, useEffect } from 'react';
import { BrandDto } from '../../types/product';
import './BrandManagement.css'
const BrandManagement = ({ onBrandCreated }: { onBrandCreated: () => void }) => {
    const [brands, setBrands] = useState<BrandDto[]>([]);
    const [newBrand, setNewBrand] = useState<Omit<BrandDto, 'id'>>({
        name: '',
        description: '',
        logoUrl: '',
        websiteUrl: '',
        isActive: true,
        createdAt: new Date().toISOString()
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof BrandDto; direction: 'asc' | 'desc' } | null>(null);

    const itemsPerPage = 5;

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setIsFetching(true);
        try {
            const res = await fetch('http://localhost:5117/api/brands');
            const data = await res.json();
            setBrands(data);
        } catch (err) {
            setError('Failed to load brands');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        // Simple validation
        if (!newBrand.name.trim()) {
            setError('Brand name is required');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5117/api/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBrand),
            });

            if (!res.ok) throw new Error('Failed to create brand');

            setNewBrand({
                name: '',
                description: '',
                logoUrl: '',
                websiteUrl: '',
                isActive: true,
                createdAt: new Date().toISOString()
            });

            fetchBrands();
            onBrandCreated();
            setSuccess('Brand created successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create brand');
        } finally {
            setIsLoading(false);
        }
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

            // Handle undefined values
            if (valA == null) return sortConfig.direction === 'asc' ? 1 : -1;
            if (valB == null) return sortConfig.direction === 'asc' ? -1 : 1;

            // Compare values
            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [brands, sortConfig]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBrands = sortedBrands.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Brand Management</h1>
                <div className="header-actions">
                    <button
                        className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Brand
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
                                <h2>Create New Brand</h2>
                                <p>Fill in the details to create a new brand</p>
                            </div>

                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Brand Name*</label>
                                            <input
                                                type="text"
                                                value={newBrand.name}
                                                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                                placeholder="Enter brand name"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Logo URL</label>
                                            <input
                                                type="text"
                                                value={newBrand.logoUrl}
                                                onChange={(e) => setNewBrand({ ...newBrand, logoUrl: e.target.value })}
                                                placeholder="https://example.com/logo.png"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label>Description</label>
                                            <textarea
                                                value={newBrand.description}
                                                onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                                                placeholder="Enter brand description"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Website URL</label>
                                            <input
                                                type="text"
                                                value={newBrand.websiteUrl}
                                                onChange={(e) => setNewBrand({ ...newBrand, websiteUrl: e.target.value })}
                                                placeholder="https://example.com"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Status</label>
                                            <div className="status-toggle">
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={newBrand.isActive}
                                                        onChange={(e) => setNewBrand({ ...newBrand, isActive: e.target.checked })}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                                <span className="status-label">
                                                    {newBrand.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="primary-btn"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner"></span> Creating...
                                                </>
                                            ) : 'Create Brand'}
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
                                                        <th>Description</th>
                                                        <th>Website</th>
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
                                                            <tr key={brand.id}>
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
                                                                    <div className="truncate-text">
                                                                        {brand.description || '-'}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {brand.websiteUrl ? (
                                                                        <a
                                                                            href={brand.websiteUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="website-link"
                                                                        >
                                                                            Visit
                                                                        </a>
                                                                    ) : '-'}
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
                                                                        <button className="icon-btn edit-btn">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                            </svg>
                                                                        </button>
                                                                        <button className="icon-btn delete-btn">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
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

