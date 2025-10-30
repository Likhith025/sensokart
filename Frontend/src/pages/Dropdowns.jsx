import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const Dropdowns = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', descriptionTitle: '', description: '' });
  const [newBrand, setNewBrand] = useState({ name: '', descriptionTitle: '', description: '' });
  const [newSubCategory, setNewSubCategory] = useState({ name: '', category: '', descriptionTitle: '', description: '' });
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', or 'delete'
  const [modalItem, setModalItem] = useState(null);
  const [modalData, setModalData] = useState({});
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase();

  // Fetch all data
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/category`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand`);
      if (!response.ok) throw new Error('Failed to fetch brands');
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subcategory`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubCategories(data);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    // Reset form data
    setNewCategory({ name: '', descriptionTitle: '', description: '' });
    setNewBrand({ name: '', descriptionTitle: '', description: '' });
    setNewSubCategory({ name: '', category: '', descriptionTitle: '', description: '' });
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

  // Helper function to render formatted description
  const renderFormattedDescription = (description) => {
    if (!description) return null;
    
    const lines = description.split('\n');
    const elements = [];
    let currentList = [];
    let inList = false;
    let listType = null; // 'numbered' or 'bulleted'

    const processCurrentList = () => {
      if (currentList.length > 0) {
        if (listType === 'numbered') {
          elements.push(
            <ol key={elements.length} className="list-decimal pl-6 space-y-1">
              {currentList}
            </ol>
          );
        } else {
          elements.push(
            <ul key={elements.length} className="list-disc pl-6 space-y-1">
              {currentList}
            </ul>
          );
        }
        currentList = [];
      }
    };

    const renderFormattedLine = (line, index) => {
      // Handle bold text with **text**
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <span key={index}>
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </span>
        );
      }
      return line;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle numbered lists (1., 2., etc.)
      if (trimmedLine.match(/^\d+\.\s/)) {
        if (!inList || listType !== 'numbered') {
          processCurrentList();
          inList = true;
          listType = 'numbered';
        }
        const content = trimmedLine.replace(/^\d+\.\s/, '');
        currentList.push(
          <li key={currentList.length} className="text-sm">
            {renderFormattedLine(content, index)}
          </li>
        );
      }
      // Handle bullet points
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList || listType !== 'bulleted') {
          processCurrentList();
          inList = true;
          listType = 'bulleted';
        }
        const content = trimmedLine.substring(2);
        currentList.push(
          <li key={currentList.length} className="text-sm">
            {renderFormattedLine(content, index)}
          </li>
        );
      }
      // Regular paragraph
      else if (trimmedLine) {
        processCurrentList();
        inList = false;
        listType = null;
        
        elements.push(
          <p key={elements.length} className="text-sm mb-1">
            {renderFormattedLine(trimmedLine, index)}
          </p>
        );
      }
      // Empty line
      else if (inList) {
        processCurrentList();
        inList = false;
        listType = null;
      }
    });

    // Process any remaining list items
    processCurrentList();

    return <div className="space-y-1">{elements}</div>;
  };

  // Category handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim()) {
      showModalMessage('error', 'Category name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/category/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(modalData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add category');
      }

      setCategories([...categories, data.category]);
      showModalMessage('success', 'Category added successfully!');
      setTimeout(() => {
        closeModal();
        fetchCategories();
      }, 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim()) {
      showModalMessage('error', 'Category name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/category/${modalItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: modalData.name,
          descriptionTitle: modalData.descriptionTitle || "",
          description: modalData.description || ""
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      setCategories(categories.map(cat => 
        cat._id === modalItem._id ? data.category : cat
      ));
      showModalMessage('success', 'Category updated successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/category/${modalItem._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.productCount > 0) {
          throw new Error(data.message || `Cannot delete category. It is used by ${data.productCount} product(s).`);
        }
        throw new Error(data.error || 'Failed to delete category');
      }

      setCategories(categories.filter(cat => cat._id !== modalItem._id));
      setSubCategories(subCategories.filter(sub => sub.category?._id !== modalItem._id));
      showModalMessage('success', 'Category and its subcategories deleted successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Brand handlers
  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim()) {
      showModalMessage('error', 'Brand name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(modalData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add brand');
      }

      setBrands([...brands, data.brand]);
      showModalMessage('success', 'Brand added successfully!');
      setTimeout(() => {
        closeModal();
        fetchBrands();
      }, 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim()) {
      showModalMessage('error', 'Brand name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand/${modalItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: modalData.name,
          descriptionTitle: modalData.descriptionTitle || "",
          description: modalData.description || ""
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update brand');
      }

      setBrands(brands.map(brand => 
        brand._id === modalItem._id ? data.brand : brand
      ));
      showModalMessage('success', 'Brand updated successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand/${modalItem._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.productCount > 0) {
          throw new Error(data.message || `Cannot delete brand. It is used by ${data.productCount} product(s).`);
        }
        throw new Error(data.error || 'Failed to delete brand');
      }

      setBrands(brands.filter(brand => brand._id !== modalItem._id));
      showModalMessage('success', 'Brand deleted successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // SubCategory handlers
  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim() || !modalData.category) {
      showModalMessage('error', 'Subcategory name and category are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subcategory/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(modalData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add subcategory');
      }

      setSubCategories([...subCategories, data.subCategory]);
      showModalMessage('success', 'Subcategory added successfully!');
      setTimeout(() => {
        closeModal();
        fetchSubCategories();
      }, 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubCategory = async (e) => {
    e.preventDefault();
    if (!modalData.name?.trim() || !modalData.category) {
      showModalMessage('error', 'Subcategory name and category are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subcategory/${modalItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: modalData.name,
          category: modalData.category,
          descriptionTitle: modalData.descriptionTitle || "",
          description: modalData.description || ""
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subcategory');
      }

      setSubCategories(subCategories.map(sub => 
        sub._id === modalItem._id ? data.subCategory : sub
      ));
      showModalMessage('success', 'Subcategory updated successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subcategory/${modalItem._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.productCount > 0) {
          throw new Error(data.message || `Cannot delete subcategory. It is used by ${data.productCount} product(s).`);
        }
        throw new Error(data.error || 'Failed to delete subcategory');
      }

      setSubCategories(subCategories.filter(sub => sub._id !== modalItem._id));
      showModalMessage('success', 'Subcategory deleted successfully!');
      setTimeout(() => closeModal(), 1500);
    } catch (err) {
      showModalMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get modal title based on type and item
  const getModalTitle = () => {
    if (modalType === 'add') {
      return `Add New ${modalItem?.type?.charAt(0).toUpperCase() + modalItem?.type?.slice(1) || 'Item'}`;
    } else if (modalType === 'edit') {
      return `Edit ${modalItem?.type?.charAt(0).toUpperCase() + modalItem?.type?.slice(1) || 'Item'}`;
    } else if (modalType === 'delete') {
      return `Delete ${modalItem?.type?.charAt(0).toUpperCase() + modalItem?.type?.slice(1) || 'Item'}`;
    }
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
                <form onSubmit={
                  modalItem?.type === 'category' ? (modalType === 'add' ? handleAddCategory : handleEditCategory) :
                  modalItem?.type === 'brand' ? (modalType === 'add' ? handleAddBrand : handleEditBrand) :
                  (modalType === 'add' ? handleAddSubCategory : handleEditSubCategory)
                } className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>

                  {modalItem?.type === 'subcategory' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={modalData.category || ''}
                        onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Title
                    </label>
                    <input
                      type="text"
                      value={modalData.descriptionTitle || ''}
                      onChange={(e) => setModalData({ ...modalData, descriptionTitle: e.target.value })}
                      placeholder="Description Title (Optional)"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                      <span className="text-xs text-gray-500 ml-2">
                        Supports lists (1., 2., - item), bold (**text**), and line breaks
                      </span>
                    </label>
                    <textarea
                      value={modalData.description || ''}
                      onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                      placeholder={`Enter description with formatting:
• Use 1., 2., etc. for numbered lists
• Use - or * for bullet points
• Use **text** for bold text
• Press Enter for new lines`}
                      rows="6"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none font-mono text-xs"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? 'Saving...' : (modalType === 'add' ? 'Add' : 'Save')}
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
                    Are you sure you want to delete <strong>"{modalItem.name}"</strong>?
                    {modalItem.type === 'category' && ' This will also delete all associated subcategories.'}
                  </p>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={
                        modalItem.type === 'category' ? handleDeleteCategory :
                        modalItem.type === 'brand' ? handleDeleteBrand :
                        handleDeleteSubCategory
                      }
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Dropdowns</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage categories, brands, and subcategories for your products</p>
        </div>

        {/* Tabs - Mobile Scrollable */}
        <div className="mb-6 sm:mb-8 mx-2">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 min-w-max">
              {['categories', 'brands', 'subcategories'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 mx-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Categories</h2>
              <button
                onClick={() => openModal('add', { type: 'category' }, { name: '', descriptionTitle: '', description: '' })}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm sm:text-base"
              >
                + Add Category
              </button>
            </div>

            {/* Categories List */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Existing Categories ({categories.length})
              </h3>
              {categories.length === 0 ? (
                <p className="text-gray-500 italic text-sm sm:text-base">No categories found. Add your first category above.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-base sm:text-lg font-medium text-gray-800 break-words">{category.name}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                            Subs: {subCategories.filter(sub => sub.category?._id === category._id).length}
                          </span>
                        </div>
                        {category.descriptionTitle && (
                          <h4 className="text-sm font-semibold text-gray-700 mt-2 break-words">{category.descriptionTitle}</h4>
                        )}
                        {category.description && (
                          <div className="text-sm text-gray-600 mt-1 break-words">
                            {renderFormattedDescription(category.description)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => openModal('edit', { ...category, type: 'category' }, { 
                            name: category.name, 
                            descriptionTitle: category.descriptionTitle,
                            description: category.description 
                          })}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openModal('delete', { ...category, type: 'category' })}
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
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 mx-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Brands</h2>
              <button
                onClick={() => openModal('add', { type: 'brand' }, { name: '', descriptionTitle: '', description: '' })}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm sm:text-base"
              >
                + Add Brand
              </button>
            </div>

            {/* Brands List */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Existing Brands ({brands.length})
              </h3>
              {brands.length === 0 ? (
                <p className="text-gray-500 italic text-sm sm:text-base">No brands found. Add your first brand above.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {brands.map((brand) => (
                    <div
                      key={brand._id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="mb-2">
                          <span className="text-base sm:text-lg font-medium text-gray-800 break-words">{brand.name}</span>
                        </div>
                        {brand.descriptionTitle && (
                          <h4 className="text-sm font-semibold text-gray-700 mt-2 break-words">{brand.descriptionTitle}</h4>
                        )}
                        {brand.description && (
                          <div className="text-sm text-gray-600 mt-1 break-words">
                            {renderFormattedDescription(brand.description)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => openModal('edit', { ...brand, type: 'brand' }, { 
                            name: brand.name, 
                            descriptionTitle: brand.descriptionTitle,
                            description: brand.description 
                          })}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openModal('delete', { ...brand, type: 'brand' })}
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
        )}

        {/* SubCategories Tab */}
        {activeTab === 'subcategories' && (
          <div className="bg-white shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 mx-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Subcategories</h2>
              <button
                onClick={() => openModal('add', { type: 'subcategory' }, { name: '', category: '', descriptionTitle: '', description: '' })}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm sm:text-base"
              >
                + Add Subcategory
              </button>
            </div>

            {/* SubCategories List */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                Existing Subcategories ({subCategories.length})
              </h3>
              {subCategories.length === 0 ? (
                <p className="text-gray-500 italic text-sm sm:text-base">No subcategories found. Add your first subcategory above.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {subCategories.map((subCategory) => (
                    <div
                      key={subCategory._id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="mb-2">
                          <span className="text-base sm:text-lg font-medium text-gray-800 block break-words">{subCategory.name}</span>
                          <p className="text-sm text-gray-600 mt-1">
                            Category: {subCategory.category?.name || 'Unknown'}
                          </p>
                        </div>
                        {subCategory.descriptionTitle && (
                          <h4 className="text-sm font-semibold text-gray-700 mt-2 break-words">{subCategory.descriptionTitle}</h4>
                        )}
                        {subCategory.description && (
                          <div className="text-sm text-gray-600 mt-1 break-words">
                            {renderFormattedDescription(subCategory.description)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => openModal('edit', { ...subCategory, type: 'subcategory' }, { 
                            name: subCategory.name, 
                            category: subCategory.category?._id || subCategory.category,
                            descriptionTitle: subCategory.descriptionTitle,
                            description: subCategory.description 
                          })}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openModal('delete', { ...subCategory, type: 'subcategory' })}
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
        )}
      </div>
    </div>
  );
};

export default Dropdowns;