import React from 'react'
import { useState, useEffect } from 'react';
import Topbar from './components/TopBar'
import { Routes, Route } from 'react-router-dom';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Footer from './components/Footer';
import RefundCancellationPolicy from './pages/RefundCancellationPolicy';
import TermsConditions from './pages/TermsConditions';
import Careers from './pages/Carrers';
import Services from './pages/Services';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import ContactEnquiry from './pages/ContactEnquiry';
import Product from './pages/Product';
import Dropdowns from './pages/Dropdowns';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Brands from './pages/Brands';
import RequestQuote from './pages/RequestQuote';
import AdminQuotes from './pages/AdminQuotes';
import AdminProfile from './pages/AdminProfile';
import AdminUserManagement from './pages/AdminUserManagment';
import AdminUsers from './pages/AdminUsers';
import AdminManagement from './pages/AdminManagement';
import AddNewProduct from './pages/AddNewProduct';
import Priorities from './pages/Priorities';
import AdminContent from './pages/AdminContent';
import SmartItemRouter from './components/SmartItemRouter';

// WhatsApp Button Component (inline)
const WhatsAppButton = () => {
  const phoneNumber = '+917601004575';
  const message = 'Hello! I would like to get more information about your products.';
  const [showPing, setShowPing] = useState(false);

  // Show ping effect every 60 seconds (1 minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPing(true);

      // Hide ping after 2 seconds (duration of the animation)
      setTimeout(() => {
        setShowPing(false);
      }, 2000);

    }, 60000); // 60 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 cursor-pointer group"
        aria-label="Contact us on WhatsApp"
      >
        {/* WhatsApp Icon */}
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52-.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.248-6.189-3.515-8.452" />
        </svg>

        {/* Periodic ping animation */}
        {showPing && (
          <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping"></div>
        )}
      </button>

      {/* Tooltip */}
      <div className="absolute right-16 bottom-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
        Chat with us on WhatsApp
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div>
      <Topbar />
      <Routes>
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/refund-policy" element={<RefundCancellationPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/services" element={<Services />} />
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        {/* CHANGED: Use dashedName instead of id 
        <Route path="/:dashedName" element={<ProductDetail/>} />*/}
        <Route path="/:dashedName" element={<SmartItemRouter />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contactenquiry" element={<ContactEnquiry />} />
        <Route path="/products" element={<Product />} />
        <Route path="/shop" element={<Product />} />
        <Route path="/dropdowns" element={<Dropdowns />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/requestquote" element={<RequestQuote />} />
        <Route path="/adminquotes" element={<AdminQuotes />} />
        <Route path="/adminm" element={<AdminManagement />} />
        <Route path="/add" element={<AddNewProduct />} />
        <Route path="/priorities" element={<Priorities />} />
        <Route path="/admincontent" element={<AdminContent />} />
      </Routes>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default App;