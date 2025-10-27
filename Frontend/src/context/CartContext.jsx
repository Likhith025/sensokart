import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage or cookies on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart_fallback') || Cookies.get('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            console.log('Loaded cart:', parsedCart);
            setCartItems(parsedCart);
          } else {
            console.warn('Parsed cart is not an array:', parsedCart);
            setCartItems([]);
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      }
    };
    loadCart();
  }, []);

  // Save cart to localStorage and cookies whenever cartItems changes
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        const cartData = JSON.stringify(cartItems);
        localStorage.setItem('cart_fallback', cartData);
        Cookies.set('cart', cartData, { expires: 7 });
        console.log('Saved cart:', cartItems);
      } else {
        localStorage.removeItem('cart_fallback');
        Cookies.remove('cart');
        console.log('Cleared cart storage');
      }
    } catch (error) {
      console.error('Error saving cart:', error);
      localStorage.setItem('cart_fallback', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      const cartProduct = {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        coverPhoto: product.coverPhoto,
        images: product.images || [],
        sku: product.sku,
        brand: product.brand || {},
        category: product.category || {},
        subCategory: product.subCategory || {},
        quantity: 1,
        stockQuantity: product.quantity || 0
      };
      console.log('Adding to cart:', cartProduct);
      return [...prev, cartProduct];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const updated = prev.filter(item => item._id !== productId);
      console.log('Removed item, new cart:', updated);
      return updated;
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems((prev) => {
        const updated = prev.map(item =>
          item._id === productId ? { ...item, quantity } : item
        );
        console.log('Updated quantity, new cart:', updated);
        return updated;
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    console.log('Cart cleared');
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.salePrice || item.price || 0;
    return total + price * (item.quantity || 1);
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;