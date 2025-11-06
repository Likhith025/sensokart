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
  const navigate = useNavigate();

  // Fetch priorities and products
  const fetchPrioritySections = async () => {
    try {
      setLoading(true);
      setError('');

      const prioritiesResponse = await fetch(`${API_BASE_URL}/p`);
      if (!prioritiesResponse.ok) throw new Error('Failed to fetch priorities');
      const prioritiesData = await prioritiesResponse.json();
      const priorities = prioritiesData.data || [];

      const randomProductsResponse = await fetch(`${API_BASE_URL}/products?limit=20`);
      if (!randomProductsResponse.ok) throw new Error('Failed to fetch products');
      const randomProductsData = await randomProductsResponse.json();
      const allProducts = randomProductsData.products || randomProductsData;
      const shuffledProducts = Array.isArray(allProducts)
        ? [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 10)
        : [];
      setTopProducts(shuffledProducts);

      if (priorities.length === 0) {
        setPrioritySections([]);
        return;
      }

      const priorityGroups = {};
      priorities.forEach(p => {
        if (!priorityGroups[p.priority]) priorityGroups[p.priority] = [];
        priorityGroups[p.priority].push(p);
      });

      const sections = await Promise.all(
        Object.entries(priorityGroups)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(async ([level, group]) => {
            const results = await Promise.all(
              group.map(async (priority) => {
                let url = '';
                switch (priority.type) {
                  case 'Category': url = `${API_BASE_URL}/products?category=${priority.objectId}&limit=8`; break;
                  case 'Brand': url = `${API_BASE_URL}/products?brand=${priority.objectId}&limit=8`; break;
                  case 'Subcategory': url = `${API_BASE_URL}/products?subCategory=${priority.objectId}&limit=8`; break;
                  default: return { products: [], priority };
                }
                const res = await fetch(url);
                if (!res.ok) return { products: [], priority };
                const data = await res.json();
                return { products: Array.isArray(data.products) ? data.products : data, priority };
              })
            );

            return group.map(priority => {
              const products = results
                .filter(r => r.priority._id === priority._id)
                .flatMap(r => r.products)
                .slice(0, 12);

              return products.length > 0 ? {
                priorityLevel: parseInt(level),
                priorityName: priority.name,
                products,
                type: priority.type,
                priorityObject: priority
              } : null;
            }).filter(Boolean);
          })
      );

      setPrioritySections(sections.flat());
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrioritySections();
  }, []);

  const getCartQuantity = (productId) => {
    const item = cartItems.find(i => i._id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddProduct = () => navigate('/add');

  const getPriorityBadgeColor = (level) => {
    if (level === 10) return 'bg-red-500';
    if (level >= 8) return 'bg-orange-500';
    if (level >= 5) return 'bg-yellow-500';
    if (level >= 3) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getPriorityBadgeText = (level) => {
    if (level === 10) return 'Top';
    if (level >= 8) return 'Featured';
    if (level >= 5) return 'Popular';
    if (level >= 3) return 'Trending';
    return 'New';
  };

  const getSectionDescription = (section) => {
    switch (section.type) {
      case 'Category': return `Explore our ${section.priorityName} collection`;
      case 'Brand': return `Discover ${section.priorityName} products`;
      case 'Subcategory': return `Browse ${section.priorityName} items`;
      default: return 'Featured products';
    }
  };

  // UPDATED PRODUCT CARD - Fixed quantity buttons issue
  const ProductCard = ({ product, showPriorityBadge = false }) => {
    const cartQuantity = getCartQuantity(product._id);

    // Debug cart quantity
    console.log(`Product: ${product.name}, Cart Quantity: ${cartQuantity}, Product ID: ${product._id}`);

    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl relative flex flex-col h-full w-full max-w-sm mx-auto">
        {/* Badges */}
        {showPriorityBadge && product.priorityLevel && (
          <div className={`absolute top-2 left-2 ${getPriorityBadgeColor(product.priorityLevel)} text-white px-2.5 py-1 rounded-full text-xs font-bold z-10 shadow-md`}>
            {getPriorityBadgeText(product.priorityLevel)}
          </div>
        )}
        {product.salePrice && product.salePrice < product.price && (
          <span className="absolute top-2 right-2 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold z-10 shadow-md">
            SALE
          </span>
        )}

        <Link
          to={`/${product.dashedName || product.name.toLowerCase().replace(/\s+/g, '-')}`}
          className="block flex-grow"
        >
          {/* Image */}
          <div className="relative">
            {product.coverPhoto ? (
              <img
                src={product.coverPhoto}
                alt={product.name}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 font-medium text-sm">No Image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-grow">
            {/* Title - Full, no ellipsis */}
            <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight">
              {product.name}
            </h3>

            {/* Meta */}
            <div className="text-xs text-gray-500 space-y-0.5 mb-3">
              <p><span className="font-medium">Brand:</span> {product.brand?.name || 'N/A'}</p>
              <p><span className="font-medium">Cat:</span> {product.category?.name || 'N/A'}</p>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-4 line-clamp-2 flex-grow">
              {product.description || 'High-quality precision instrument.'}
            </p>
          </div>
        </Link>

        {/* Price + Add to Cart (Aligned) */}
        <div className="px-4 pb-4 mt-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Price */}
            <div className="flex items-baseline gap-1.5">
              {product.salePrice && product.salePrice < product.price ? (
                <>
                  <span className="text-xl font-bold text-red-600">₹{product.salePrice}</span>
                  <span className="text-xs text-gray-500 line-through">₹{product.price}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
              )}
            </div>

            {/* Add to Cart / Quantity - FIXED LOGIC */}
            {cartQuantity > 0 ? (
              <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product._id, cartQuantity - 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition text-gray-700 font-bold"
                >
                  −
                </button>
                <span className="px-3 font-bold text-sm text-gray-800 min-w-8 text-center">
                  {cartQuantity}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product._id, cartQuantity + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition text-gray-700 font-bold"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product);
                }}
                disabled={product.quantity === 0}
                className={`px-4 py-2 rounded-lg font-bold text-sm text-white transition-all ${
                  product.quantity > 0
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {product.quantity > 0 ? 'Add' : 'Out'}
              </button>
            )}
          </div>

          {/* Stock Status */}
          <p className={`text-xs text-center mt-2 font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Sensokart</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Precision measurement & testing solutions for industries, labs, and professionals.
          </p>
        </div>

        {/* Admin Buttons */}
        {userRole === 'admin' && (
          <div className="text-center mb-10 space-x-4">
            <button
              onClick={handleAddProduct}
              className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 shadow-xl hover:shadow-2xl transition"
            >
              Add New Product
            </button>
            <Link
              to="/priorities"
              className="px-8 py-4 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 shadow-xl hover:shadow-2xl transition inline-block"
            >
              Manage Priorities
            </Link>
          </div>
        )}

        {/* Cart Alert */}
        {totalItems > 0 && (
          <div className="mb-8 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center">
            <p className="text-lg font-semibold text-blue-800">
              You have <span className="text-2xl">{totalItems}</span> item{totalItems > 1 ? 's' : ''} in cart →{' '}
              <Link to="/cart" className="text-blue-600 hover:underline font-bold">
                View Cart
              </Link>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 rounded-2xl text-center text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-xl text-gray-600">Loading your featured products...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-20">
            {/* Priority Sections */}
            {prioritySections.map((section, idx) => (
              <section key={`${section.priorityName}-${idx}`} className="priority-section">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-3 mb-3">
                    <span className={`${getPriorityBadgeColor(section.priorityLevel)} text-white px-4 py-2 rounded-full font-bold shadow-lg`}>
                      {getPriorityBadgeText(section.priorityLevel)}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                      {section.priorityName}
                    </h2>
                  </div>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {getSectionDescription(section)}
                  </p>
                </div>

                {/* FIXED: Consistent grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {section.products.map(product => (
                    <ProductCard key={product._id} product={product} showPriorityBadge={true} />
                  ))}
                </div>

                {idx < prioritySections.length - 1 && <hr className="mt-16 border-gray-300" />}
              </section>
            ))}

            {/* Top Products - FIXED: Same grid layout as priority sections */}
            {topProducts.length > 0 && (
              <section className="top-products">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                    Top Products
                  </h2>
                  <p className="text-lg text-gray-600">
                    Handpicked bestsellers just for you
                  </p>
                </div>
                
                {/* FIXED: Now same grid layout as priority sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {topProducts.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-20">
          <Link
            to="/shop"
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xl font-bold rounded-full hover:from-blue-700 hover:to-indigo-800 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
          >
            Explore All Products
            <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;