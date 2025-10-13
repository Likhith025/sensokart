import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', message: '', quantity: 1 });
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
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
    sku: ''
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

  // Add new options states
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

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

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for brands:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for categories:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
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
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for subcategories:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      const data = await response.json();
      setSubCategories(data);
    } catch (err) {
      console.error('Failed to fetch subcategories:', err);
    }
  };

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching product:', `${API_BASE_URL}/products/${id}`);
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response for product:', text.slice(0, 100));
          throw new Error('Invalid response from server');
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product');
        }
        setProduct(data);
        setSelectedImage(data.coverPhoto || data.images[0] || '');
        setEditFormData({
          name: data.name,
          description: data.description,
          price: data.price,
          salePrice: data.salePrice || '',
          brand: data.brand?._id || '',
          category: data.category?._id || '',
          subCategory: data.subCategory?._id || '',
          quantity: data.quantity,
          features: data.features.join(', '),
          sku: data.sku
        });
        let specs = [];
        try {
          const specsData = data.specifications;
          if (specsData && typeof specsData === 'object' && !Array.isArray(specsData)) {
            specs = Object.entries(specsData).map(([key, value]) => ({ key, value }));
          } else if (Array.isArray(specsData)) {
            specs = specsData
              .filter(item => item && typeof item === 'object' && 'key' in item && 'value' in item)
              .map(item => ({ key: item.key, value: item.value }));
          } else if (typeof specsData === 'string') {
            try {
              const parsed = JSON.parse(specsData);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                specs = Object.entries(parsed).map(([key, value]) => ({ key, value }));
              }
            } catch {
              console.warn('Specifications string could not be parsed');
            }
          }
          if (!specs.length) {
            specs = [{ key: '', value: '' }];
          }
        } catch (specErr) {
          console.error('Error parsing specifications:', specErr);
          specs = [{ key: '', value: '' }];
        }
        setEditSpecsFields(specs);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch enquiries for admin
  useEffect(() => {
    if (userRole === 'admin' && token) {
      const fetchEnquiries = async () => {
        try {
          console.log('Fetching enquiries:', `${API_BASE_URL}/enquiry`);
          const response = await fetch(`${API_BASE_URL}/enquiry`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response for enquiries:', text.slice(0, 100));
            throw new Error('Invalid response from server');
          }
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch enquiries');
          }
          const data = await response.json();
          setEnquiries(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error fetching enquiries:', err);
          setError(err.message || 'Failed to load enquiries.');
        }
      };
      fetchEnquiries();
    }
  }, [userRole, token]);

  // Fetch dropdown data when edit mode is enabled
  useEffect(() => {
    if (isEditMode && userRole === 'admin') {
      fetchBrands();
      fetchCategories();
      fetchSubCategories(editFormData.category);
    }
  }, [isEditMode, userRole, editFormData.category]);

  // Handle enquiry form input changes
  const handleEnquiryFormChange = (e) => {
    setEnquiryForm({ ...enquiryForm, [e.target.name]: e.target.value });
  };

  // Handle enquiry form submission
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    try {
      setEnquiryError('');
      setEnquirySuccess('');
      console.log('Submitting enquiry:', `${API_BASE_URL}/enquiry`, 'Payload:', { ...enquiryForm, product: id, quantity });
      const response = await fetch(`${API_BASE_URL}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...enquiryForm, product: id, quantity }),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for enquiry submission:', text.slice(0, 100));
        throw new Error('Server returned an unexpected response');
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit enquiry');
      }
      const data = await response.json();
      setEnquirySuccess(data.message || 'Your enquiry has been sent successfully!');
      setEnquiryForm({ name: '', email: '', phone: '', message: '', quantity: 1 });
      setTimeout(() => setEnquirySuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting enquiry:', err);
      setEnquiryError(err.message || 'Failed to send enquiry. Please try again.');
    }
  };

  // Fetch single enquiry by ID
  const handleViewEnquiry = async (enquiryId) => {
    try {
      setError('');
      console.log('Fetching enquiry:', `${API_BASE_URL}/enquiry/${enquiryId}`);
      const response = await fetch(`${API_BASE_URL}/enquiry/${enquiryId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for enquiry:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch enquiry details');
      }
      const data = await response.json();
      setSelectedEnquiry(data);
    } catch (err) {
      console.error('Error fetching enquiry:', err);
      setError(err.message || 'Failed to load enquiry details.');
    }
  };

  // Update enquiry status
  const handleUpdateEnquiryStatus = async (enquiryId, status) => {
    try {
      setError('');
      console.log('Updating enquiry status:', `${API_BASE_URL}/enquiry/${enquiryId}/status`, 'Status:', status);
      const response = await fetch(`${API_BASE_URL}/enquiry/${enquiryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for enquiry status update:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update enquiry status');
      }
      setEnquiries(enquiries.map((e) => (e._id === enquiryId ? { ...e, status } : e)));
      setSelectedEnquiry(null);
      setEditSuccess('Enquiry status updated successfully!');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating enquiry status:', err);
      setError(err.message || 'Failed to update status.');
    }
  };

  // Delete enquiry
  const handleDeleteEnquiry = async (enquiryId) => {
    try {
      setError('');
      console.log('Deleting enquiry:', `${API_BASE_URL}/enquiry/${enquiryId}`);
      const response = await fetch(`${API_BASE_URL}/enquiry/${enquiryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for enquiry delete:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete enquiry');
      }
      setEnquiries(enquiries.filter((e) => e._id !== enquiryId));
      setSelectedEnquiry(null);
      setEditSuccess('Enquiry deleted successfully!');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting enquiry:', err);
      setError(err.message || 'Failed to delete enquiry.');
    }
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
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

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/brand/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBrandName })
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for add brand:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBrands([...brands, data.brand]);
      setEditFormData({ ...editFormData, brand: data.brand._id });
      setNewBrandName('');
      setShowAddBrand(false);
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/category/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for add category:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories([...categories, data.category]);
      setEditFormData({ ...editFormData, category: data.category._id });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim() || !editFormData.category) return;
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSubCategoryName, category: editFormData.category })
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for add subcategory:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubCategories([...subCategories, data.subCategory]);
      setEditFormData({ ...editFormData, subCategory: data.subCategory._id });
      setNewSubCategoryName('');
      setShowAddSubCategory(false);
    } catch (err) {
      setEditError(err.message);
    }
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

      // Validate required fields
      if (!editFormData.name || !editFormData.price || !editFormData.quantity || !editFormData.sku ||
          !editFormData.brand || !editFormData.category || !editFormData.subCategory) {
        throw new Error('Required fields are missing');
      }

      // Prepare JSON payload
      const payload = {
        ...editFormData,
        features: editFormData.features
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        specifications: editSpecsFields.reduce((obj, field) => {
          if (field.key.trim() && field.value.trim()) {
            obj[field.key.trim()] = field.value.trim();
          }
          return obj;
        }, {}),
        removeCoverPhoto: removeCoverPhoto,
        removeImages: imagesToRemove,
        // Note: coverPhoto and images are not included as JSON cannot handle files directly
        // If backend expects file URLs or base64, add them here (requires additional logic)
      };

      console.log('Updating product:', `${API_BASE_URL}/products/${id}`, 'Payload:', payload);
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for product update:', text.slice(0, 100));
        throw new Error('Invalid response from server');
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      // Update product state with server response
      setEditSuccess('Product updated successfully!');
      setProduct({
        ...product,
        ...result,
        coverPhoto: removeCoverPhoto ? '' : result.coverPhoto || product.coverPhoto,
        images: result.images || product.images.filter((img) => !imagesToRemove.includes(img)),
      });

      setIsEditMode(false);
      setRemoveCoverPhoto(false);
      setImagesToRemove([]);
      setEditCoverPhoto(null);
      setEditImages([]);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating product:', err);
      setEditError(err.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Topbar cartItems={cartItems} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          <p className="ml-4 text-lg text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Topbar cartItems={cartItems} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
          <p className="text-red-500">{error || 'Product not found.'}</p>
          <Link to="/" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const cartQuantity = getCartQuantity();

  const getSpecificationsEntries = () => {
    try {
      const specs = product.specifications;
      if (!specs || specs === null || typeof specs === 'undefined') return [];

      // Handle object format
      if (typeof specs === 'object' && !Array.isArray(specs)) {
        return Object.entries(specs).filter(([key, value]) => typeof key === 'string' && value !== undefined);
      }

      // Handle array format
      if (Array.isArray(specs)) {
        return specs
          .filter(item => item && typeof item === 'object' && 'key' in item && 'value' in item)
          .map(item => [item.key, item.value]);
      }

      // Handle string format (JSON)
      if (typeof specs === 'string') {
        try {
          const parsed = JSON.parse(specs);
          if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
            return Object.entries(parsed).filter(([key, value]) => typeof key === 'string' && value !== undefined);
          }
        } catch {
          console.warn('⚠️ Specifications string could not be parsed:', specs);
        }
      }

      console.warn('⚠️ Invalid specifications format:', specs);
      return [];
    } catch (err) {
      console.error('Error parsing specifications for display:', err);
      return [];
    }
  };

  const specificationsEntries = getSpecificationsEntries();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="mb-4">
              <img src={selectedImage} alt={product.name} className="w-full h-96 object-cover rounded-lg shadow-md" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[product.coverPhoto, ...product.images].filter(Boolean).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`w-full h-20 object-cover rounded-md cursor-pointer transition-opacity duration-200 ${selectedImage === img ? 'opacity-100 border-2 border-blue-500' : 'opacity-75 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            {userRole === 'admin' && (
              <div className="mb-4 text-right">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                >
                  {isEditMode ? 'Cancel Edit' : 'Edit Product'}
                </button>
              </div>
            )}
            {editError && <p className="text-red-500 mb-4">{editError}</p>}
            {editSuccess && <p className="text-green-500 mb-4">{editSuccess}</p>}
            {isEditMode && userRole === 'admin' ? (
              <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <input name="name" value={editFormData.name} onChange={handleEditInputChange} placeholder="Name" required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <textarea name="description" value={editFormData.description} onChange={handleEditInputChange} placeholder="Description" required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
                  <input name="price" type="number" value={editFormData.price} onChange={handleEditInputChange} placeholder="Price" required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input name="salePrice" type="number" value={editFormData.salePrice} onChange={handleEditInputChange} placeholder="Sale Price (optional)" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <select name="brand" value={editFormData.brand} onChange={handleEditInputChange} required className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Brand</option>
                        {brands.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setShowAddBrand(!showAddBrand)} className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                        +
                      </button>
                    </div>
                    {showAddBrand && (
                      <div className="mt-2 flex space-x-2">
                        <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="New Brand Name" className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="button" onClick={handleAddBrand} className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <select name="category" value={editFormData.category} onChange={handleEditInputChange} required className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                        +
                      </button>
                    </div>
                    {showAddCategory && (
                      <div className="mt-2 flex space-x-2">
                        <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New Category Name" className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="button" onClick={handleAddCategory} className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <select name="subCategory" value={editFormData.subCategory} onChange={handleEditInputChange} required className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Subcategory</option>
                        {subCategories.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setShowAddSubCategory(!showAddSubCategory)} className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                        +
                      </button>
                    </div>
                    {showAddSubCategory && (
                      <div className="mt-2 flex space-x-2">
                        <input value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="New Subcategory Name" className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="button" onClick={handleAddSubCategory} className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  <input name="quantity" type="number" value={editFormData.quantity} onChange={handleEditInputChange} placeholder="Quantity" required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input name="features" value={editFormData.features} onChange={handleEditInputChange} placeholder="Features (comma separated)" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                    {editSpecsFields.map((field, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          value={field.key}
                          onChange={(e) => handleEditSpecsChange(index, 'key', e.target.value)}
                          placeholder="Key"
                          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          value={field.value}
                          onChange={(e) => handleEditSpecsChange(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={() => removeEditSpecsField(index)} className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                          X
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addEditSpecsField} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                      Add Field
                    </button>
                  </div>
                  <input name="sku" value={editFormData.sku} onChange={handleEditInputChange} placeholder="SKU" required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Cover Photo</label>
                    {product.coverPhoto && !removeCoverPhoto && !editCoverPhoto && (
                      <div className="mt-2 relative">
                        <img
                          src={product.coverPhoto}
                          alt="Current Cover"
                          className="w-32 h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setRemoveCoverPhoto(true)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                        >
                          X
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Cover Photo</label>
                    <button
                      type="button"
                      onClick={() => coverPhotoInputRef.current.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                    >
                      Choose Cover Photo
                    </button>
                    <input
                      type="file"
                      ref={coverPhotoInputRef}
                      onChange={(e) => handleEditFileChange(e, 'cover')}
                      accept="image/*"
                      className="hidden"
                    />
                    {editCoverPhoto && (
                      <div className="mt-2 relative">
                        <img
                          src={URL.createObjectURL(editCoverPhoto)}
                          alt="Cover Preview"
                          className="w-32 h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={removeEditCoverPhoto}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                        >
                          X
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Additional Images</label>
                    {product.images && product.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {product.images
                          .filter(img => !imagesToRemove.includes(img))
                          .map((img, index) => (
                            <div key={index} className="relative">
                              <img
                                src={img}
                                alt={`Image ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(img)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Additional Images</label>
                    <button
                      type="button"
                      onClick={() => imagesInputRef.current.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                    >
                      Choose Additional Images
                    </button>
                    <input
                      type="file"
                      multiple
                      ref={imagesInputRef}
                      onChange={(e) => handleEditFileChange(e, 'images')}
                      accept="image/*"
                      className="hidden"
                    />
                    {editImages.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {editImages.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Image ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditImage(index)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button type="submit" disabled={editLoading} className="flex-1 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105 hover:shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                      {editLoading ? 'Updating...' : 'Update Product'}
                    </button>
                    <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-sm text-gray-500 mb-1">Brand: {product.brand?.name}</p>
                <p className="text-sm text-gray-500 mb-1">Category: {product.category?.name}</p>
                <p className="text-sm text-gray-500 mb-4">Subcategory: {product.subCategory?.name}</p>
                <div className="flex items-center mb-4">
                  {product.salePrice ? (
                    <>
                      <span className="text-3xl font-bold text-red-600">₹{product.salePrice}</span>
                      <span className="text-lg text-gray-500 line-through ml-2">₹{product.price}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                  )}
                </div>
                <p className="text-gray-700 mb-6">{product.description}</p>
                {product.features && product.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Features</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {product.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {specificationsEntries.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                    <dl className="text-gray-600">
                      {specificationsEntries.map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-gray-200">
                          <dt className="capitalize">{key}:</dt>
                          <dd className="ml-2">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Stock: {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}</p>
                  {cartQuantity > 0 ? (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => updateCartQuantity(product._id, cartQuantity - 1)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xl font-semibold">{cartQuantity}</span>
                      <button
                        onClick={() => updateCartQuantity(product._id, cartQuantity + 1)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max={product.quantity}
                      />
                      <button
                        onClick={addToCart}
                        disabled={product.quantity === 0}
                        className={`px-6 py-2 rounded-full font-medium transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer ${
                          product.quantity > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  )}
                </div>
                {/* Enquiry Form */}
                <div className="mt-8 bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Ask About This Product</h2>
                  {enquiryError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {enquiryError}
                    </div>
                  )}
                  {enquirySuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 transition-opacity duration-500">
                      {enquirySuccess}
                    </div>
                  )}
                  <form onSubmit={handleEnquirySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={enquiryForm.name}
                        onChange={handleEnquiryFormChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        placeholder="Your Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={enquiryForm.email}
                        onChange={handleEnquiryFormChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        placeholder="Your Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={enquiryForm.phone}
                        onChange={handleEnquiryFormChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        placeholder="Your Phone (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={enquiryForm.quantity}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        name="message"
                        value={enquiryForm.message}
                        onChange={handleEnquiryFormChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-vertical"
                        rows="6"
                        placeholder="Your Message"
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                      >
                        Submit Enquiry
                      </button>
                    </div>
                  </form>
                </div>
                {/* Admin Enquiry Management */}
                {userRole === 'admin' && (
                  <div className="mt-8 bg-white shadow-xl rounded-xl p-8 border border-gray-200 transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Enquiry Submissions</h2>
                    {enquiries.length === 0 ? (
                      <p className="text-gray-500 italic">No enquiry submissions found.</p>
                    ) : (
                      <div className="space-y-4">
                        {enquiries.map((enquiry) => (
                          <div
                            key={enquiry._id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-800">{enquiry.product?.name || 'Unknown Product'}</p>
                                <p className="text-sm text-gray-600">From: {enquiry.name} ({enquiry.email})</p>
                                {enquiry.phone && <p className="text-sm text-gray-600">Phone: {enquiry.phone}</p>}
                                <p className="text-sm text-gray-600">Quantity: {enquiry.quantity}</p>
                                <p className="text-sm text-gray-600">Status: {enquiry.status || 'New'}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewEnquiry(enquiry._id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDeleteEnquiry(enquiry._id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedEnquiry && (
                      <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Enquiry Details</h3>
                        <p><strong>Product:</strong> {selectedEnquiry.product?.name || 'Unknown Product'}</p>
                        <p><strong>Name:</strong> {selectedEnquiry.name}</p>
                        <p><strong>Email:</strong> {selectedEnquiry.email}</p>
                        {selectedEnquiry.phone && <p><strong>Phone:</strong> {selectedEnquiry.phone}</p>}
                        <p><strong>Quantity:</strong> {selectedEnquiry.quantity}</p>
                        <p><strong>Message:</strong> {selectedEnquiry.message}</p>
                        <p><strong>Status:</strong> {selectedEnquiry.status || 'New'}</p>
                        {selectedEnquiry.notes && <p><strong>Notes:</strong> {selectedEnquiry.notes}</p>}
                        <p><strong>Submitted:</strong> {new Date(selectedEnquiry.createdAt).toLocaleString()}</p>
                        <div className="mt-4 flex space-x-4">
                          <select
                            value={selectedEnquiry.status || 'new'}
                            onChange={(e) => handleUpdateEnquiryStatus(selectedEnquiry._id, e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </select>
                          <button
                            onClick={() => setSelectedEnquiry(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-105"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;