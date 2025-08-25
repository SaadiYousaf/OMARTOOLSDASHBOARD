// OrderManagement.jsx
import React, { useEffect, useState } from 'react';
import { 
  FiBox, FiTruck, FiCheckCircle, FiXCircle, 
  FiSearch, FiFilter, FiRefreshCw, FiEye,
  FiEdit, FiArrowLeft, FiArrowRight
} from 'react-icons/fi';
import './OrderManagement.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, we would call an admin endpoint to get all orders
      // Since we don't have one, we'll simulate with the user endpoint for demo
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5117/api/orders/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = orders;
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(term) || 
        order.userId.toLowerCase().includes(term) ||
        (order.transactionId && order.transactionId.toLowerCase().includes(term))
      );
    }
    
    setFilteredOrders(result);
    setCurrentPage(1);
  }, [statusFilter, searchTerm, orders]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('adminToken');
      
      // We'll use the existing refund endpoint pattern to update status
      const response = await fetch(`http://localhost:5117/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="order-management">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-management">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchOrders}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="order-header">
        <h1><FiBox /> Order Management</h1>
        <div className="header-actions">
          <button onClick={fetchOrders} disabled={isLoading}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by order number, user ID, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <FiFilter />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Succeeded">Succeeded</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{orders.length}</p>
        </div>
        <div className="stat-card">
          <h3>Succeeded</h3>
          <p>{orders.filter(o => o.status === 'Succeeded').length}</p>
        </div>
        <div className="stat-card">
          <h3>Shipped</h3>
          <p>{orders.filter(o => o.status === 'Shipped').length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{orders.filter(o => o.status === 'Pending').length}</p>
        </div>
      </div>

      {selectedOrder ? (
        <OrderDetail 
          order={selectedOrder} 
          onBack={() => setSelectedOrder(null)}
          onStatusUpdate={updateOrderStatus}
          isUpdating={isUpdating}
        />
      ) : (
        <>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length > 0 ? (
                  currentOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.userId}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>${order.totalAmount?.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-status ${order.paymentStatus?.toLowerCase() || 'unknown'}`}>
                          {order.paymentStatus || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-view"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <FiEye /> Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-orders">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                <FiArrowLeft /> Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={currentPage === page ? 'active' : ''}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next <FiArrowRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Order Detail Component
const OrderDetail = ({ order, onBack, onStatusUpdate, isUpdating }) => {
  const [newStatus, setNewStatus] = useState(order.status);

  const handleStatusUpdate = () => {
    if (newStatus !== order.status) {
      onStatusUpdate(order.id, newStatus);
    }
  };

  return (
    <div className="order-detail">
      <button className="back-button" onClick={onBack}>
        <FiArrowLeft /> Back to Orders
      </button>

      <div className="order-detail-header">
        <h2>Order #{order.orderNumber}</h2>
        <div className="order-status-control">
          <select 
            value={newStatus} 
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={isUpdating}
          >
            <option value="Pending">Pending</option>
            <option value="Succeeded">Succeeded</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button 
            onClick={handleStatusUpdate}
            disabled={newStatus === order.status || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      <div className="order-detail-grid">
        <div className="order-info">
          <h3>Order Information</h3>
          <div className="info-group">
            <label>Order Date:</label>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="info-group">
            <label>Status:</label>
            <span className={`status-badge ${order.status.toLowerCase()}`}>
              {order.status}
            </span>
          </div>
          <div className="info-group">
            <label>Payment Status:</label>
            <span className={`payment-status ${order.paymentStatus?.toLowerCase() || 'unknown'}`}>
              {order.paymentStatus || 'N/A'}
            </span>
          </div>
          <div className="info-group">
            <label>Transaction ID:</label>
            <span>{order.transactionId || 'N/A'}</span>
          </div>
          <div className="info-group">
            <label>Total Amount:</label>
            <span>${order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        <div className="shipping-info">
          <h3>Shipping Information</h3>
          {order.shippingAddress ? (
            <>
              <div className="info-group">
                <label>Name:</label>
                <span>{order.shippingAddress.fullName}</span>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <span>
                  {order.shippingAddress.addressLine1}<br />
                  {order.shippingAddress.addressLine2 && (
                    <>{order.shippingAddress.addressLine2}<br /></>
                  )}
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </span>
              </div>
            </>
          ) : (
            <p>No shipping information available</p>
          )}
        </div>

        <div className="order-items">
          <h3>Order Items</h3>
          {order.items && order.items.length > 0 ? (
            <div className="items-list">
              {order.items.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} />
                    ) : (
                      <div className="image-placeholder">
                        <FiBox />
                      </div>
                    )}
                  </div>
                  <div className="item-details">
                    <h4>{item.productName}</h4>
                    <p>Product ID: {item.productId}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: ${item.unitPrice?.toFixed(2)} each</p>
                  </div>
                  <div className="item-total">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No items found for this order</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;