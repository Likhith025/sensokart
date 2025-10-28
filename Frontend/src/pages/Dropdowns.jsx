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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newBrand, setNewBrand] = useState({ name: '' });
  const [newSubCategory, setNewSubCategory] = useState({ name: '', category: '' });
  const [editItem, setEditItem] = useState(null);

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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchSubCategories();
  }, []);

  // Category handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError('Category name is required');
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
        body: JSON.stringify(newCategory)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add category');
      }

      setCategories([...categories, data.category]);
      setNewCategory({ name: '' });
      setSuccess('Category added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editItem.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/category/${editItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editItem.name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      setCategories(categories.map(cat => 
        cat._id === editItem._id ? data.category : cat
      ));
      setEditItem(null);
      setSuccess('Category updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all associated subcategories.')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/category/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a "used in products" error
        if (data.productCount > 0) {
          throw new Error(data.message || `Cannot delete category. It is used by ${data.productCount} product(s).`);
        }
        throw new Error(data.error || 'Failed to delete category');
      }

      // Remove category and its subcategories
      setCategories(categories.filter(cat => cat._id !== id));
      setSubCategories(subCategories.filter(sub => sub.category?._id !== id));
      setSuccess('Category and its subcategories deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Brand handlers
  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name.trim()) {
      setError('Brand name is required');
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
        body: JSON.stringify(newBrand)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add brand');
      }

      setBrands([...brands, data.brand]);
      setNewBrand({ name: '' });
      setSuccess('Brand added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = async (e) => {
    e.preventDefault();
    if (!editItem.name.trim()) {
      setError('Brand name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand/${editItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editItem.name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update brand');
      }

      setBrands(brands.map(brand => 
        brand._id === editItem._id ? data.brand : brand
      ));
      setEditItem(null);
      setSuccess('Brand updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brand/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a "used in products" error
        if (data.productCount > 0) {
          throw new Error(data.message || `Cannot delete brand. It is used by ${data.productCount} product(s).`);
        }
        throw new Error(data.error || 'Failed to delete brand');
      }

      setBrands(brands.filter(brand => brand._id !== id));
      setSuccess('Brand deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SubCategory handlers
  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!newSubCategory.name.trim() || !newSubCategory.category) {
      setError('Subcategory name and category are required');
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
        body: JSON.stringify(newSubCategory)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add subcategory');
      }

      setSubCategories([...subCategories, data.subCategory]);
      setNewSubCategory({ name: '', category: '' });
      setSuccess('Subcategory added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubCategory = async (e) => {
    e.preventDefault();
    if (!editItem.name.trim() || !editItem.category) {
      setError('Subcategory name and category are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subcategory/${editItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: editItem.name,
          category: editItem.category
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subcategory');
      }

      setSubCategories(subCategories.map(sub => 
        sub._id === editItem._id ? data.subCategory : sub
      ));
      setEditItem(null);
      setSuccess('Subcategory updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subcategory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a "used in products" error
        if (data.productCount > 0) {
          throw new Error(data.message || `Cannot delete subcategory. It is used by ${data.productCount} product(s).`);
        }
        throw new Error(data.error || 'Failed to delete subcategory');
      }

      setSubCategories(subCategories.filter(sub => sub._id !== id));
      setSuccess('Subcategory deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item, type) => {
    setEditItem({ ...item, type });
  };

  const cancelEdit = () => {
    setEditItem(null);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-28 sm:pt-32 pb-8 sm:pb-16">
        <div className="mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Dropdowns</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage categories, brands, and subcategories for your products</p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 mx-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm sm:text-base">
            <div className="flex items-start">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Cannot Delete</p>
                <p className="text-xs sm:text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-4 sm:mb-6 mx-2 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm sm:text-base">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Tabs - Mobile Scrollable */}
        <div className="mb-6 sm:mb-8 mx-2">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 min-w-max">
              {['categories', 'brands', 'subcategories'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap ${
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Categories</h2>
            
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add New Category</h3>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ name: e.target.value })}
                  placeholder="Category Name"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                >
                  {loading ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>

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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {editItem && editItem._id === category._id ? (
                        <form onSubmit={handleEditCategory} className="w-full space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
                          <input
                            type="text"
                            value={editItem.name}
                            onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            required
                          />
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                              {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                            <span className="text-base sm:text-lg font-medium text-gray-800 break-words">{category.name}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                              Subs: {subCategories.filter(sub => sub.category?._id === category._id).length}
                            </span>
                          </div>
                          <div className="flex space-x-2 self-end sm:self-auto">
                            <button
                              onClick={() => startEdit(category, 'category')}
                              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              disabled={loading}
                              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                              {loading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Brands</h2>
            
            {/* Add Brand Form */}
            <form onSubmit={handleAddBrand} className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add New Brand</h3>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ name: e.target.value })}
                  placeholder="Brand Name"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                >
                  {loading ? 'Adding...' : 'Add Brand'}
                </button>
              </div>
            </form>

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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {editItem && editItem._id === brand._id ? (
                        <form onSubmit={handleEditBrand} className="w-full space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
                          <input
                            type="text"
                            value={editItem.name}
                            onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            required
                          />
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                              {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="mb-2 sm:mb-0">
                            <span className="text-base sm:text-lg font-medium text-gray-800 break-words">{brand.name}</span>
                          </div>
                          <div className="flex space-x-2 self-end sm:self-auto">
                            <button
                              onClick={() => startEdit(brand, 'brand')}
                              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand._id)}
                              disabled={loading}
                              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                              {loading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Subcategories</h2>
            
            {/* Add SubCategory Form */}
            <form onSubmit={handleAddSubCategory} className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add New Subcategory</h3>
              <div className="space-y-3 sm:space-y-4 mb-4">
                <input
                  type="text"
                  value={newSubCategory.name}
                  onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                  placeholder="Subcategory Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                <select
                  value={newSubCategory.category}
                  onChange={(e) => setNewSubCategory({ ...newSubCategory, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? 'Adding...' : 'Add Subcategory'}
              </button>
            </form>

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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {editItem && editItem._id === subCategory._id ? (
                        <form onSubmit={handleEditSubCategory} className="w-full space-y-3">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editItem.name}
                              onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                              required
                            />
                            <select
                              value={editItem.category}
                              onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                              {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex-1 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="mb-2 sm:mb-0 flex-1">
                            <span className="text-base sm:text-lg font-medium text-gray-800 block break-words">{subCategory.name}</span>
                            <p className="text-sm text-gray-600 mt-1">
                              Category: {subCategory.category?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex space-x-2 self-end sm:self-auto">
                            <button
                              onClick={() => startEdit(subCategory, 'subcategory')}
                              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-lg cursor-pointer text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSubCategory(subCategory._id)}
                              disabled={loading}
                              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed text-sm"
                            >
                              {loading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
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