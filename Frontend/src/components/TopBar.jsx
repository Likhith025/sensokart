import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../assets/Logo.png'; // Adjust path and extension if needed

const Topbar = ({ cartItems = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!Cookies.get('authToken');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    Cookies.remove('authToken');
    Cookies.remove('userRole');
    navigate('/');
  };

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white shadow-md fixed w-full z-20 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="Sensokart Logo" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-800 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-800 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Products
            </Link>
            <Link
              to="/about"
              className="text-gray-800 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-800 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Contact
            </Link>

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

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="text-gray-800 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative text-gray-800 hover:text-green-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalCartQuantity}
                </span>
              )}
            </Link>

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="text-gray-800 hover:text-red-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}

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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-100 animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Products
            </Link>
            <Link
              to="/about"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              to="/cart"
              className="text-gray-800 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Cart ({totalCartQuantity})
            </Link>
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="text-gray-800 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Topbar;
