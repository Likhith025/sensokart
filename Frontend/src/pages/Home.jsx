import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';
import { useCart } from '../context/CartContext';

const Home = () => {
  const { cartItems, addToCart, updateQuantity, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');
  const navigate = useNavigate();

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/products?sortBy=createdAt&sortOrder=desc&limit=12`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || data);
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, []);

  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddProduct = () => {
    navigate('/add');
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

          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Top Products</h2>
            <p className="text-gray-600 mt-2">Discover our latest and most popular products</p>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              <p className="ml-4 text-lg text-gray-600">Loading products...</p>
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map((product) => {
                  const cartQuantity = getCartQuantity(product._id);
                  return (
                    <div 
                      key={product._id} 
                      className="bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <Link to={`/product/${product._id}`} className="block">
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
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">No products found</div>
                  <button
                    onClick={fetchProducts}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;