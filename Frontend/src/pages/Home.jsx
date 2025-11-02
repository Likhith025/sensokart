import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';
import { useCart } from '../context/CartContext';

const Home = () => {
  const { cartItems, addToCart, updateQuantity, totalItems } = useCart();
  const [prioritySections, setPrioritySections] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');
  const navigate = useNavigate();

  // Fetch priorities and organize by priority level
  const fetchPrioritySections = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch priorities
      const prioritiesResponse = await fetch(`${API_BASE_URL}/p`);
      if (!prioritiesResponse.ok) throw new Error('Failed to fetch priorities');
      
      const prioritiesData = await prioritiesResponse.json();
      const priorities = prioritiesData.data || [];

      // Fetch random products for Top Products section
      const randomProductsResponse = await fetch(`${API_BASE_URL}/products?limit=20`);
      if (!randomProductsResponse.ok) throw new Error('Failed to fetch products');
      
      const randomProductsData = await randomProductsResponse.json();
      const allProducts = randomProductsData.products || randomProductsData;
      
      // Select 10 random products
      const shuffledProducts = Array.isArray(allProducts) 
        ? [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 10)
        : [];

      setTopProducts(shuffledProducts);

      if (priorities.length === 0) {
        // If no priorities, just show the top products
        setPrioritySections([]);
        return;
      }

      // Group priorities by priority level
      const priorityGroups = {};
      priorities.forEach(priority => {
        if (!priorityGroups[priority.priority]) {
          priorityGroups[priority.priority] = [];
        }
        priorityGroups[priority.priority].push(priority);
      });

      // Fetch products for each priority group and create sections
      const sections = await Promise.all(
        Object.entries(priorityGroups)
          .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort by priority level descending
          .map(async ([priorityLevel, priorities]) => {
            // Fetch products for all priorities in this level
            const productPromises = priorities.map(async (priority) => {
              try {
                let url = '';
                
                switch (priority.type) {
                  case 'Category':
                    url = `${API_BASE_URL}/products?category=${priority.objectId}&limit=8`;
                    break;
                  case 'Brand':
                    url = `${API_BASE_URL}/products?brand=${priority.objectId}&limit=8`;
                    break;
                  case 'Subcategory':
                    url = `${API_BASE_URL}/products?subCategory=${priority.objectId}&limit=8`;
                    break;
                  default:
                    return [];
                }

                const response = await fetch(url);
                if (response.ok) {
                  const data = await response.json();
                  const products = data.products || data;
                  return {
                    products: Array.isArray(products) ? products : [],
                    priority: priority
                  };
                }
                return { products: [], priority: priority };
              } catch (err) {
                console.error(`Error fetching products for ${priority.type}:`, err);
                return { products: [], priority: priority };
              }
            });

            const productResults = await Promise.all(productPromises);
            
            // Create sections for each priority in this level
            const prioritySections = priorities.map(priority => {
              const sectionProducts = productResults
                .filter(result => result.priority._id === priority._id)
                .flatMap(result => result.products)
                .slice(0, 12);

              return {
                priorityLevel: parseInt(priorityLevel),
                priorityName: priority.name, // Use the actual priority name (Category/Brand/Subcategory name)
                products: sectionProducts,
                type: priority.type,
                priorityObject: priority
              };
            });

            return prioritySections.filter(section => section.products.length > 0);
          })
      );

      const allSections = sections.flat();
      setPrioritySections(allSections);

    } catch (err) {
      console.error('❌ Error fetching priority sections:', err);
      setError(err.message || 'Failed to load featured products.');
    } finally {
      setLoading(false);
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priorityLevel) => {
    if (priorityLevel === 10) return 'bg-red-500';
    if (priorityLevel >= 8) return 'bg-orange-500';
    if (priorityLevel >= 5) return 'bg-yellow-500';
    if (priorityLevel >= 3) return 'bg-green-500';
    return 'bg-blue-500';
  };

  // Get priority badge text
  const getPriorityBadgeText = (priorityLevel) => {
    if (priorityLevel === 10) return 'Top';
    if (priorityLevel >= 8) return 'Featured';
    if (priorityLevel >= 5) return 'Popular';
    if (priorityLevel >= 3) return 'Trending';
    return 'New';
  };

  // Get section description
  const getSectionDescription = (section) => {
    switch (section.type) {
      case 'Category':
        return `Explore our ${section.priorityName} collection`;
      case 'Brand':
        return `Discover ${section.priorityName} products`;
      case 'Subcategory':
        return `Browse ${section.priorityName} items`;
      default:
        return 'Featured products';
    }
  };

  // Initial load
  useEffect(() => {
    fetchPrioritySections();
  }, []);

  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddProduct = () => {
    navigate('/add');
  };

  const ProductCard = ({ product, showPriorityBadge = false }) => {
    const cartQuantity = getCartQuantity(product._id);
    
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl relative">
        {/* Priority Badge - Only show in priority sections */}
        {showPriorityBadge && product.priorityLevel && (
          <div className={`absolute top-2 left-2 ${getPriorityBadgeColor(product.priorityLevel)} text-white px-2 py-1 rounded-md text-xs font-bold z-10`}>
            {getPriorityBadgeText(product.priorityLevel)}
          </div>
        )}
        
        {/* Sale Badge */}
        {product.salePrice && product.salePrice < product.price && (
          <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            Sale
          </span>
        )}
        
        <Link to={`/${product.dashedName || product.name.toLowerCase().replace(/\s+/g, '-')}`} className="block">
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
        </Link>
        
        <div className="px-4 pb-4">
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
              <button
                onClick={() => updateQuantity(product._id, cartQuantity - 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                -
              </button>
              <span className="px-4 py-1 font-semibold text-gray-800">
                {cartQuantity}
              </span>
              <button
                onClick={() => updateQuantity(product._id, cartQuantity + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              disabled={product.quantity === 0}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 cursor-pointer ${
                product.quantity > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to Sensokart
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover precision measurement and testing solutions for all your industrial, laboratory, and commercial needs.
            </p>
          </div>
          </div>

{userRole === 'admin' && (
  <div className="text-center mb-6">
    <div className="mb-4">
      <button
        onClick={handleAddProduct}
        className="px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
      >
        Add New Product
      </button>
    </div>
    <div>
      <Link 
        to="/priorities" 
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
      >
        Manage Priorities
      </Link>
    </div>
  </div>
)}

        {/* Main Content Area */}
        <div className="flex-1">
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              <p className="ml-4 text-lg text-gray-600">Loading featured products...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-16">
              {/* Priority Sections First */}
              {prioritySections.map((section, index) => (
                <div key={`${section.priorityName}-${index}`} className="priority-section">
                  {/* Section Header */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-2">
                      <span className={`${getPriorityBadgeColor(section.priorityLevel)} text-white px-3 py-1 rounded-full text-sm font-bold mr-3`}>
                        {getPriorityBadgeText(section.priorityLevel)}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {section.priorityName}
                      </h2>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      {getSectionDescription(section)}
                    </p>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {section.products.length > 0 ? (
                      section.products.map((product) => (
                        <ProductCard 
                          key={product._id} 
                          product={product} 
                          showPriorityBadge={true}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">No products found in this section</p>
                      </div>
                    )}
                  </div>

                  {/* Section Separator */}
                  {index < prioritySections.length - 1 && (
                    <div className="mt-12 border-t border-gray-200"></div>
                  )}
                </div>
              ))}

              {/* Top Products Section - After Priorities */}
              {topProducts.length > 0 && (
                <div className="top-products-section">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      Top Products
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Discover our handpicked selection of quality products
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {topProducts.map((product) => (
                      <ProductCard 
                        key={product._id} 
                        product={product} 
                        showPriorityBadge={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Link 
              to="/shop" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer"
            >
              View All Products
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;