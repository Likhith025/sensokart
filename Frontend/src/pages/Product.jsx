import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';
import { useCart } from '../context/CartContext';

const Product = () => {
  const { cartItems, addToCart, updateQuantity, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    subCategory: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [filterLoading, setFilterLoading] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');

  // Add Product Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    brand: '',
    category: '',
    subCategory: '',
    quantity: '',
    features: '',
    sku: ''
  });
  const [specsFields, setSpecsFields] = useState([{ key: '', value: '' }]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [images, setImages] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Add new options states
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

  // Parse URL parameters on component mount and when location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const brand = searchParams.get('brand') || '';
    
    const newFilters = {
      ...filters,
      category,
      subCategory,
      brand
    };
    
    setFilters(newFilters);
    fetchProducts(newFilters);
  }, [location.search]);

  // Fetch products with filters
  const fetchProducts = async (filterParams = {}) => {
    try {
      setFilterLoading(true);
      setError('');
      
      const currentFilters = { ...filters, ...filterParams };
      const cleanFilters = {};
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key] !== '') {
          cleanFilters[key] = currentFilters[key];
        }
      });
      
      const params = new URLSearchParams(cleanFilters);
      console.log('🔄 Fetching products with params:', Object.fromEntries(params));
      
      const response = await fetch(`${API_BASE_URL}/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || data);
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  // Fetch all brands, categories, subcategories for filters
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Failed to fetch brands');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/category/${categoryId}/subcategories`);
      const data = await response.json();
      setSubCategories(data);
    } catch (err) {
      console.error('Failed to fetch subcategories');
    }
  };

  // Filter handling
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (key === 'category') {
      newFilters.subCategory = '';
      if (value) {
        fetchSubCategories(value);
      } else {
        setSubCategories([]);
      }
    }
    
    const searchParams = new URLSearchParams();
    if (newFilters.brand) searchParams.set('brand', newFilters.brand);
    if (newFilters.category) searchParams.set('category', newFilters.category);
    if (newFilters.subCategory) searchParams.set('subCategory', newFilters.subCategory);
    
    const newUrl = searchParams.toString() ? `/shop?${searchParams.toString()}` : '/shop';
    window.history.pushState({}, '', newUrl);
    
    fetchProducts(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      brand: '',
      category: '',
      subCategory: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(resetFilters);
    setSubCategories([]);
    
    window.history.pushState({}, '', '/shop');
    fetchProducts(resetFilters);
  };

  // Search functionality
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      fetchProducts(filters);
      return;
    }
    
    try {
      setSearchLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || data);
      } else {
        throw new Error('Failed to search products');
      }
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const displayedProducts = searchQuery ? searchResults : products;

  // Add Product Handlers
  const handleAddInputChange = (e) => {
    setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
  };

  const handleAddFileChange = (e, type) => {
    if (type === 'cover') {
      setCoverPhoto(e.target.files[0]);
    } else {
      setImages(Array.from(e.target.files));
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/brand/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBrandName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBrands([...brands, data.brand]);
      setAddFormData({ ...addFormData, brand: data.brand._id });
      setNewBrandName('');
      setShowAddBrand(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/category/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories([...categories, data.category]);
      setAddFormData({ ...addFormData, category: data.category._id });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim() || !addFormData.category) return;
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSubCategoryName, category: addFormData.category })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubCategories([...subCategories, data.subCategory]);
      setAddFormData({ ...addFormData, subCategory: data.subCategory._id });
      setNewSubCategoryName('');
      setShowAddSubCategory(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleSpecsChange = (index, field, value) => {
    const newFields = [...specsFields];
    newFields[index][field] = value;
    setSpecsFields(newFields);
  };

  const addSpecsField = () => {
    setSpecsFields([...specsFields, { key: '', value: '' }]);
  };

  const removeSpecsField = (index) => {
    setSpecsFields(specsFields.filter((_, i) => i !== index));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (addLoading) return;
    try {
      setAddLoading(true);
      setAddError('');
      setAddSuccess('');
      const data = new FormData();
      Object.keys(addFormData).forEach(key => {
        data.append(key, addFormData[key]);
      });
      
      const specsObj = specsFields.reduce((obj, field) => {
        if (field.key.trim()) obj[field.key.trim()] = field.value.trim();
        return obj;
      }, {});
      data.append('specifications', JSON.stringify(specsObj));
      
      data.append('features', JSON.stringify(addFormData.features.split(',').map(item => item.trim()).filter(Boolean)));
      if (coverPhoto) data.append('coverPhoto', coverPhoto);
      images.forEach(img => data.append('images', img));

      const response = await fetch(`${API_BASE_URL}/products/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add product');
      setAddSuccess('Product added successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        fetchProducts();
        setAddFormData({
          name: '',
          description: '',
          price: '',
          salePrice: '',
          brand: '',
          category: '',
          subCategory: '',
          quantity: '',
          features: '',
          sku: ''
        });
        setSpecsFields([{ key: '', value: '' }]);
        setCoverPhoto(null);
        setImages([]);
      }, 2000);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // Get active filter names for display
  const getActiveFilterNames = () => {
    const activeFilters = [];
    if (filters.brand) {
      const brand = brands.find(b => b._id === filters.brand);
      if (brand) activeFilters.push(`Brand: ${brand.name}`);
    }
    if (filters.category) {
      const category = categories.find(c => c._id === filters.category);
      if (category) activeFilters.push(`Category: ${category.name}`);
    }
    if (filters.subCategory) {
      const subCategory = subCategories.find(s => s._id === filters.subCategory);
      if (subCategory) activeFilters.push(`Subcategory: ${subCategory.name}`);
    }
    return activeFilters;
  };

  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="text-center mb-6">
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search products by name, description, or SKU..."
                className="w-full p-4 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
              />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Active URL Filters Display */}
          {(filters.brand || filters.category || filters.subCategory) && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {filters.brand && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Brand: {brands.find(b => b._id === filters.brand)?.name}
                  </span>
                )}
                {filters.category && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Category: {categories.find(c => c._id === filters.category)?.name}
                  </span>
                )}
                {filters.subCategory && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Subcategory: {subCategories.find(s => s._id === filters.subCategory)?.name}
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Admin Add Product Button */}
          {userRole === 'admin' && (
            <div className="text-center mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Add New Product
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilterSidebar(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters</span>
            {(filters.brand || filters.category || filters.subCategory) && (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <div className={`
            fixed lg:sticky top-0 left-0 h-full lg:h-auto w-80 lg:w-64 bg-white shadow-xl lg:shadow-lg rounded-r-xl lg:rounded-xl p-6 z-40 transform transition-transform duration-300 ease-in-out
            ${showFilterSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Close button for mobile */}
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h3 className="text-xl font-bold text-gray-800">Filters</h3>
              <button
                onClick={() => setShowFilterSidebar(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="lg:flex lg:justify-between lg:items-center lg:mb-4">
              <h3 className="text-xl font-bold text-gray-800 hidden lg:block">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium mb-4 lg:mb-0"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-6">
              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <select
                  value={filters.subCategory}
                  onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                  disabled={!filters.category}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Subcategories</option>
                  {subCategories.map(subCategory => (
                    <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>
                  ))}
                </select>
              </div>

              {/* Active Filters Display */}
              {(filters.brand || filters.category || filters.subCategory) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Active Filters:</h4>
                  <div className="space-y-1">
                    {getActiveFilterNames().map((filter, index) => (
                      <div key={index} className="text-xs text-blue-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {filter}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overlay for mobile */}
          {showFilterSidebar && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setShowFilterSidebar(false)}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Cart Summary */}
            {totalItems > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
                <p className="font-medium">
                  You have {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart.
                  <Link to="/cart" className="ml-2 text-blue-600 hover:text-blue-800 underline">
                    View Cart
                  </Link>
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                {error}
              </div>
            )}

            {/* Results Count */}
            {!loading && !filterLoading && (
              <div className="mb-4 text-sm text-gray-600">
                Showing {displayedProducts.length} products
                {(filters.brand || filters.category || filters.subCategory) && (
                  <span className="ml-2 text-blue-600 font-medium">
                    (Filtered)
                  </span>
                )}
              </div>
            )}

            {/* Loading State */}
            {(loading || filterLoading) && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                <p className="ml-4 text-lg text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !filterLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedProducts.length > 0 ? (
                  displayedProducts.map((product) => {
                    const cartQuantity = getCartQuantity(product._id);
                    return (
                      <Link 
                        to={`/product/${product._id}`} 
                        key={product._id} 
                        className="bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl block"
                      >
                        <div className="relative">
                          {product.coverPhoto ? (
                            <img 
                              src={product.coverPhoto} 
                              alt={product.name} 
                              className="w-full h-48 object-cover" 
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">No Image</span>
                            </div>
                          )}
                          {product.salePrice && product.salePrice < product.price && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                              Sale
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">
                            Brand: {product.brand?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            Category: {product.category?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            Subcategory: {product.subCategory?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              {product.salePrice && product.salePrice < product.price ? (
                                <>
                                  <span className="text-xl font-bold text-red-600">
                                    ₹{product.salePrice}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ₹{product.price}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-gray-900">
                                  ₹{product.price}
                                </span>
                              )}
                            </div>
                            {product.quantity > 0 ? (
                              <span className="text-xs text-green-600 font-medium">In Stock</span>
                            ) : (
                              <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                            )}
                          </div>
                          
                          {cartQuantity > 0 ? (
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateQuantity(product._id, cartQuantity - 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                              >
                                -
                              </button>
                              <span className="px-4 py-1 font-semibold text-gray-800">
                                {cartQuantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateQuantity(product._id, cartQuantity + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(product);
                              }}
                              disabled={product.quantity === 0}
                              className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                                product.quantity > 0
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                          )}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500 text-lg mb-4">No products found</div>
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Product</h2>
            
            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {addSuccess}
              </div>
            )}
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  name="name" 
                  value={addFormData.name} 
                  onChange={handleAddInputChange} 
                  placeholder="Product Name" 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  name="sku" 
                  value={addFormData.sku} 
                  onChange={handleAddInputChange} 
                  placeholder="SKU" 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <textarea 
                name="description" 
                value={addFormData.description} 
                onChange={handleAddInputChange} 
                placeholder="Description" 
                required 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  name="price" 
                  type="number" 
                  value={addFormData.price} 
                  onChange={handleAddInputChange} 
                  placeholder="Price" 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  name="salePrice" 
                  type="number" 
                  value={addFormData.salePrice} 
                  onChange={handleAddInputChange} 
                  placeholder="Sale Price (optional)" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Brand Dropdown with Add */}
              <div>
                <div className="flex items-center space-x-2">
                  <select name="brand" value={addFormData.brand} onChange={handleAddInputChange} required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Brand</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddBrand(!showAddBrand)} className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddBrand && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="New Brand Name" className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddBrand} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Category Dropdown with Add */}
              <div>
                <div className="flex items-center space-x-2">
                  <select name="category" value={addFormData.category} onChange={handleAddInputChange} required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddCategory && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New Category Name" className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddCategory} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Subcategory Dropdown with Add */}
              <div>
                <div className="flex items-center space-x-2">
                  <select name="subCategory" value={addFormData.subCategory} onChange={handleAddInputChange} required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Subcategory</option>
                    {subCategories.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddSubCategory(!showAddSubCategory)} className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddSubCategory && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="New Subcategory Name" className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddSubCategory} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              <input name="quantity" type="number" value={addFormData.quantity} onChange={handleAddInputChange} placeholder="Quantity" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="features" value={addFormData.features} onChange={handleAddInputChange} placeholder="Features (comma separated)" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              {/* Specifications Key-Value Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                {specsFields.map((field, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      value={field.key}
                      onChange={(e) => handleSpecsChange(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={field.value}
                      onChange={(e) => handleSpecsChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => removeSpecsField(index)} className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      X
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSpecsField} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Add Field
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                <input type="file" onChange={(e) => handleAddFileChange(e, 'cover')} accept="image/*" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
                <input type="file" multiple onChange={(e) => handleAddFileChange(e, 'images')} accept="image/*" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="submit" 
                  disabled={addLoading}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {addLoading ? 'Adding Product...' : 'Add Product'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;