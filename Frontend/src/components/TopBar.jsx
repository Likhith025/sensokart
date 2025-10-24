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

  // Search functionality
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Handle category selection
  const handleCategorySelect = (categoryId, categoryName) => {
    navigate(`/shop?category=${categoryId}`);
    setShowCategories(false);
  };

  const handleSubCategorySelect = (categoryId, subCategoryId, subCategoryName) => {
    navigate(`/shop?category=${categoryId}&subCategory=${subCategoryId}`);
    setShowCategories(false);
  };

  // Handle brand selection
  const handleBrandSelect = (brandId, brandName) => {
    navigate(`/shop?brand=${brandId}`);
    setShowBrands(false);
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
    };
  }, []);

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
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product._id)}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                          {product.coverPhoto ? (
                            <img
                              src={product.coverPhoto}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {product.brand?.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            {product.salePrice ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-green-600">
                                  ₹{product.salePrice}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{product.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{product.price}
                              </span>
                            )}
                            {product.quantity > 0 ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* View All Results */}
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <button
                        type="submit"
                        className="w-full text-center text-sm font-medium text-green-600 hover:text-green-700 py-2"
                      >
                        View all {searchResults.length} results
                      </button>
                    </div>
                  </div>
                )}

                {/* No Results Message */}
                {showSearchResults && searchQuery && !searchLoading && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
                    <p className="text-sm text-gray-500 text-center">
                      No products found for "{searchQuery}"
                    </p>
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

              {/* Mobile Search Icon */}
              <button 
                className="md:hidden text-gray-800 hover:text-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                onClick={() => navigate('/search')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="text-gray-800 hover:text-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
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
                <button className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200 flex items-center">
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
                          {/* Category Header - Blue and Bold */}
                          <button
                            onClick={() => handleCategorySelect(category._id, category.name)}
                            className="w-full text-left mb-2 group"
                          >
                            <h3 className="text-blue-600 font-bold text-sm uppercase hover:text-blue-700 group-hover:underline">
                              {category.name}
                            </h3>
                          </button>
                          
                          {/* Subcategories - Normal font */}
                          {category.subCategories && category.subCategories.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {category.subCategories.map((subCategory) => (
                                <button
                                  key={subCategory._id}
                                  onClick={() => handleSubCategorySelect(category._id, subCategory._id, subCategory.name)}
                                  className="w-full text-left block text-gray-700 text-sm hover:text-green-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-150"
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
                <button className="hover:text-green-200 px-2 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200 flex items-center">
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
                            className="w-full text-left block text-gray-700 text-sm hover:text-green-600 hover:bg-gray-50 px-3 py-2 rounded transition-colors duration-150"
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

            {/* Login/Logout on Level 2 */}
            <div className="flex items-center space-x-4">
              {/* Show Dropdowns and Logout only for admin */}
              {isLoggedIn && userRole === 'admin' && (
                <>
                  {/* Simple Dropdowns Button - No arrow, no dropdown menu */}
                  <button 
                    onClick={() => navigate('/dropdowns')}
                    className="hover:text-green-200 px-3 py-1 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-green-200"
                  >
                    Dropdowns
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="hover:text-green-200 px-3 py-1 text-sm font-medium transition-colors duration-200 flex items-center border-b-2 border-transparent hover:border-green-200"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              )}

              {/* Show nothing when logged out (as per requirement) */}
              {!isLoggedIn && (
                <div className="w-20"></div>
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
                    className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-green-500 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Mobile Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product._id)}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md overflow-hidden mr-3">
                          {product.coverPhoto ? (
                            <img
                              src={product.coverPhoto}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            ₹{product.salePrice || product.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
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
                    className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
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
                          className="text-gray-600 hover:text-green-600 block px-3 py-1 rounded-md text-sm transition-colors duration-200 w-full text-left"
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
                  className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
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

            {/* Admin Dropdowns in Mobile Menu */}
            {isLoggedIn && userRole === 'admin' && (
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-sm font-medium text-gray-500">Admin</div>
                <button
                  onClick={() => {
                    navigate('/dropdowns');
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-800 hover:text-green-600 block px-6 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
                >
                  Dropdowns
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

            {/* Show Logout only for admin in mobile */}
            {isLoggedIn && userRole === 'admin' ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="text-gray-800 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Topbar;