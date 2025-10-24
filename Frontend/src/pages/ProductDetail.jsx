import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quoteSuccess, setQuoteSuccess] = useState('');
  const [quoteError, setQuoteError] = useState('');

  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');

  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    brand: '',
    category: '',
    subCategory: '',
    quantity: '',
    features: '',
    sku: '',
    weight: '',
    manufacturer: '',
    modelNo: '',
    measuringParameters: ''
  });
  const [editSpecsFields, setEditSpecsFields] = useState([{ key: '', value: '' }]);
  const [editCoverPhoto, setEditCoverPhoto] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [removeCoverPhoto, setRemoveCoverPhoto] = useState(false);
  const [imagesToRemove, setImagesToRemove] = useState([]);

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Refs for file inputs
  const coverPhotoInputRef = React.useRef(null);
  const imagesInputRef = React.useRef(null);

  useEffect(() => {
    const savedCart = Cookies.get('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    Cookies.set('cart', JSON.stringify(cartItems), { expires: 7 });
  }, [cartItems]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Invalid response from server');
        }

        const data = await response.json();
        console.log('Raw product data:', JSON.stringify(data, null, 2));
        console.log('Specifications type:', typeof data.specifications);
        console.log('Specifications content:', JSON.stringify(data.specifications, null, 2));
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product');
        }

        setProduct(data);
        setSelectedImage(data.coverPhoto || data.images?.[0] || '');

        // Set edit form data
        setEditFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          salePrice: data.salePrice || '',
          brand: data.brand?._id || '',
          category: data.category?._id || '',
          subCategory: data.subCategory?._id || '',
          quantity: data.quantity || '',
          features: data.features?.join(', ') || '',
          sku: data.sku || '',
          weight: data.weight || '1 kg',
          manufacturer: data.manufacturer || '',
          modelNo: data.modelNo || '',
          measuringParameters: data.measuringParameters || ''
        });

        // Parse specifications with robust validation
        let specs = [];
        try {
          const specsData = data.specifications;
          if (!specsData) {
            console.warn('Specifications is null or undefined, using default');
            specs = [{ key: '', value: '' }];
          } else if (typeof specsData === 'string') {
            console.warn('Specifications is a string, attempting to parse:', specsData);
            try {
              const parsedSpecs = JSON.parse(specsData);
              if (typeof parsedSpecs === 'object' && !Array.isArray(parsedSpecs) && parsedSpecs !== null) {
                specs = Object.entries(parsedSpecs)
                  .filter(([key, value]) => typeof key === 'string' && value !== undefined && value !== null && value !== '')
                  .map(([key, value]) => ({ key, value: String(value) }));
              } else if (Array.isArray(parsedSpecs)) {
                specs = parsedSpecs
                  .filter(item => item && typeof item === 'object' && 'key' in item && 'value' in item && typeof item.key === 'string' && item.value !== undefined && item.value !== null && item.value !== '')
                  .map(item => ({ key: item.key, value: String(item.value) }));
              } else {
                console.warn('Parsed specifications is neither an object nor an array:', parsedSpecs);
                specs = [{ key: '', value: '' }];
              }
            } catch (parseErr) {
              console.error('Failed to parse specifications string:', parseErr, 'Raw string:', specsData);
              specs = [{ key: '', value: '' }];
            }
          } else if (typeof specsData === 'object' && !Array.isArray(specsData) && specsData !== null) {
            specs = Object.entries(specsData)
              .filter(([key, value]) => typeof key === 'string' && value !== undefined && value !== null && value !== '')
              .map(([key, value]) => ({ key, value: String(value) }));
          } else if (Array.isArray(specsData)) {
            specs = specsData
              .filter(item => item && typeof item === 'object' && 'key' in item && 'value' in item && typeof item.key === 'string' && item.value !== undefined && item.value !== null && item.value !== '')
              .map(item => ({ key: item.key, value: String(item.value) }));
          } else {
            console.warn('Specifications is an unexpected type:', typeof specsData, specsData);
            specs = [{ key: '', value: '' }];
          }
          if (!specs.length) {
            console.warn('No valid specifications found, using default');
            specs = [{ key: '', value: '' }];
          }
        } catch (specErr) {
          console.error('Error parsing specifications:', specErr);
          specs = [{ key: '', value: '' }];
        }
        console.log('Processed specifications for editSpecsFields:', specs);
        setEditSpecsFields(specs);

        // Fetch related products
        fetchRelatedProducts(data._id);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch dropdown data when edit mode is enabled
  useEffect(() => {
    if (isEditMode && userRole === 'admin') {
      fetchBrands();
      fetchCategories();
      if (editFormData.category) {
        fetchSubCategories(editFormData.category);
      }
    }
  }, [isEditMode, userRole, editFormData.category]);

  const fetchRelatedProducts = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/related`);
      if (response.ok) {
        const data = await response.json();
        setRelatedProducts(data);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/category/${categoryId}/subcategories`);
      const data = await response.json();
      setSubCategories(data);
    } catch (err) {
      console.error('Failed to fetch subcategories:', err);
    }
  };

  // Cart functionality
  const addToCart = () => {
    setCartItems((prev) => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setQuantity(1);
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prev) => prev.filter(item => item._id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map(item =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getCartQuantity = () => {
    const item = cartItems.find(item => item._id === product?._id);
    return item ? item.quantity : 0;
  };

  // Request Quote functionality
  const handleRequestQuote = async () => {
    if (!token) {
      setQuoteError('Please log in to request a quote.');
      setTimeout(() => setQuoteError(''), 3000);
      return;
    }

    try {
      setQuoteError('');
      setQuoteSuccess('');

      const response = await fetch(`${API_BASE_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to request quote';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setQuoteSuccess('Quote requested successfully!');
      setTimeout(() => setQuoteSuccess(''), 3000);
    } catch (err) {
      console.error('Error requesting quote:', err);
      setQuoteError(err.message || 'Failed to request quote');
      setTimeout(() => setQuoteError(''), 3000);
    }
  };

  // Image zoom functionality
  const handleImageMouseMove = (e) => {
    if (!imageZoom) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  // Edit functionality
  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    // Fetch subcategories when category changes
    if (e.target.name === 'category') {
      fetchSubCategories(e.target.value);
    }
  };

  const handleEditFileChange = (e, type) => {
    if (type === 'cover') {
      setEditCoverPhoto(e.target.files[0]);
      setRemoveCoverPhoto(false);
    } else {
      setEditImages(Array.from(e.target.files));
    }
  };

  const removeEditCoverPhoto = () => {
    setEditCoverPhoto(null);
    setRemoveCoverPhoto(true);
  };

  const removeEditImage = (index) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl) => {
    setImagesToRemove([...imagesToRemove, imageUrl]);
  };

  const handleEditSpecsChange = (index, field, value) => {
    const newFields = [...editSpecsFields];
    newFields[index][field] = value;
    setEditSpecsFields(newFields);
  };

  const addEditSpecsField = () => {
    setEditSpecsFields([...editSpecsFields, { key: '', value: '' }]);
  };

  const removeEditSpecsField = (index) => {
    setEditSpecsFields(editSpecsFields.filter((_, i) => i !== index));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editLoading) return;

    try {
      setEditLoading(true);
      setEditError('');
      setEditSuccess('');

      // Create FormData for file uploads
      const formData = new FormData();

      // Add text fields
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value === '' ? null : value);
        }
      });

      // Add features as array
      const featuresArray = editFormData.features
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      formData.append('features', JSON.stringify(featuresArray));

      // Add specifications
      const specifications = {};
      editSpecsFields.forEach(field => {
        if (field.key?.trim() && field.value !== undefined && field.value !== null && field.value.trim()) {
          specifications[field.key.trim()] = field.value.trim();
        }
      });
      formData.append('specifications', JSON.stringify(specifications));

      // Add cover photo
      if (editCoverPhoto) {
        formData.append('coverPhoto', editCoverPhoto);
      }

      // Add additional images
      editImages.forEach((image) => {
        formData.append('images', image);
      });

      // Add image removal flags
      if (removeCoverPhoto) {
        formData.append('removeCoverPhoto', 'true');
      }

      if (imagesToRemove.length > 0) {
        formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update product';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setEditSuccess('Product updated successfully!');
      setProduct(result.product || result);
      setIsEditMode(false);

      // Reset edit states
      setEditCoverPhoto(null);
      setEditImages([]);
      setRemoveCoverPhoto(false);
      setImagesToRemove([]);

      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating product:', err);
      setEditError(err.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  // Utility functions
  const getSpecificationsEntries = () => {
    try {
      const specs = product?.specifications;
      console.log('getSpecificationsEntries - Raw specifications:', JSON.stringify(specs, null, 2));
      console.log('getSpecificationsEntries - Type:', typeof specs);

      if (!specs) {
        console.warn('getSpecificationsEntries - Specifications is null or undefined');
        return [];
      }

      if (typeof specs === 'string') {
        console.warn('getSpecificationsEntries - Specifications is a string, attempting to parse:', specs);
        try {
          const parsedSpecs = JSON.parse(specs);
          if (typeof parsedSpecs === 'object' && !Array.isArray(parsedSpecs) && parsedSpecs !== null) {
            const entries = Object.entries(parsedSpecs)
              .filter(([key, value]) => typeof key === 'string' && value !== undefined && value !== null && value !== '')
              .map(([key, value]) => [key, String(value)]);
            console.log('getSpecificationsEntries - Parsed object entries:', entries);
            return entries;
          } else if (Array.isArray(parsedSpecs)) {
            const entries = parsedSpecs
              .filter(item => item && typeof item === 'object' && 'key' in item && 'value' in item && typeof item.key === 'string' && item.value !== undefined && item.value !== null && item.value !== '')
              .map(item => [item.key, String(item.value)]);
            console.log('getSpecificationsEntries - Parsed array entries:', entries);
            return entries;
          } else {
            console.warn('getSpecificationsEntries - Parsed specifications is neither an object nor an array:', parsedSpecs);
            return [];
          }
        } catch (parseErr) {
          console.error('getSpecificationsEntries - Failed to parse specifications string:', parseErr, 'Raw string:', specs);
          return [];
        }
      } else if (typeof specs === 'object' && !Array.isArray(specs) && specs !== null) {
        const entries = Object.entries(specs)
          .filter(([key, value]) => typeof key === 'string' && value !== undefined && value !== null && value !== '')
          .map(([key, value]) => [key, String(value)]);
        console.log('getSpecificationsEntries - Object entries:', entries);
        return entries;
      } else if (Array.isArray(specs)) {
        const entries = specs
          .filter(item => item && typeof item === 'object' && 'key' in item && 'value' in item && typeof item.key === 'string' && item.value !== undefined && item.value !== null && item.value !== '')
          .map(item => [item.key, String(item.value)]);
        console.log('getSpecificationsEntries - Array entries:', entries);
        return entries;
      } else {
        console.warn('getSpecificationsEntries - Specifications is an unexpected type:', typeof specs, specs);
        return [];
      }
    } catch (err) {
      console.error('getSpecificationsEntries - Error parsing specifications:', err);
      return [];
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const cartQuantity = getCartQuantity();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Topbar cartItems={cartItems} />
        <div className="pt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-200 h-96 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="bg-gray-200 h-8 rounded w-3/4"></div>
                  <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                  <div className="bg-gray-200 h-20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Topbar cartItems={cartItems} />
        <div className="pt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
              <Link
                to="/shop"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const specificationsEntries = getSpecificationsEntries();
  console.log('Final specifications entries:', specificationsEntries);
  const displayPrice = product.salePrice || product.price;
  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar cartItems={cartItems} />
      <div className="pt-24">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-4 text-sm">
              <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-400">/</span>
              <Link to="/shop" className="text-gray-500 hover:text-gray-700">Shop</Link>
              <span className="text-gray-400">/</span>
              {product.category && (
                <>
                  <Link
                    to={`/shop?category=${product.category._id}`}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {product.category.name}
                  </Link>
                  <span className="text-gray-400">/</span>
                </>
              )}
              <span className="text-gray-900 font-medium">{product.name}</span>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <div
                  className="relative bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in"
                  onMouseEnter={() => setImageZoom(true)}
                  onMouseLeave={() => setImageZoom(false)}
                  onMouseMove={handleImageMouseMove}
                >
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-96 object-contain transition-transform duration-200"
                    style={{
                      transform: imageZoom ? 'scale(1.5)' : 'scale(1)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    }}
                  />
                  {hasSale && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      SALE
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[product.coverPhoto, ...product.images].filter(Boolean).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      onClick={() => setSelectedImage(img)}
                      className={`w-full h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${
                        selectedImage === img ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {userRole === 'admin' && (
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {isEditMode ? 'Cancel Edit' : 'Edit Product'}
                    </button>
                  </div>
                )}

                {editError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700">{editError}</p>
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-700">{editSuccess}</p>
                  </div>
                )}

                {quoteError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700">{quoteError}</p>
                  </div>
                )}

                {quoteSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-700">{quoteSuccess}</p>
                  </div>
                )}

                {isEditMode && userRole === 'admin' ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                          <input
                            type="text"
                            name="sku"
                            value={editFormData.sku}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                          <input
                            type="number"
                            name="price"
                            value={editFormData.price}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                          <input
                            type="number"
                            name="salePrice"
                            value={editFormData.salePrice}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            name="quantity"
                            value={editFormData.quantity}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                          <input
                            type="text"
                            name="weight"
                            value={editFormData.weight}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 1 kg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                          <select
                            name="brand"
                            value={editFormData.brand}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                              <option key={brand._id} value={brand._id}>{brand.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                          <select
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category._id} value={category._id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                          <select
                            name="subCategory"
                            value={editFormData.subCategory}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Sub Category</option>
                            {subCategories.map(subCategory => (
                              <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                          <input
                            type="text"
                            name="manufacturer"
                            value={editFormData.manufacturer}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model No</label>
                          <input
                            type="text"
                            name="modelNo"
                            value={editFormData.modelNo}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditInputChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                        <input
                          type="text"
                          name="features"
                          value={editFormData.features}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Feature 1, Feature 2, Feature 3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                        {editSpecsFields.map((field, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => handleEditSpecsChange(index, 'key', e.target.value)}
                              placeholder="Specification Name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleEditSpecsChange(index, 'value', e.target.value)}
                              placeholder="Specification Value"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditSpecsField(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEditSpecsField}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                          Add Specification
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                        {product.coverPhoto && !removeCoverPhoto && !editCoverPhoto && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-600 mb-1">Current Cover Photo:</p>
                            <div className="relative inline-block">
                              <img
                                src={product.coverPhoto}
                                alt="Current Cover"
                                className="w-32 h-32 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => setRemoveCoverPhoto(true)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => coverPhotoInputRef.current.click()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            {editCoverPhoto ? 'Change Cover Photo' : 'Upload Cover Photo'}
                          </button>
                          <input
                            type="file"
                            ref={coverPhotoInputRef}
                            onChange={(e) => handleEditFileChange(e, 'cover')}
                            accept="image/*"
                            className="hidden"
                          />
                          {editCoverPhoto && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{editCoverPhoto.name}</span>
                              <button
                                type="button"
                                onClick={removeEditCoverPhoto}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
                        {product.images && product.images.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {product.images
                                .filter(img => !imagesToRemove.includes(img))
                                .map((img, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={img}
                                      alt={`Product ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-md"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeExistingImage(img)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => imagesInputRef.current.click()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Upload Additional Images
                          </button>
                          <input
                            type="file"
                            multiple
                            ref={imagesInputRef}
                            onChange={(e) => handleEditFileChange(e, 'images')}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                        {editImages.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">New Images:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {editImages.map((img, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(img)}
                                    alt={`New ${index + 1}`}
                                    className="w-20 h-20 object-cover rounded-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeEditImage(index)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {editLoading ? 'Updating...' : 'Update Product'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditMode(false)}
                          className="py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <span>Brand: {product.brand?.name}</span>
                        <span>•</span>
                        <span>SKU: {product.sku}</span>
                        {product.modelNo && (
                          <>
                            <span>•</span>
                            <span>Model: {product.modelNo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasSale && (
                        <>
                          <span className="text-xl text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                            Save {formatPrice(product.price - product.salePrice)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="border-t border-b border-gray-200 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Status:</span>
                        <span className={`text-sm font-semibold ${
                          product.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="prose prose-sm text-gray-600">
                      <p>{product.description}</p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center space-x-4">
                        {product.quantity > 0 && (
                          <>
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                -
                              </button>
                              <span className="px-4 py-2 border-l border-r border-gray-300 min-w-12 text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={addToCart}
                              className="flex-1 py-3 px-6 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              Add to Cart
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleRequestQuote}
                          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Request Quote
                        </button>
                      </div>

                      {cartQuantity > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-800">
                              {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'} in cart
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateCartQuantity(product._id, cartQuantity - 1)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                -
                              </button>
                              <button
                                onClick={() => updateCartQuantity(product._id, cartQuantity + 1)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200">
              <div className="max-w-4xl mx-auto">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {['description', 'specification'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                          activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab === 'specification' ? 'Specifications' : tab}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="py-8">
                  {activeTab === 'description' && (
                    <div className="prose prose-lg max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>
                  )}

                  {activeTab === 'specification' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold">Technical Specifications</h3>
                      {specificationsEntries.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <tbody className="divide-y divide-gray-200">
                              {specificationsEntries.map(([key, value], index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-600">
                                    {value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No specifications available.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
                <Link
                  to={`/shop?category=${product.category?._id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                      <img
                        src={relatedProduct.coverPhoto || relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(relatedProduct.salePrice || relatedProduct.price)}
                        </span>
                        <button
                          onClick={() => navigate(`/product/${relatedProduct._id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;