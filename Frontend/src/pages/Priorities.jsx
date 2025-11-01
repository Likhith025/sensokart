import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const Priorities = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newPriority, setNewPriority] = useState({ 
    name: '', 
    type: 'Category', 
    objectId: '', 
    priority: 0 
  });
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' or 'edit'
  const [modalItem, setModalItem] = useState(null);
  const [modalData, setModalData] = useState({});
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase();

  // Fetch all data
  const fetchPriorities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/p`);
      if (!response.ok) throw new Error('Failed to fetch priorities');
      const data = await response.json();
      setPriorities(data.data || []);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      if (!response.ok) throw new Error('Failed to fetch brands');
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubCategories(data);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  useEffect(() => {
    fetchPriorities();
    fetchCategories();
    fetchBrands();
    fetchSubCategories();
  }, []);

  // Modal functions
  const openModal = (type, item = null, data = {}) => {
    setModalType(type);
    setModalItem(item);
    setModalData(data);
    setModalOpen(true);
    setModalError('');
    setModalSuccess('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setModalItem(null);
    setModalData({});
    setModalError('');
    setModalSuccess('');
    setNewPriority({ name: '', type: 'Category', objectId: '', priority: 0 });
  };

  const showModalMessage = (type, message) => {
    if (type === 'error') {
      setModalError(message);
      setModalSuccess('');
    } else {
      setModalSuccess(message);
      setModalError('');
    }
    setTimeout(() => {
      setModalError('');
      setModalSuccess('');
    }, 3000);
  };

  // Get objects by type for dropdown
  const getObjectsByType = (type) => {
    switch (type) {
      case 'Category':
        return categories;
      case 'Brand':
        return brands;
      case 'Subcategory':
        return subCategories;
      default:
        return [];
    }
  };

  // Get object name by ID and type
  const getObjectName = (type, objectId) => {
    const objects = getObjectsByType(type);
    const object = objects.find(obj => obj._id === objectId);
    return object ? object.name : 'Unknown';
  };

  // Priority handlers
  const handleAddPriority = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim() || !modalData.objectId || modalData.priority === '') {
      showModalMessage('error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/p`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(modalData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add priority');
      }

      setPriorities([...priorities, data.data]);
      showModalMessage('success', 'Priority added successfully!');
      setTimeout(() => {
        closeModal();
        fetchPriorities();
      }, 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPriority = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim() || !modalData.objectId || modalData.priority === '') {
      showModalMessage('error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/p/${modalItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(modalData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update priority');
      }

      setPriorities(priorities.map(pri => 
        pri._id === modalItem._id ? data.data : pri
      ));
      showModalMessage('success', 'Priority updated successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePriority = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/p/${modalItem._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete priority');
      }

      setPriorities(priorities.filter(pri => pri._id !== modalItem._id));
      showModalMessage('success', 'Priority deleted successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter priorities by type
  const filteredPriorities = activeTab === 'all' 
    ? priorities 
    : priorities.filter(pri => pri.type === activeTab);

  // Get priority color based on level
  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Get modal title
  const getModalTitle = () => {
    if (modalType === 'add') return 'Add New Priority';
    if (modalType === 'edit') return 'Edit Priority';
    if (modalType === 'delete') return 'Delete Priority';
    return 'Modal';
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Topbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You need admin privileges to access this page.</p>
          <Link 
            to="/" 
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 ${modalOpen ? 'cursor-pointer' : ''}`}>
      <Topbar />
      
      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 cursor-pointer">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getModalTitle()}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Messages */}
              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-xs mt-1">{modalError}</p>
                    </div>
                  </div>
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {modalSuccess}
                  </div>
                </div>
              )}

              {/* Add/Edit Form */}
              {(modalType === 'add' || modalType === 'edit') && (
                <form onSubmit={modalType === 'add' ? handleAddPriority : handleEditPriority} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority Name *
                    </label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter priority name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={modalData.type || 'Category'}
                      onChange={(e) => setModalData({ ...modalData, type: e.target.value, objectId: '' })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    >
                      <option value="Category">Category</option>
                      <option value="Brand">Brand</option>
                      <option value="Subcategory">Subcategory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {modalData.type || 'Category'} *
                    </label>
                    <select
                      value={modalData.objectId || ''}
                      onChange={(e) => setModalData({ ...modalData, objectId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    >
                      <option value="">Select {modalData.type || 'Category'}</option>
                      {getObjectsByType(modalData.type || 'Category').map((obj) => (
                        <option key={obj._id} value={obj._id}>
                          {obj.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority Level (0-10) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={modalData.priority || 0}
                      onChange={(e) => setModalData({ ...modalData, priority: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? 'Saving...' : (modalType === 'add' ? 'Add Priority' : 'Save Changes')}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200 cursor-pointer text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Confirmation */}
              {modalType === 'delete' && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Are you sure you want to delete the priority <strong>"{modalItem.name}"</strong>?
                  </p>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleDeletePriority}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200 cursor-pointer text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-28 sm:pt-32 pb-8 sm:pb-16">
        <div className="mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Priorities</h1>
          <p className="text-sm sm:text-base text-gray-600">Set and manage priorities for categories, brands, and subcategories</p>
        </div>

        {/* Tabs - Mobile Scrollable */}
        <div className="mb-6 sm:mb-8 mx-2">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 min-w-max">
              {['all', 'Category', 'Brand', 'Subcategory'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'all' ? 'All Priorities' : tab + 's'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 mx-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
              {activeTab === 'all' ? 'All Priorities' : activeTab + ' Priorities'} 
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredPriorities.length})
              </span>
            </h2>
            <button
              onClick={() => openModal('add', null, { name: '', type: 'Category', objectId: '', priority: 0 })}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm sm:text-base"
            >
              + Add Priority
            </button>
          </div>

          {/* Priorities List */}
          <div>
            {filteredPriorities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 italic text-sm sm:text-base">
                  {activeTab === 'all' 
                    ? 'No priorities found. Add your first priority above.' 
                    : `No ${activeTab.toLowerCase()} priorities found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredPriorities
                  .sort((a, b) => b.priority - a.priority)
                  .map((priority) => (
                  <div
                    key={priority._id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-base sm:text-lg font-medium text-gray-800 break-words">
                          {priority.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(priority.priority)}`}>
                          Level: {priority.priority}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                          {priority.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Object:</strong> {getObjectName(priority.type, priority.objectId)}
                      </p>
                    </div>
                    <div className="flex space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => openModal('edit', priority, { 
                          name: priority.name, 
                          type: priority.type,
                          objectId: priority.objectId,
                          priority: priority.priority
                        })}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openModal('delete', priority)}
                        className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                      >
                        Delete
                      </button>
                    </div>
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

export default Priorities;