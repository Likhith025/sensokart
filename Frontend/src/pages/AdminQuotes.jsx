import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase();
  const [cartItems, setCartItems] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (userRole !== 'admin') {
      window.location.href = '/';
      return;
    }
  }, [userRole]);

  useEffect(() => {
    const savedCart = Cookies.get('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const url = `${API_BASE_URL}/enquiry${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      setQuotes(data.enquiries || data);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to load quote requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchQuotes();
    }
  }, [userRole, token, statusFilter]);

  const updateQuoteStatus = async (quoteId, status) => {
    try {
      setResponseLoading(true);

      const response = await fetch(`${API_BASE_URL}/enquiry/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update quote status');
      }

      await fetchQuotes();
      setShowModal(false);
      setSelectedQuote(null);
    } catch (err) {
      console.error('Error updating quote:', err);
      setError('Failed to update quote status');
    } finally {
      setResponseLoading(false);
    }
  };

  const deleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/enquiry/${quoteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      await fetchQuotes();
    } catch (err) {
      console.error('Error deleting quote:', err);
      setError('Failed to delete quote request');
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateQuoteTotal = (products) => {
    if (!products || !Array.isArray(products)) return 0;
    
    return products.reduce((total, item) => {
      const productData = item.productData || item.product;
      const price = productData?.salePrice || productData?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'responded':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openQuoteDetails = (quote) => {
    setSelectedQuote(quote);
    setShowModal(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuotes();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    // Fetch will be triggered by useEffect when statusFilter changes
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Topbar cartItems={cartItems} />
        <div className="pt-24 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar cartItems={cartItems} />
      
      <div className="pt-24">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quote Requests</h1>
              <p className="text-gray-600 mt-2">Manage customer quote requests</p>
            </div>
            <button
              onClick={fetchQuotes}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="responded">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, enquiry number..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quotes.filter(q => q.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quotes.filter(q => q.status === 'responded').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quotes.filter(q => q.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              <p className="ml-4 text-lg text-gray-600">Loading quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quote requests found</h3>
              <p className="text-gray-500">No quote requests match your current filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enquiry Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotes.map((quote) => (
                      <tr key={quote._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-bold text-blue-600">
                            {quote.enquiryNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {quote.name}
                            </div>
                            <div className="text-sm text-gray-500">{quote.email}</div>
                            <div className="text-sm text-gray-500">{quote.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {quote.products?.length || 0} product(s)
                          </div>
                          <div className="text-sm text-gray-500">
                            {quote.products?.[0]?.productData?.name || quote.products?.[0]?.product?.name || 'N/A'}
                            {quote.products?.length > 1 && ` +${quote.products.length - 1} more`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(calculateQuoteTotal(quote.products || []))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                            {getStatusText(quote.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(quote.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openQuoteDetails(quote)}
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200 cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteQuote(quote._id)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Details Modal */}
      {showModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quote Request Details</h2>
                <p className="text-lg font-mono text-blue-600 mt-1">
                  {selectedQuote.enquiryNumber || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-2">
                  <p><strong>Enquiry Number:</strong> 
                    <span className="ml-2 font-mono text-blue-600 font-bold">
                      {selectedQuote.enquiryNumber || 'N/A'}
                    </span>
                  </p>
                  <p><strong>Name:</strong> {selectedQuote.name}</p>
                  <p><strong>Email:</strong> {selectedQuote.email}</p>
                  <p><strong>Phone:</strong> {selectedQuote.phone}</p>
                  <p><strong>Country:</strong> {selectedQuote.country}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedQuote.status)}`}>
                      {getStatusText(selectedQuote.status)}
                    </span>
                  </p>
                  <p><strong>Submitted:</strong> {formatDateTime(selectedQuote.createdAt)}</p>
                  {selectedQuote.respondedAt && (
                    <p><strong>Last Response:</strong> {formatDateTime(selectedQuote.respondedAt)}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Message</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedQuote.message || 'No message provided.'}</p>
                </div>
                
                {/* Admin Notes */}
                {selectedQuote.adminNotes && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Admin Notes</h4>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedQuote.adminNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requested Products</h3>
              <div className="space-y-4">
                {selectedQuote.products?.map((item, index) => {
                  const productData = item.productData || item.product;
                  const productName = productData?.name || 'Unknown Product';
                  const productSku = productData?.sku || 'N/A';
                  const productImage = productData?.coverPhoto || productData?.images?.[0] || '/placeholder-image.jpg';
                  const productPrice = productData?.salePrice || productData?.price || 0;
                  const quantity = item.quantity || 1;
                  
                  return (
                    <div key={index} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{productName}</h4>
                        <p className="text-sm text-gray-600">SKU: {productSku}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(productPrice)}
                          </span>
                          <span className="text-gray-600">Quantity: {quantity}</span>
                          <span className="text-lg font-bold text-blue-600">
                            Total: {formatPrice(productPrice * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                <span className="text-xl font-bold">Grand Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(calculateQuoteTotal(selectedQuote.products || []))}
                </span>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
              
              <div className="flex flex-wrap gap-3">
                {selectedQuote.status !== 'responded' && (
                  <button
                    onClick={() => updateQuoteStatus(selectedQuote._id, 'responded')}
                    disabled={responseLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                  >
                    {responseLoading ? 'Updating...' : 'Mark as In Progress'}
                  </button>
                )}
                
                <button
                  onClick={() => updateQuoteStatus(selectedQuote._id, 'completed')}
                  disabled={responseLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {responseLoading ? 'Updating...' : 'Mark as Completed'}
                </button>

                <button
                  onClick={() => updateQuoteStatus(selectedQuote._id, 'cancelled')}
                  disabled={responseLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {responseLoading ? 'Updating...' : 'Mark as Cancelled'}
                </button>

                <button
                  onClick={() => updateQuoteStatus(selectedQuote._id, 'pending')}
                  disabled={responseLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                >
                  {responseLoading ? 'Updating...' : 'Mark as Pending'}
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                <strong>Note:</strong> All responses will be handled manually via email/phone. 
                Use "In Progress" when you start working on the quote, and "Completed" when the quote is finalized.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuotes;