import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';
import { useCart } from '../context/CartContext';

const Home = () => {
  const { cartItems, addToCart, updateQuantity, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');

  // Add Product Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
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
  const [specsFields, setSpecsFields] = useState([{ key: '', value: '' }]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [images, setImages] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

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

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/products?sortBy=createdAt&sortOrder=desc&limit=12`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || data);
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
  }, []);

  // Fetch all brands, categories for the add product modal
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Failed to fetch brands');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories');
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
      console.error('Failed to fetch subcategories');
    }
  };

  // Add Product Handlers
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData({ ...addFormData, [name]: value });
    
    if (name === 'category') {
      fetchSubCategories(value);
    }
  };

  const handleAddFileChange = (e, type) => {
    if (type === 'cover') {
      setCoverPhoto(e.target.files[0]);
    } else {
      setImages(Array.from(e.target.files));
    }
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBrands([...brands, data.brand]);
      setAddFormData({ ...addFormData, brand: data.brand._id });
      setNewBrandName('');
      setShowAddBrand(false);
    } catch (err) {
      setAddError(err.message);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories([...categories, data.category]);
      setAddFormData({ ...addFormData, category: data.category._id });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim() || !addFormData.category) return;
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSubCategoryName, category: addFormData.category })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubCategories([...subCategories, data.subCategory]);
      setAddFormData({ ...addFormData, subCategory: data.subCategory._id });
      setNewSubCategoryName('');
      setShowAddSubCategory(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleSpecsChange = (index, field, value) => {
    const newFields = [...specsFields];
    newFields[index][field] = value;
    setSpecsFields(newFields);
  };

  const addSpecsField = () => {
    setSpecsFields([...specsFields, { key: '', value: '' }]);
  };

  const removeSpecsField = (index) => {
    setSpecsFields(specsFields.filter((_, i) => i !== index));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (addLoading) return;
    try {
      setAddLoading(true);
      setAddError('');
      setAddSuccess('');
      const data = new FormData();
      Object.keys(addFormData).forEach(key => {
        data.append(key, addFormData[key]);
      });
      
      const specsObj = specsFields.reduce((obj, field) => {
        if (field.key.trim()) obj[field.key.trim()] = field.value.trim();
        return obj;
      }, {});
      data.append('specifications', JSON.stringify(specsObj));
      
      data.append('features', JSON.stringify(addFormData.features.split(',').map(item => item.trim()).filter(Boolean)));
      if (coverPhoto) data.append('coverPhoto', coverPhoto);
      images.forEach(img => data.append('images', img));

      const response = await fetch(`${API_BASE_URL}/products/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add product');
      setAddSuccess('Product added successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        fetchProducts();
        setAddFormData({
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
        setSpecsFields([{ key: '', value: '' }]);
        setCoverPhoto(null);
        setImages([]);
      }, 2000);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to Sensokart
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover precision measurement and testing solutions for all your industrial, laboratory, and commercial needs.
            </p>
          </div>

          {userRole === 'admin' && (
            <div className="text-center mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Add New Product
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {totalItems > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
              <p className="font-medium">
                You have {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart.
                <Link to="/cart" className="ml-2 text-blue-600 hover:text-blue-800 underline">
                  View Cart
                </Link>
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Top Products</h2>
            <p className="text-gray-600 mt-2">Discover our latest and most popular products</p>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              <p className="ml-4 text-lg text-gray-600">Loading products...</p>
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map((product) => {
                  const cartQuantity = getCartQuantity(product._id);
                  return (
                    <div 
                      key={product._id} 
                      className="bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <Link to={`/product/${product._id}`} className="block">
                        <div className="relative">
                          {product.coverPhoto ? (
                            <img 
                              src={product.coverPhoto} 
                              alt={product.name} 
                              className="w-full h-48 object-cover" 
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">No Image</span>
                            </div>
                          )}
                          {product.salePrice && product.salePrice < product.price && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                              Sale
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">
                            Brand: {product.brand?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            Category: {product.category?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            Subcategory: {product.subCategory?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              {product.salePrice && product.salePrice < product.price ? (
                                <>
                                  <span className="text-xl font-bold text-red-600">
                                    ₹{product.salePrice}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ₹{product.price}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-gray-900">
                                  ₹{product.price}
                                </span>
                              )}
                            </div>
                            {product.quantity > 0 ? (
                              <span className="text-xs text-green-600 font-medium">In Stock</span>
                            ) : (
                              <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                            )}
                          </div>
                        </div>
                      </Link>
                      
                      <div className="px-4 pb-4">
                        {cartQuantity > 0 ? (
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <button
                              onClick={() => updateQuantity(product._id, cartQuantity - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 font-semibold text-gray-800">
                              {cartQuantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product._id, cartQuantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.quantity === 0}
                            className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                              product.quantity > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">No products found</div>
                  <button
                    onClick={fetchProducts}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Product</h2>
            
            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {addSuccess}
              </div>
            )}
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  name="name" 
                  value={addFormData.name} 
                  onChange={handleAddInputChange} 
                  placeholder="Product Name" 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  name="sku" 
                  value={addFormData.sku} 
                  onChange={handleAddInputChange} 
                  placeholder="SKU" 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <textarea 
                name="description" 
                value={addFormData.description} 
                onChange={handleAddInputChange} 
                placeholder="Description" 
                required 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  name="price" 
                  type="number" 
                  value={addFormData.price} 
                  onChange={handleAddInputChange} 
                  placeholder="Price" 
                  required 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  name="salePrice" 
                  type="number" 
                  value={addFormData.salePrice} 
                  onChange={handleAddInputChange} 
                  placeholder="Sale Price (optional)" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <select name="brand" value={addFormData.brand} onChange={handleAddInputChange} required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Brand</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddBrand(!showAddBrand)} className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddBrand && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="New Brand Name" className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddBrand} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <select name="category" value={addFormData.category} onChange={handleAddInputChange} required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddCategory && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New Category Name" className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddCategory} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <select name="subCategory" value={addFormData.subCategory} onChange={handleAddInputChange} required className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Subcategory</option>
                    {subCategories.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddSubCategory(!showAddSubCategory)} className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddSubCategory && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="New Subcategory Name" className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddSubCategory} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              <input name="quantity" type="number" value={addFormData.quantity} onChange={handleAddInputChange} placeholder="Quantity" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="features" value={addFormData.features} onChange={handleAddInputChange} placeholder="Features (comma separated)" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                {specsFields.map((field, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      value={field.key}
                      onChange={(e) => handleSpecsChange(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={field.value}
                      onChange={(e) => handleSpecsChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => removeSpecsField(index)} className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      X
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSpecsField} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Add Field
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                <input type="file" onChange={(e) => handleAddFileChange(e, 'cover')} accept="image/*" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
                <input type="file" multiple onChange={(e) => handleAddFileChange(e, 'images')} accept="image/*" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="submit" 
                  disabled={addLoading}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {addLoading ? 'Adding Product...' : 'Add Product'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;