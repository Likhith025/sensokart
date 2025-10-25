import React from 'react'
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
import Product from './pages/Product';
import Dropdowns from './pages/Dropdowns';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Brands from './pages/Brands';
import RequestQuote from './pages/RequestQuote';
import AdminQuotes from './pages/AdminQuotes';

const App = () => {
  return (
    <div>
      <Topbar/>
      <Routes>
        <Route path="/about" element={<AboutUs/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/refund-policy" element={<RefundCancellationPolicy/>} />
        <Route path="/terms-and-conditions" element={<TermsConditions/>} />
        <Route path="/careers" element={<Careers/>} />
        <Route path="/services" element={<Services/>} />
        <Route path="/" element={<Home/>} />
        <Route path="/cart" element={<Cart/>} />
        <Route path="/product/:id" element={<ProductDetail/>} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/products" element={<Product/>} />
                <Route path="/shop" element={<Product/>} />
        <Route path="/dropdowns" element={<Dropdowns/>} />
        <Route path="/privacy-policy" element={<PrivacyPolicy/>} />
        <Route path="/brands" element={<Brands/>} />
        <Route path="/requestquote" element={<RequestQuote/>} />
        <Route path="/adminquotes" element={<AdminQuotes/>} />

      </Routes>
      <Footer/>
    </div>
  )
}

export default App
