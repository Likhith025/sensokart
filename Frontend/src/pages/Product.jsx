import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';
import { useCart } from '../context/CartContext';

const Product = ({ categoryItem }) => {
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
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]); // Store all subcategories globally

  // State for current category/brand/subcategory info
  const [currentItemInfo, setCurrentItemInfo] = useState(null);

  // Handle categoryItem from SmartItemRouter
  useEffect(() => {
    if (categoryItem) {
      console.log('🎯 Category item received:', categoryItem);
      console.log('🎯 Category item type:', categoryItem.type);

      let filterKey = '';
      let filterValue = '';

      // Normalize the type for comparison
      const normalizedType = categoryItem.type ? categoryItem.type.toLowerCase() : '';

      if (normalizedType === 'brand') {
        filterKey = 'brand';
        filterValue = categoryItem._id;
      } else if (normalizedType === 'category') {
        filterKey = 'category';
        filterValue = categoryItem._id;
        // Fetch subcategories for this category
        if (categoryItem._id) {
          fetchSubCategories(categoryItem._id);
        }
      } else if (normalizedType === 'subcategory') {
        filterKey = 'subCategory';
        filterValue = categoryItem._id;
        // If it's a subcategory, we need to fetch its parent category's subcategories
        if (categoryItem.category) {
          fetchSubCategories(categoryItem.category);
        }
      }

      console.log(`🎯 Setting filter: ${filterKey} = ${filterValue}`);

      if (filterKey && filterValue) {
        const newFilters = {
          ...filters,
          [filterKey]: filterValue
        };
        setFilters(newFilters);
        fetchProducts(newFilters);

        // Set the current item info for display
        setCurrentItemInfo({
          name: categoryItem.name,
          descriptionTitle: categoryItem.descriptionTitle,
          description: categoryItem.description,
          type: categoryItem.type
        });
      } else {
        console.warn('⚠️ Could not determine filter for category item:', categoryItem);
      }
    }
  }, [categoryItem]);

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
    fetchAllSubCategories(); // Fetch all subcategories on initial load

    // Fetch initial products if no categoryItem
    if (!categoryItem) {
      fetchProducts(filters);
    }
  }, []);

  // Fetch all brands, categories, subcategories for filters
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      if (response.ok) {
        const data = await response.json();
        setBrands(Array.isArray(data) ? data : []);
      } else {
        setBrands([]);
      }
    } catch (err) {
      console.error('Failed to fetch brands');
      setBrands([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch categories');
      setCategories([]);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/category/${categoryId}/subcategories`);
      if (response.ok) {
        const data = await response.json();
        setSubCategories(Array.isArray(data) ? data : []);
      } else {
        setSubCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch subcategories');
      setSubCategories([]);
    }
  };

  // Fetch ALL subcategories for global lookup
  const fetchAllSubCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory`);
      if (response.ok) {
        const data = await response.json();
        setAllSubCategories(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch all subcategories, using empty array');
        setAllSubCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch all subcategories:', err);
      setAllSubCategories([]);
    }
  };

  // Filter handling - Updated to navigate to clean URLs
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

    // Navigate to clean URLs based on filter type
    if (key === 'brand' && value) {
      const brand = Array.isArray(brands) ? brands.find(b => b._id === value) : null;
      if (brand) {
        const dashedName = brand.dashedName || brand.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/${dashedName}`);
        setCurrentItemInfo({
          name: brand.name,
          descriptionTitle: brand.descriptionTitle,
          description: brand.description,
          type: 'brand'
        });
      }
    } else if (key === 'category' && value) {
      const category = Array.isArray(categories) ? categories.find(c => c._id === value) : null;
      if (category) {
        const dashedName = category.dashedName || category.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/${dashedName}`);
        setCurrentItemInfo({
          name: category.name,
          descriptionTitle: category.descriptionTitle,
          description: category.description,
          type: 'category'
        });
      }
    } else if (key === 'subCategory' && value) {
      const currentSub = Array.isArray(subCategories) ? subCategories.find(s => s._id === value) : null;
      const allSub = Array.isArray(allSubCategories) ? allSubCategories.find(s => s._id === value) : null;
      const subCategory = currentSub || allSub;
      if (subCategory) {
        const dashedName = subCategory.dashedName || subCategory.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/${dashedName}`);
        setCurrentItemInfo({
          name: subCategory.name,
          descriptionTitle: subCategory.descriptionTitle,
          description: subCategory.description,
          type: 'subcategory'
        });
      }
    } else {
      // If no filter or cleared filter, navigate to shop
      navigate('/shop');
      setCurrentItemInfo(null);
    }

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
    setCurrentItemInfo(null);

    // Navigate to shop when clearing filters
    navigate('/shop');
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

  const handleAddProduct = () => {
    navigate('/add');
  };

  const displayedProducts = searchQuery ? searchResults : products;

  // Safe array check utility function
  const safeArrayFind = (array, predicate) => {
    return Array.isArray(array) ? array.find(predicate) : null;
  };

  // Get active filter names for display - Updated to use allSubCategories as fallback
  const getActiveFilterNames = () => {
    const activeFilters = [];

    if (filters.brand) {
      const brand = safeArrayFind(brands, b => b._id === filters.brand);
      if (brand) activeFilters.push(`Brand: ${brand.name}`);
    }

    if (filters.category) {
      const category = safeArrayFind(categories, c => c._id === filters.category);
      if (category) activeFilters.push(`Category: ${category.name}`);
    }

    if (filters.subCategory) {
      // Try to find in current subCategories first, then fallback to allSubCategories
      let subCategory = safeArrayFind(subCategories, s => s._id === filters.subCategory);
      if (!subCategory) {
        subCategory = safeArrayFind(allSubCategories, s => s._id === filters.subCategory);
      }
      if (subCategory) {
        activeFilters.push(`Subcategory: ${subCategory.name}`);
      } else {
        // If still not found, show generic subcategory text
        activeFilters.push(`Subcategory: Selected`);
      }
    }

    return activeFilters;
  };

  const getCartQuantity = (productId) => {
    const item = Array.isArray(cartItems) ? cartItems.find(item => item._id === productId) : null;
    return item ? item.quantity : 0;
  };

  // Handle product navigation with dashed name
  const handleProductNavigation = (product) => {
    const dashedName = product.dashedName || product.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/${dashedName}`);
  };

  // Handle product deletion (admin only)
  const handleDeleteProduct = async (productId, productName, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete

    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Product deleted successfully');
        // Refresh the products list
        fetchProducts(filters);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  // Get page title based on what we're filtering by
  const getPageTitle = () => {
    if (categoryItem) {
      return categoryItem.name;
    }
    if (filters.brand) {
      const brand = safeArrayFind(brands, b => b._id === filters.brand);
      return brand?.name || 'Products';
    }
    if (filters.category) {
      const category = safeArrayFind(categories, c => c._id === filters.category);
      return category?.name || 'Products';
    }
    if (filters.subCategory) {
      // Try to find in current subCategories first, then fallback to allSubCategories
      let subCategory = safeArrayFind(subCategories, s => s._id === filters.subCategory);
      if (!subCategory) {
        subCategory = safeArrayFind(allSubCategories, s => s._id === filters.subCategory);
      }
      return subCategory?.name || 'Products';
    }
    return 'All Products';
  };

  // Get page description based on what we're filtering by
  const getPageDescription = () => {
    if (categoryItem?.description) {
      return categoryItem.description;
    }
    if (filters.brand || filters.category || filters.subCategory) {
      return `Browse our collection of ${getPageTitle().toLowerCase()}`;
    }
    return 'Discover our wide range of precision measurement and testing solutions';
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

  // Safe rendering of dropdown options
  const renderDropdownOptions = (items, getLabel = (item) => item.name) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <option value="">No options available</option>;
    }

    return items.map(item => (
      <option key={item._id} value={item._id}>{getLabel(item)}</option>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          {/* Page Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {getPageTitle()}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            </p>
          </div>


          {/* Active URL Filters Display */}
          {(filters.brand || filters.category || filters.subCategory) && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {filters.brand && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Brand: {safeArrayFind(brands, b => b._id === filters.brand)?.name || 'Selected'}
                  </span>
                )}
                {filters.category && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Category: {safeArrayFind(categories, c => c._id === filters.category)?.name || 'Selected'}
                  </span>
                )}
                {filters.subCategory && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Subcategory: {getActiveFilterNames().find(f => f.startsWith('Subcategory'))?.replace('Subcategory: ', '') || 'Selected'}
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors cursor-pointer"
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
                onClick={handleAddProduct}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
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
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
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
                className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
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
                className="text-sm text-red-600 hover:text-red-700 font-medium mb-4 lg:mb-0 cursor-pointer"
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
                  {renderDropdownOptions(brands)}
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
                  {renderDropdownOptions(categories)}
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
                  {renderDropdownOptions(subCategories)}
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
                Showing {displayedProducts.length} product{displayedProducts.length !== 1 ? 's' : ''}
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {Array.isArray(displayedProducts) && displayedProducts.length > 0 ? (
                    displayedProducts.map((product) => {
                      const cartQuantity = getCartQuantity(product._id);
                      return (
                        <div
                          key={product._id}
                          className="bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                        >
                          <div
                            onClick={() => handleProductNavigation(product)}
                            className="cursor-pointer"
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
                            </div>
                          </div>

                          <div className="px-4 pb-4">
                            {cartQuantity > 0 ? (
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product._id, cartQuantity - 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-4 py-1 font-semibold text-gray-800">
                                  {cartQuantity}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product._id, cartQuantity + 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                disabled={product.quantity === 0}
                                className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 cursor-pointer ${product.quantity > 0
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                              >
                                {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                              </button>
                            )}

                            {/* Admin Delete Button */}
                            {userRole === 'admin' && (
                              <button
                                onClick={(e) => handleDeleteProduct(product._id, product.name, e)}
                                className="w-full mt-2 py-2 px-4 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 cursor-pointer shadow-md hover:shadow-lg"
                              >
                                Delete Product
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="text-gray-500 text-lg mb-4">No products found</div>
                      <button
                        onClick={clearFilters}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Category/Brand/Subcategory Description Section */}
                {currentItemInfo && (
                  <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
                    <div className="text-left mb-8">
                      {currentItemInfo.descriptionTitle && (
                        <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                          {currentItemInfo.descriptionTitle}
                        </h3>
                      )}
                    </div>

                    {currentItemInfo.description && (
                      <div className="prose prose-lg max-w-none text-gray-600">
                        {renderFormattedDescription(currentItemInfo.description)}
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">
                        {currentItemInfo.type === 'brand' && 'Brand'}
                        {currentItemInfo.type === 'category' && 'Category'}
                        {currentItemInfo.type === 'subcategory' && 'Subcategory'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;