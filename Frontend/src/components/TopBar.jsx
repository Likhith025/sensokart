import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../assets/Logo.png';
import API_BASE_URL from '../src';

const Topbar = ({ cartItems = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  
  // Debounce state for search
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const navigate = useNavigate();
  const isLoggedIn = !!Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    Cookies.remove('authToken');
    Cookies.remove('userRole');
    navigate('/');
  };

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Contact information
  const companyEmail = 'sales@sensokart.com';
  const companyPhone = '+919494122101';

  // Handle phone click
  const handlePhoneClick = () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = `tel:${companyPhone.replace(/\s/g, '')}`;
    } else {
      // For desktop, show phone number in a more prominent way or copy to clipboard
      navigator.clipboard.writeText(companyPhone.replace(/\s/g, ''));
      // You could show a toast notification here
      alert(`Phone number ${companyPhone} copied to clipboard`);
    }
  };

  // Handle email click
  const handleEmailClick = () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = `mailto:${companyEmail}`;
    } else {
      window.location.href = `mailto:${companyEmail}`;
    }
  };

  // Fetch categories with subcategories for the dropdown
  useEffect(() => {
    const fetchCategoriesWithSubcategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/category`);
        if (response.ok) {
          const categoriesData = await response.json();
          
          // Fetch subcategories for each category
          const categoriesWithSubcategories = await Promise.all(
            categoriesData.map(async (category) => {
              try {
                const subResponse = await fetch(`${API_BASE_URL}/category/${category._id}/subcategories`);
                if (subResponse.ok) {
                  const subcategories = await subResponse.json();
                  return { ...category, subCategories: subcategories };
                }
                return { ...category, subCategories: [] };
              } catch (err) {
                console.error(`Failed to fetch subcategories for ${category.name}:`, err);
                return { ...category, subCategories: [] };
              }
            })
          );
          
          setCategories(categoriesWithSubcategories);
        }
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/brand`);
        if (response.ok) {
          const brandsData = await response.json();
          setBrands(brandsData);
        }
      } catch (err) {
        console.error('Failed to fetch brands');
      }
    };

    fetchCategoriesWithSubcategories();
    fetchBrands();
  }, []);

  // Enhanced search functionality with debouncing
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Set loading state immediately
    setSearchLoading(true);
    setShowSearchResults(true);

    // Set new timer for debouncing
    const newTimer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.products || data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms debounce delay

    setDebounceTimer(newTimer);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery('');
      setIsMenuOpen(false); // Close mobile menu after search
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowSearchResults(false);
    setSearchQuery('');
    setIsMenuOpen(false); // Close mobile menu after product click
  };

  // Handle category selection
  const handleCategorySelect = (categoryId, categoryName) => {
    navigate(`/shop?category=${categoryId}`);
    setShowCategories(false);
    setIsMenuOpen(false); // Close mobile menu
  };

  const handleSubCategorySelect = (categoryId, subCategoryId, subCategoryName) => {
    navigate(`/shop?category=${categoryId}&subCategory=${subCategoryId}`);
    setShowCategories(false);
    setIsMenuOpen(false); // Close mobile menu
  };

  // Handle brand selection
  const handleBrandSelect = (brandId, brandName) => {
    navigate(`/shop?brand=${brandId}`);
    setShowBrands(false);
    setIsMenuOpen(false); // Close mobile menu
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
      if (!event.target.closest('.categories-container')) {
        setShowCategories(false);
      }
      if (!event.target.closest('.brands-container')) {
        setShowBrands(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Enhanced search result item component
  const SearchResultItem = ({ product }) => (
    <div
      onClick={() => handleProductClick(product._id)}
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 group"
    >
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4 border border-gray-200">
        {product.coverPhoto ? (
          <img
            src={product.coverPhoto}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${product.coverPhoto ? 'hidden' : 'flex'}`}>
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors duration-200">
          {product.name}
        </h4>
        
        {/* Brand and Category */}
        <div className="flex items-center space-x-2 mt-1">
          {product.brand?.name && (
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {product.brand.name}
            </span>
          )}
          {product.category?.name && (
            <span className="text-xs text-gray-500">
              in {product.category.name}
            </span>
          )}
        </div>

        {/* Price and Stock Status */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            {product.salePrice && product.salePrice < product.price ? (
              <>
                <span className="text-base font-bold text-green-600">
                  ₹{product.salePrice}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.price}
                </span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                  {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-gray-900">
                ₹{product.price}
              </span>
            )}
          </div>
          
          {product.quantity > 0 ? (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              In Stock
            </span>
          ) : (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          )}
        </div>

        {/* Description (truncated) */}
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {product.description}
          </p>
        )}
      </div>

      {/* View Product Arrow */}
      <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  // Mobile search icon handler - opens the menu and focuses on search
  const handleMobileSearchClick = () => {
    setIsMenuOpen(true);
    // Small timeout to ensure the menu is open before focusing
    setTimeout(() => {
      const mobileSearchInput = document.querySelector('.mobile-search-input');
      if (mobileSearchInput) {
        mobileSearchInput.focus();
      }
    }, 100);
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50 top-0">
      {/* Level 1 - 80% height */}
      <div className="h-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src={Logo} alt="Sensokart Logo" className="h-10 w-auto" />
              </Link>
            </div>

            {/* Search Bar with Results */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8 search-container">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products by name, brand, category, or description..."
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="w-full px-4 py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    </div>
                  )}
                  
                  {/* Clear search button */}
                  {searchQuery && !searchLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-10 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                    {/* Results Count */}
                    {searchResults.length > 0 && (
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm text-gray-600 font-medium">
                          Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Search Results */}
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((product) => (
                        <SearchResultItem key={product._id} product={product} />
                      ))}
                    </div>

                    {/* Loading State */}
                    {searchLoading && (
                      <div className="p-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                          <span className="text-sm text-gray-600">Searching products...</span>
                        </div>
                      </div>
                    )}

                    {/* No Results Message */}
                    {!searchLoading && searchQuery && searchResults.length === 0 && (
                      <div className="p-6 text-center">
                        <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-500 mb-2">
                          No products found for "<span className="font-medium text-gray-700">"{searchQuery}"</span>"
                        </p>
                        <p className="text-xs text-gray-400">
                          Try different keywords or check the spelling
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Cart and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative text-gray-800 hover:text-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalCartQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalCartQuantity}
                  </span>
                )}
              </Link>

              {/* Mobile Search Icon - Only show when menu is closed */}
              {!isMenuOpen && (
                <button 
                  className="md:hidden text-gray-800 hover:text-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
                  onClick={handleMobileSearchClick}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMenu}
                className="md:hidden text-gray-800 hover:text-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Level 2 - 20% height */}
      <div className="h-12 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between h-full">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200"
              >
                Home
              </Link>
              
              {/* Categories Dropdown */}
              <div 
                className="categories-container relative"
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
              >
                <button className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200 flex items-center cursor-pointer">
                  Categories
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Categories Dropdown Menu */}
                {showCategories && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category._id} className="mb-4 last:mb-0">
                          <button
                            onClick={() => handleCategorySelect(category._id, category.name)}
                            className="w-full text-left mb-2 group cursor-pointer"
                          >
                            <h3 className="text-blue-600 font-bold text-sm uppercase hover:text-blue-700 group-hover:underline">
                              {category.name}
                            </h3>
                          </button>
                          
                          {category.subCategories && category.subCategories.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {category.subCategories.map((subCategory) => (
                                <button
                                  key={subCategory._id}
                                  onClick={() => handleSubCategorySelect(category._id, subCategory._id, subCategory.name)}
                                  className="w-full text-left block text-gray-700 text-sm hover:text-green-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-150 cursor-pointer"
                                >
                                  {subCategory.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Brands Dropdown */}
              <div 
                className="brands-container relative"
                onMouseEnter={() => setShowBrands(true)}
                onMouseLeave={() => setShowBrands(false)}
              >
                <button className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200 flex items-center cursor-pointer">
                  Brands
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Brands Dropdown Menu */}
                {showBrands && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                      <div className="mb-2">
                        <h3 className="text-blue-600 font-bold text-sm uppercase mb-3">
                          All Brands
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {brands.map((brand) => (
                          <button
                            key={brand._id}
                            onClick={() => handleBrandSelect(brand._id, brand.name)}
                            className="w-full text-left block text-gray-700 text-sm hover:text-green-600 hover:bg-gray-50 px-3 py-2 rounded transition-colors duration-150 cursor-pointer"
                          >
                            {brand.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/shop"
                className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200"
              >
                Shop
              </Link>
              <Link
                to="/about"
                className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200"
              >
                Contact
              </Link>
            </div>

            {/* Right side - Admin options OR Contact info */}
            <div className="flex items-center space-x-6">
{isLoggedIn && userRole === 'admin' ? (
  <>
    {/* Admin Section */}
    <button 
      onClick={() => navigate('/adminquotes')}
      className="group px-3 py-1 text-sm font-medium text-gray-200 transition-all duration-300 border-b-2 border-transparent flex items-center hover:text-green-300 hover:border-green-300 hover:scale-105 cursor-pointer"
    >
      <svg 
        className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:rotate-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Quote Requests
    </button>

    {/* Contact Enquiries Button */}
    <button 
      onClick={() => navigate('/contactenquiry')}
      className="group px-3 py-1 text-sm font-medium text-gray-200 transition-all duration-300 border-b-2 border-transparent flex items-center hover:text-green-300 hover:border-green-300 hover:scale-105 cursor-pointer"
    >
      <svg 
        className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:rotate-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Contact Enquiries
    </button>

    <button 
      onClick={() => navigate('/dropdowns')}
      className="px-3 py-1 text-sm font-medium text-gray-200 transition-all duration-300 border-b-2 border-transparent hover:text-green-300 hover:border-green-300 hover:scale-105 cursor-pointer"
    >
      Dropdowns
    </button>

    <button 
      onClick={() => navigate('/adminm')}
      className="px-3 py-1 text-sm font-medium text-gray-200 transition-all duration-300 border-b-2 border-transparent hover:text-green-300 hover:border-green-300 hover:scale-105 cursor-pointer"
    >
      Admin Management
    </button>

    <button
      onClick={handleLogout}
      className="hover:text-green-200 px-3 py-1 text-sm font-medium transition-colors duration-200 flex items-center border-b-2 border-transparent hover:border-green-200 cursor-pointer"
    >
      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  </>
) : (
                <>
                  {/* Contact Information for non-admin users */}
                  <div className="flex items-center space-x-6">
                    {/* Email */}
                    <button
                      onClick={handleEmailClick}
                      className="flex items-center space-x-2 text-gray-200 hover:text-green-300 transition-colors duration-200 cursor-pointer group"
                    >
                      <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium border-b border-transparent group-hover:border-green-300">
                        {companyEmail}
                      </span>
                    </button>

                    {/* Phone */}
                    <button
                      onClick={handlePhoneClick}
                      className="flex items-center space-x-2 text-gray-200 hover:text-green-300 transition-colors duration-200 cursor-pointer group"
                    >
                      <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium border-b border-transparent group-hover:border-green-300">
                        {companyPhone}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Search Bar - Shows when menu is open */}
          {isMenuOpen && (
            <div className="md:hidden px-4 py-2 bg-green-700 search-container">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="mobile-search-input w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-green-500 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    </div>
                  )}
                  
                  {/* Clear search button for mobile */}
                  {searchQuery && !searchLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-10 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Mobile Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                    {/* Results Count */}
                    {searchResults.length > 0 && (
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs text-gray-600 font-medium">
                          Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Search Results */}
                    <div className="max-h-48 overflow-y-auto">
                      {searchResults.map((product) => (
                        <SearchResultItem key={product._id} product={product} />
                      ))}
                    </div>

                    {/* Loading State */}
                    {searchLoading && (
                      <div className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          <span className="text-xs text-gray-600">Searching products...</span>
                        </div>
                      </div>
                    )}

                    {/* No Results Message */}
                    {!searchLoading && searchQuery && searchResults.length === 0 && (
                      <div className="p-4 text-center">
                        <svg className="h-8 w-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-500 mb-1">
                          No products found for "<span className="font-medium text-gray-700">"{searchQuery}"</span>"
                        </p>
                        <p className="text-xs text-gray-400">
                          Try different keywords
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Mobile Contact Info in Green Bar - Show when NOT admin and menu is NOT open */}
{!isMenuOpen && (!isLoggedIn || userRole !== 'admin') && (
  <div className="md:hidden flex items-center justify-center h-full space-x-4 px-4 overflow-x-auto">
    {/* Email */}
    <button
      onClick={handleEmailClick}
      className="flex items-center space-x-2 text-gray-200 hover:text-green-300 transition-colors duration-200 cursor-pointer group flex-shrink-0"
    >
      <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className="text-sm font-medium border-b border-transparent group-hover:border-green-300 whitespace-nowrap">
        {companyEmail}
      </span>
    </button>

    {/* Phone */}
    <button
      onClick={handlePhoneClick}
      className="flex items-center space-x-2 text-gray-200 hover:text-green-300 transition-colors duration-200 cursor-pointer group flex-shrink-0"
    >
      <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span className="text-sm font-medium border-b border-transparent group-hover:border-green-300 whitespace-nowrap">
        {companyPhone}
      </span>
    </button>
  </div>
)}          

{/* Mobile Admin Options in Green Bar - Show when logged in as admin and menu is NOT open */}
{!isMenuOpen && isLoggedIn && userRole === 'admin' && (
  <div className="md:hidden flex items-center justify-center space-x-2 px-4 py-1 overflow-x-auto">
    {/* Quote Requests Button */}
    <button 
      onClick={() => navigate('/adminquotes')}
      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-200 transition-all duration-300 border-b border-transparent hover:text-green-300 hover:border-green-300 flex items-center cursor-pointer whitespace-nowrap"
    >
      <svg 
        className="h-3 w-3 mr-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Quotes
    </button>

    {/* Contact Enquiries Button - ADD THIS */}
    <button 
      onClick={() => navigate('/contactenquiry')}
      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-200 transition-all duration-300 border-b border-transparent hover:text-green-300 hover:border-green-300 flex items-center cursor-pointer whitespace-nowrap"
    >
      <svg 
        className="h-3 w-3 mr-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Enquiries
    </button>

    {/* Dropdowns Button */}
    <button 
      onClick={() => navigate('/dropdowns')}
      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-200 transition-all duration-300 border-b border-transparent hover:text-green-300 hover:border-green-300 cursor-pointer whitespace-nowrap"
    >
      Dropdowns
    </button>

    {/* Admin Management Button */}
    <button 
      onClick={() => navigate('/adminm')}
      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-200 transition-all duration-300 border-b border-transparent hover:text-green-300 hover:border-green-300 cursor-pointer whitespace-nowrap"
    >
      Admin
    </button>

    {/* Logout Button */}
    <button
      onClick={handleLogout}
      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-200 transition-colors duration-200 flex items-center border-b border-transparent hover:text-green-300 hover:border-green-300 cursor-pointer whitespace-nowrap"
    >
      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  </div>
)}
        </div>
      </div>

      {/* Mobile Menu - Only show when menu is open and search is not active */}
      {isMenuOpen && !searchQuery && (
        <div className="md:hidden bg-white shadow-lg border-t border-gray-100 animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {/* Mobile Categories */}
            <div className="border-t border-gray-200 pt-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500">Categories</div>
              {categories.map((category) => (
                <div key={category._id}>
                  <button
                    onClick={() => {
                      handleCategorySelect(category._id, category.name);
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left cursor-pointer"
                  >
                    <span className="font-bold text-blue-600">{category.name}</span>
                  </button>
                  {category.subCategories && category.subCategories.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {category.subCategories.map((subCategory) => (
                        <button
                          key={subCategory._id}
                          onClick={() => {
                            handleSubCategorySelect(category._id, subCategory._id, subCategory.name);
                            setIsMenuOpen(false);
                          }}
                          className="text-gray-600 hover:text-green-600 block px-3 py-1 rounded-md text-sm transition-colors duration-200 w-full text-left cursor-pointer"
                        >
                          {subCategory.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Brands */}
            <div className="border-t border-gray-200 pt-2">
              <div className="px-3 py-2 text-sm font-medium text-gray-500">Brands</div>
              {brands.map((brand) => (
                <button
                  key={brand._id}
                  onClick={() => {
                    handleBrandSelect(brand._id, brand.name);
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left cursor-pointer"
                >
                  {brand.name}
                </button>
              ))}
            </div>

            <Link
              to="/shop"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>

            {/* Contact Information in Mobile Menu */}
            {(!isLoggedIn || userRole !== 'admin') && (
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-sm font-medium text-gray-500">Contact Us</div>
                
                {/* Email in Mobile Menu */}
                <button
                  onClick={() => {
                    handleEmailClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left flex items-center cursor-pointer"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {companyEmail}
                </button>

                {/* Phone in Mobile Menu */}
                <button
                  onClick={() => {
                    handlePhoneClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left flex items-center cursor-pointer"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {companyPhone}
                </button>
              </div>
            )}

{/* Admin Section in Mobile Menu */}
{isLoggedIn && userRole === 'admin' && (
  <div className="border-t border-gray-200 pt-2">
    <div className="px-3 py-2 text-sm font-medium text-gray-500">Admin</div>
    
    {/* Quote Requests in Mobile */}
    <button
      onClick={() => {
        navigate('/adminquotes');
        setIsMenuOpen(false);
      }}
      className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left flex items-center cursor-pointer"
    >
      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Quote Requests
    </button>

    {/* Contact Enquiries in Mobile */}
    <button
      onClick={() => {
        navigate('/contactenquiry');
        setIsMenuOpen(false);
      }}
      className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left flex items-center cursor-pointer"
    >
      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Contact Enquiries
    </button>

    {/* Dropdowns in Mobile */}
    <button
      onClick={() => {
        navigate('/dropdowns');
        setIsMenuOpen(false);
      }}
      className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left cursor-pointer"
    >
      Dropdowns
    </button>

    {/* Admin Management in Mobile */}
    <button
      onClick={() => {
        navigate('/adminm');
        setIsMenuOpen(false);
      }}
      className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left cursor-pointer"
    >
      Admin Management
    </button>

    

    {/* Logout in Mobile */}
    <button
      onClick={() => {
        handleLogout();
        setIsMenuOpen(false);
      }}
      className="text-gray-800 hover:text-red-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left cursor-pointer"
    >
      Logout
    </button>
  </div>
)}
            <Link
              to="/cart"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Cart ({totalCartQuantity})
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Topbar;