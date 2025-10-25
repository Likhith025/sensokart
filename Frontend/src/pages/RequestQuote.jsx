import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const RequestQuote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const token = Cookies.get('authToken');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';

  useEffect(() => {
    const savedCart = Cookies.get('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartItems(cart);
      
      // Convert cart items to quote format
      const quoteProducts = cart.map(item => ({
        product: item._id,
        productData: item,
        quantity: item.quantity || 1
      }));
      setProducts(quoteProducts);
    }

    // If coming from single product page with product data
    if (location.state && !location.state.quoteItems) {
      const { productId, product, quantity } = location.state;
      if (product) {
        setProducts([{
          product: product._id,
          productData: product,
          quantity: quantity || 1
        }]);
      }
    }

    // If coming from shop with multiple products
    if (location.state?.quoteItems) {
      setProducts(location.state.quoteItems);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const removeProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    
    // Also remove from cart if it exists there
    const productToRemove = products[index];
    if (productToRemove) {
      const updatedCart = cartItems.filter(item => item._id !== productToRemove.product);
      setCartItems(updatedCart);
      Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
    }
  };

  const updateProductQuantity = (index, quantity) => {
    if (quantity < 1) return;
    
    const updatedProducts = [...products];
    updatedProducts[index].quantity = quantity;
    setProducts(updatedProducts);
    
    // Also update cart quantity
    const productToUpdate = products[index];
    if (productToUpdate) {
      const updatedCart = cartItems.map(item => 
        item._id === productToUpdate.product 
          ? { ...item, quantity: quantity }
          : item
      );
      setCartItems(updatedCart);
      Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to request a quote.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (products.length === 0) {
      setError('Please add at least one product to request a quote.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const enquiryData = {
        products: products.map(p => ({
          product: p.product,
          quantity: p.quantity
        })),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      };

      const response = await fetch(`${API_BASE_URL}/enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enquiryData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to submit enquiry';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setSuccess('Quote request submitted successfully! We will contact you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      // Clear cart after successful submission
      setCartItems([]);
      setProducts([]);
      Cookies.remove('cart');
      Cookies.remove('quoteItems');

      setTimeout(() => {
        setSuccess('');
        navigate('/shop');
      }, 3000);

    } catch (err) {
      console.error('Error submitting quote request:', err);
      setError(err.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateTotal = () => {
    return products.reduce((total, item) => {
      const price = item.productData?.salePrice || item.productData?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const navigateToShop = () => {
    navigate('/shop');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar cartItems={cartItems} />
      
      <div className="pt-24">
        {/* Breadcrumb */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-4 text-sm">
              <button 
                onClick={() => navigate('/')} 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
              >
                Home
              </button>
              <span className="text-gray-400">/</span>
              <button 
                onClick={() => navigate('/shop')} 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
              >
                Shop
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Request a Quote</span>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Quote</h1>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you with a customized quote.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Products Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Products in Quote</h3>
                    <span className="text-sm text-gray-500">
                      {products.length} product{products.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {products.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-2">No products added to quote</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Add products to your cart first, then come back here to request a quote.
                      </p>
                      <button
                        onClick={navigateToShop}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
                      >
                        Go to Shop
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> To add multiple products, please add them to your cart first from the shop page, then click on "Request Quote" in the cart.
                            </p>
                          </div>
                        </div>
                      </div>

                      {products.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <img
                            src={item.productData?.coverPhoto || item.productData?.images?.[0]}
                            alt={item.productData?.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.productData?.name}</h4>
                            <p className="text-sm text-gray-600">{item.productData?.sku}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(item.productData?.salePrice || item.productData?.price || 0)}
                              </span>
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() => updateProductQuantity(index, Math.max(1, item.quantity - 1))}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 border-l border-r border-gray-300 min-w-12 text-center bg-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateProductQuantity(index, item.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeProduct(index)}
                            className="text-red-500 hover:text-red-700 p-2 transition-colors duration-200 hover:bg-red-50 rounded-md cursor-pointer"
                            title="Remove product"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Form Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        placeholder="+91 1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        placeholder="Tell us about your requirements, timeline, or any special requests..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || products.length === 0}
                      className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit Quote Request'
                      )}
                    </button>

                    <p className="text-sm text-gray-500 text-center">
                      We'll get back to you within 24 hours with your customized quote.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-200 transition-colors duration-200 cursor-pointer">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
                <p className="text-gray-600 text-sm">
                  Get quotes within 24 hours from our expert team
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-200 transition-colors duration-200 cursor-pointer">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Best Prices</h3>
                <p className="text-gray-600 text-sm">
                  Competitive pricing with volume discounts available
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-200 transition-colors duration-200 cursor-pointer">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Technical Support</h3>
                <p className="text-gray-600 text-sm">
                  Expert guidance and after-sales support included
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestQuote;