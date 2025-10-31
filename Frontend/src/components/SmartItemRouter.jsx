import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductDetail from '../pages/ProductDetail';
import Product from '../pages/Product';
import API_BASE_URL from '../src';

const SmartItemRouter = () => {
  const { dashedName } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching item for dashedName:', dashedName);
        
        const response = await fetch(`${API_BASE_URL}/item/${dashedName}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 API Response:', result);

        // Check if the response has the expected structure
        if (result.success && result.data) {
          setItem(result.data);
        } else if (result._id) {
          // If it's a direct object (backward compatibility)
          setItem(result);
        } else {
          throw new Error('Invalid item data structure');
        }
      } catch (err) {
        console.error('❌ Error fetching item:', err);
        setError(err.message || 'Failed to load item');
      } finally {
        setLoading(false);
      }
    };

    if (dashedName) {
      fetchItem();
    }
  }, [dashedName]);

  // Normalize item type to lowercase for consistent checking
  const getNormalizedType = (item) => {
    if (!item || !item.type) return 'unknown';
    
    // Convert to lowercase for consistent comparison
    return item.type.toLowerCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The item you\'re looking for doesn\'t exist.'}</p>
          <p className="text-sm text-gray-500 mb-4">
            URL: {dashedName}
          </p>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering item:', item);
  console.log('🎯 Item type:', item.type);
  console.log('🎯 Normalized type:', getNormalizedType(item));

  const normalizedType = getNormalizedType(item);

  // Render based on normalized item type
  if (normalizedType === 'product') {
    return <ProductDetail product={item} />;
  } else if (['category', 'brand', 'subcategory'].includes(normalizedType)) {
    return <Product categoryItem={item} />;
  } else {
    console.warn('❓ Unknown item type:', item.type, 'Normalized:', normalizedType, 'Rendering as product listing anyway.');
    return <Product categoryItem={item} />;
  }
};

export default SmartItemRouter;