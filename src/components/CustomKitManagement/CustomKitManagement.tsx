import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SortableHeader from '../shared/SortableHeader';
import {
  FiSearch, FiRefreshCw, FiX,
  FiPackage, FiShoppingBag, FiClock, FiCheckCircle, FiDollarSign,
  FiUser, FiMail, FiPhone, FiMapPin, FiFileText, FiEdit,
  FiChevronRight,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../../services/tokenStore';
import {
  CustomKitDto,
  CustomKitStatus,
  CUSTOM_KIT_STATUS_LABELS,
  CUSTOM_KIT_STATUS_COLORS,
} from '../../types/customKit';
import './CustomKitManagement.css';

const ALL_STATUSES: CustomKitStatus[] = ['submitted', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

const CustomKitManagement: React.FC = () => {
  const [kits, setKits] = useState<CustomKitDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedKit, setSelectedKit] = useState<CustomKitDto | null>(null);
  const [statusUpdateKit, setStatusUpdateKit] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');

  // Sort state
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
  const sort = useMemo(() => ({
    column: sortCol, direction: sortDir,
    toggle: (col: string) => {
      if (sortCol === col) {
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') { setSortCol(null); setSortDir(null); }
        else setSortDir('asc');
      } else { setSortCol(col); setSortDir('asc'); }
    },
  }), [sortCol, sortDir]);

  const sortItems = <T extends Record<string, any>>(items: T[]): T[] => {
    if (!sortCol || !sortDir) return items;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a: any, b: any) => {
      const aVal = a[sortCol]; const bVal = b[sortCol];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1; if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      if (typeof aVal === 'boolean') return (aVal === bVal ? 0 : aVal ? -1 : 1) * dir;
      return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  };

  const fetchKits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_BASE_URL}/customkits?${params}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      if (!response.ok) throw new Error('Failed to fetch custom kits');
      const data = await response.json();
      setKits(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => { fetchKits(); }, [fetchKits]);

  const handleStatusUpdate = async (kitId: string) => {
    if (!newStatus) return;
    try {
      const response = await fetch(`${API_BASE_URL}/customkits/${kitId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ status: newStatus, statusNotes }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setStatusUpdateKit(null);
      setNewStatus('');
      setStatusNotes('');
      fetchKits();
      if (selectedKit?.id === kitId) {
        setSelectedKit(prev => prev ? { ...prev, status: newStatus as CustomKitStatus, statusNotes } : null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const stats = useMemo(() => {
    const submitted = kits.filter((k) => k.status === 'submitted').length;
    const processing = kits.filter((k) => k.status === 'processing').length;
    const completed = kits.filter((k) => k.status === 'completed').length;
    const totalRevenue = kits.filter((k) => k.status !== 'cancelled').reduce((s, k) => s + k.total, 0);
    return { submitted, processing, completed, total: kits.length, totalRevenue };
  }, [kits]);

  const getStatusIcon = (status: CustomKitStatus) => {
    switch (status) {
      case 'submitted': return <FiShoppingBag />;
      case 'confirmed': return <FiCheckCircle />;
      case 'processing': return <FiClock />;
      case 'shipped': return <FiPackage />;
      case 'completed': return <FiCheckCircle />;
      case 'cancelled': return <FiX />;
    }
  };

  // Detail view
  if (selectedKit) {
    const kit = selectedKit;
    return (
      <div className="ck-page">
        <div className="om-page-header">
          <div className="om-page-title">
            <h1>Custom Kits</h1>
            <p>Manage custom kit orders and fulfillment</p>
          </div>
        </div>

        <div className="ck-detail-top">
          <button className="ck-back-btn" onClick={() => setSelectedKit(null)}>
            <FiChevronRight className="ck-back-icon" /> Back to list
          </button>
        </div>

        <div className="ck-detail-header">
          <div className="ck-detail-title">
            <h2>{kit.kitNumber}</h2>
            <span
              className="ck-status-pill"
              style={{ backgroundColor: CUSTOM_KIT_STATUS_COLORS[kit.status] + '18', color: CUSTOM_KIT_STATUS_COLORS[kit.status] }}
            >
              {getStatusIcon(kit.status)} {CUSTOM_KIT_STATUS_LABELS[kit.status]}
            </span>
          </div>
          <div className="ck-detail-meta-row">
            <span><FiPackage /> {kit.brandName}</span>
            <span><FiUser /> {kit.customerName}</span>
            <span className="ck-detail-date">{new Date(kit.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="ck-detail-grid">
          {/* Customer Card */}
          <div className="ck-info-card">
            <div className="ck-info-card-header"><FiUser /> Customer Information</div>
            <div className="ck-info-card-body">
              <div className="ck-info-row">
                <span className="ck-info-label"><FiUser /> Name</span>
                <span className="ck-info-value ck-info-bold">{kit.customerName}</span>
              </div>
              <div className="ck-info-row">
                <span className="ck-info-label"><FiMail /> Email</span>
                <span className="ck-info-value">{kit.customerEmail}</span>
              </div>
              <div className="ck-info-row">
                <span className="ck-info-label"><FiPhone /> Phone</span>
                <span className="ck-info-value">{kit.customerPhone}</span>
              </div>
              <div className="ck-info-row">
                <span className="ck-info-label"><FiMapPin /> Address</span>
                <span className="ck-info-value">{kit.deliveryAddress}</span>
              </div>
              {kit.orderNotes && (
                <div className="ck-info-row">
                  <span className="ck-info-label"><FiFileText /> Notes</span>
                  <span className="ck-info-value">{kit.orderNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Card */}
          <div className="ck-info-card">
            <div className="ck-info-card-header"><FiDollarSign /> Pricing Breakdown</div>
            <div className="ck-info-card-body">
              <div className="ck-info-row">
                <span className="ck-info-label">Subtotal</span>
                <span className="ck-info-value">${kit.subtotal.toFixed(2)}</span>
              </div>
              {kit.discountPercent > 0 && (
                <>
                  <div className="ck-info-row">
                    <span className="ck-info-label">Discount ({kit.tierLabel})</span>
                    <span className="ck-info-value ck-text-success">-${kit.discountAmount.toFixed(2)}</span>
                  </div>
                  {kit.freeItems && (
                    <div className="ck-info-row">
                      <span className="ck-info-label">Free Items</span>
                      <span className="ck-info-value">{kit.freeItems}</span>
                    </div>
                  )}
                </>
              )}
              <div className="ck-info-row ck-info-row--total">
                <span className="ck-info-label">Total</span>
                <span className="ck-info-value ck-total-amount">${kit.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="ck-items-card">
          <div className="ck-info-card-header"><FiPackage /> Kit Items ({kit.items.length})</div>
          <div className="ck-items-table-wrap">
            <table className="ck-items-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {kit.items.map((item) => (
                  <tr key={item.id}>
                    <td><span className={`ck-type-badge ck-type-badge--${item.itemType}`}>{item.itemType}</span></td>
                    <td className="ck-item-name">{item.itemName}</td>
                    <td>{item.itemCategory || '—'}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td className="ck-item-total">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Update */}
        <div className="ck-status-card">
          <div className="ck-info-card-header"><FiEdit /> Update Status</div>
          <div className="ck-status-form">
            <div className="ck-status-form-row">
              <select
                value={statusUpdateKit === kit.id ? newStatus : kit.status}
                onChange={(e) => { setStatusUpdateKit(kit.id); setNewStatus(e.target.value); }}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{CUSTOM_KIT_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Add notes (optional)..."
                value={statusUpdateKit === kit.id ? statusNotes : ''}
                onChange={(e) => { setStatusUpdateKit(kit.id); setStatusNotes(e.target.value); }}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleStatusUpdate(kit.id)}
                disabled={!statusUpdateKit || newStatus === kit.status}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="ck-page">
      <div className="om-page-header">
        <div className="om-page-title">
          <h1>Custom Kits</h1>
          <p>Manage custom kit orders and fulfillment</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchKits} disabled={isLoading}>
          <FiRefreshCw className={isLoading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="ck-alert">
          <FiX className="ck-alert-close-icon" onClick={() => setError(null)} />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="ck-stats">
        <div className="om-stat-card">
          <div className="om-stat-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><FiPackage /></div>
          <div className="om-stat-content">
            <span className="om-stat-label">Total Kits</span>
            <span className="om-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}><FiShoppingBag /></div>
          <div className="om-stat-content">
            <span className="om-stat-label">New Orders</span>
            <span className="om-stat-value">{stats.submitted}</span>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}><FiClock /></div>
          <div className="om-stat-content">
            <span className="om-stat-label">Processing</span>
            <span className="om-stat-value">{stats.processing}</span>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}><FiCheckCircle /></div>
          <div className="om-stat-content">
            <span className="om-stat-label">Completed</span>
            <span className="om-stat-value">{stats.completed}</span>
          </div>
        </div>
        <div className="om-stat-card">
          <div className="om-stat-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}><FiDollarSign /></div>
          <div className="om-stat-content">
            <span className="om-stat-label">Revenue</span>
            <span className="om-stat-value">${stats.totalRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ck-toolbar">
        <div className="ck-search">
          <FiSearch className="ck-search-icon" />
          <input
            type="text"
            className="ck-search-input"
            placeholder="Search by kit number, name, email, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="ck-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{CUSTOM_KIT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="ck-loading">
          <div className="ck-loading-spinner" />
          <p>Loading custom kits...</p>
        </div>
      ) : kits.length === 0 ? (
        <div className="ck-empty">
          <FiPackage className="ck-empty-icon" />
          <h3>No custom kit orders found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="ck-table-card">
          <div className="ck-table-wrap">
            <table className="ck-table">
              <thead>
                <tr>
                  <SortableHeader label="Kit Number" column="kitNumber" sort={sort} />
                  <SortableHeader label="Customer" column="customerName" sort={sort} />
                  <SortableHeader label="Brand" column="brandName" sort={sort} />
                  <SortableHeader label="Items" column="itemCount" sort={sort} />
                  <SortableHeader label="Total" column="total" sort={sort} />
                  <SortableHeader label="Status" column="status" sort={sort} />
                  <SortableHeader label="Date" column="submittedAt" sort={sort} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortItems(kits.map(k => ({ ...k, itemCount: k.items.length }))).map((kit) => (
                  <tr key={kit.id}>
                    <td><span className="ck-kit-number">{kit.kitNumber}</span></td>
                    <td>
                      <div className="ck-customer-cell">
                        <span className="ck-customer-name">{kit.customerName}</span>
                        <span className="ck-customer-email">{kit.customerEmail}</span>
                      </div>
                    </td>
                    <td><span className="ck-brand-tag">{kit.brandName}</span></td>
                    <td>{kit.items.length}</td>
                    <td><span className="ck-amount">${kit.total.toFixed(2)}</span></td>
                    <td>
                      <span
                        className="ck-status-pill"
                        style={{ backgroundColor: CUSTOM_KIT_STATUS_COLORS[kit.status] + '18', color: CUSTOM_KIT_STATUS_COLORS[kit.status] }}
                      >
                        {CUSTOM_KIT_STATUS_LABELS[kit.status]}
                      </span>
                    </td>
                    <td><span className="ck-date">{new Date(kit.submittedAt).toLocaleDateString()}</span></td>
                    <td>
                      <button className="ck-view-btn" onClick={() => setSelectedKit(kit)}>
                        View <FiChevronRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomKitManagement;
