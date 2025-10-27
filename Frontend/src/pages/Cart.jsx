import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Topbar from '../components/TopBar';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, totalItems } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleRequestQuote = () => {
    if (cartItems.length === 0) {
      alert('Please add products to cart before requesting a quote.');
      return;
    }
    
    const quoteItems = cartItems.map(item => ({
      product: item._id,
      productData: item,
      quantity: item.quantity || 1
    }));
    
    navigate('/requestquote', { 
      state: { 
        quoteItems: quoteItems 
      }
    });
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Topbar cartItems={cartItems} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md mx-auto">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">Looks like you haven't added anything to your cart yet.</p>
            <button
              onClick={handleContinueShopping}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer text-sm md:text-base w-full"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-20 md:pt-32 pb-8 md:pb-16">
        {/* Title Section */}
        <div className="mb-6 md:mb-10 px-2">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3 text-center">Your Shopping Cart</h1>
          <p className="text-gray-600 text-center text-sm md:text-lg">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>
        
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl rounded-xl p-4 md:p-6 mb-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Cart Items</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center cursor-pointer text-sm md:text-base"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-start border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow duration-200">
                    <img
                      src={item.coverPhoto || item.images?.[0] || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md mr-3 md:mr-4 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 truncate">{item.name || 'Unnamed Product'}</h3>
                      <p className="text-xs md:text-sm text-gray-600 Vogtmb-1 truncate">SKU: {item.sku || 'N/A'}</p>
                      {item.brand?.name && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2 truncate">Brand: {item.brand.name}</p>
                      )}
                      <p className="text-base md:text-lg font-bold text-blue-600">
                        {formatPrice(item.salePrice || item.price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm md:text-base"
                          disabled={(item.quantity || 1) <= 1}
                        >
                          -
                        </button>
                        <span className="px-2 md:px-4 py-1 font-semibold text-gray-800 min-w-8 md:min-w-12 text-center border border-gray-300 rounded-md bg-white text-sm md:text-base">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 cursor-pointer text-sm md:text-base"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 p-1 md:p-2 transition-colors duration-200 cursor-pointer"
                        title="Remove from cart"
                      >
                        <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center px-2">
              <button
                onClick={handleContinueShopping}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer text-sm md:text-base w-full md:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-xl p-4 md:p-6 sticky bottom-0 md:sticky md:top-32 z-10 border border-gray-200 md:border-none">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">Order Summary</h2>
              
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between text-base md:text-lg">
                  <span className="text-gray-600">Items ({totalItems}):</span>
                  <span className="font-semibold">{formatPrice(cartTotal)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 md:pt-4">
                  <div className="flex justify-between text-lg md:text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={handleRequestQuote}
                  className="w-full px-4 md:px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer text-sm md:text-base"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Request Quote
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full px-4 md:px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer text-sm md:text-base"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Cart
                </button>
              </div>

              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs md:text-sm text-blue-700">
                    <strong>Need a quote?</strong> Use the "Request Quote" button for bulk orders or customized pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;