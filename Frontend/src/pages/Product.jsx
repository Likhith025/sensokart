import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    subCategory: ''
  });
  const [filterLoading, setFilterLoading] = useState(false);
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
  const [specsFields, setSpecsFields] = useState([{ key: '', value: '' }]); // Dynamic specs
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

  useEffect(() => {
    const savedCart = Cookies.get('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    Cookies.set('cart', JSON.stringify(cartItems), { expires: 7 });
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
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

  const getCartQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  const fetchProducts = async (filterParams = {}) => {
    try {
      setFilterLoading(true);
      setError('');
      const params = new URLSearchParams(filterParams);
      const response = await fetch(`${API_BASE_URL}/products?${params}`);
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        setProducts(data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (showAddModal && userRole === 'admin') {
      fetchBrands();
      fetchCategories();
    }
  }, [showAddModal, userRole]);

  // Fetch subcategories when category changes in add form
  useEffect(() => {
    fetchSubCategories(addFormData.category);
  }, [addFormData.category]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error('Failed to search products');
        }
        setSearchResults(data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const params = {};
    if (newFilters.brand) params.brand = newFilters.brand;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.subCategory) params.subCategory = newFilters.subCategory;
    fetchProducts(params);
  };

  const displayedProducts = searchQuery ? searchResults : products;

  // Add Product Handlers
  const handleAddInputChange = (e) => {
    setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
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
      // Convert specs fields to object and append
      const specsObj = specsFields.reduce((obj, field) => {
        if (field.key.trim()) obj[field.key.trim()] = field.value.trim();
        return obj;
      }, {});
      data.append('specifications', JSON.stringify(specsObj));
      // Features
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
        fetchProducts(); // Refresh products
_resize_if_too_big
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Topbar cartItems={cartItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Search Bar */}
        <div className="text-center mb-12">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search products by name, description, or SKU..."
              className="w-full p-4 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Add Product Button */}
        {userRole === 'admin' && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Add New Product
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 bg-white shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {[...new Set(products.map(p => p.brand?.name))].filter(Boolean).map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {[...new Set(products.map(p => p.category?.name))].filter(Boolean).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={filters.subCategory}
                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subcategories</option>
                {[...new Set(products.map(p => p.subCategory?.name))].filter(Boolean).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
            <p>You have {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s) in your cart.</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading || filterLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="ml-4 text-lg text-gray-600">Loading products...</p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.length > 0 ? (
              displayedProducts.map((product) => {
                const cartQuantity = getCartQuantity(product._id);
                return (
                  <Link to={`/product/${product._id}`} key={product._id} className="bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl block">
                    <div className="relative">
                      {product.coverPhoto ? (
                        <img src={product.coverPhoto} alt={product.name} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                      {product.salePrice && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">Brand: {product.brand?.name}</p>
                      <p className="text-xs text-gray-500 mb-1">Category: {product.category?.name}</p>
                      <p className="text-xs text-gray-500 mb-2">Subcategory: {product.subCategory?.name}</p>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {product.salePrice ? (
                            <>
                              <span className="text-xl font-bold text-red-600">₹{product.salePrice}</span>
                              <span className="text-sm text-gray-500 line-through ml-2">₹{product.price}</span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                          )}
                        </div>
                        {product.quantity > 0 ? (
                          <span className="text-xs text-green-600">In Stock</span>
                        ) : (
                          <span className="text-xs text-red-600">Out of Stock</span>
                        )}
                      </div>
                      {cartQuantity > 0 ? (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              updateCartQuantity(product._id, cartQuantity - 1);
                            }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 font-semibold">{cartQuantity}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              updateCartQuantity(product._id, cartQuantity + 1);
                            }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                          }}
                          disabled={product.quantity === 0}
                          className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 cursor-pointer ${
                            product.quantity > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="col-span-full text-center text-gray-500">No products found.</p>
            )}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
            {addError && <p className="text-red-500 mb-4">{addError}</p>}
            {addSuccess && <p className="text-green-500 mb-4">{addSuccess}</p>}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input name="name" value={addFormData.name} onChange={handleAddInputChange} placeholder="Name" required className="w-full p-2 border rounded" />
              <textarea name="description" value={addFormData.description} onChange={handleAddInputChange} placeholder="Description" required className="w-full p-2 border rounded" rows="3" />
              <input name="price" type="number" value={addFormData.price} onChange={handleAddInputChange} placeholder="Price" required className="w-full p-2 border rounded" />
              <input name="salePrice" type="number" value={addFormData.salePrice} onChange={handleAddInputChange} placeholder="Sale Price (optional)" className="w-full p-2 border rounded" />
              
              {/* Brand Dropdown with Add */}
              <div>
                <div className="flex items-center space-x-2">
                  <select name="brand" value={addFormData.brand} onChange={handleAddInputChange} required className="flex-1 p-2 border rounded">
                    <option value="">Select Brand</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddBrand(!showAddBrand)} className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddBrand && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="New Brand Name" className="flex-1 p-2 border rounded" />
                    <button type="button" onClick={handleAddBrand} className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Category Dropdown with Add */}
              <div>
                <div className="flex items-center space-x-2">
                  <select name="category" value={addFormData.category} onChange={handleAddInputChange} required className="flex-1 p-2 border rounded">
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddCategory && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New Category Name" className="flex-1 p-2 border rounded" />
                    <button type="button" onClick={handleAddCategory} className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Subcategory Dropdown with Add */}
              <div>
                <div className="flex items-center space-x-2">
                  <select name="subCategory" value={addFormData.subCategory} onChange={handleAddInputChange} required className="flex-1 p-2 border rounded">
                    <option value="">Select Subcategory</option>
                    {subCategories.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddSubCategory(!showAddSubCategory)} className="px-2 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    +
                  </button>
                </div>
                {showAddSubCategory && (
                  <div className="mt-2 flex space-x-2">
                    <input value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="New Subcategory Name" className="flex-1 p-2 border rounded" />
                    <button type="button" onClick={handleAddSubCategory} className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                )}
              </div>

              <input name="quantity" type="number" value={addFormData.quantity} onChange={handleAddInputChange} placeholder="Quantity" required className="w-full p-2 border rounded" />
              <input name="features" value={addFormData.features} onChange={handleAddInputChange} placeholder="Features (comma separated)" className="w-full p-2 border rounded" />
              
              {/* Specifications Key-Value Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                {specsFields.map((field, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      value={field.key}
                      onChange={(e) => handleSpecsChange(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1 p-2 border rounded"
                    />
                    <input
                      value={field.value}
                      onChange={(e) => handleSpecsChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 p-2 border rounded"
                    />
                    <button type="button" onClick={() => removeSpecsField(index)} className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                      X
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSpecsField} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                  Add Field
                </button>
              </div>

              <input name="sku" value={addFormData.sku} onChange={handleAddInputChange} placeholder="SKU" required className="w-full p-2 border rounded" />
              <input type="file" onChange={(e) => handleAddFileChange(e, 'cover')} accept="image/*" className="w-full p-2" />
              <input type="file" multiple onChange={(e) => handleAddFileChange(e, 'images')} accept="image/*" className="w-full p-2" />
              <div className="flex space-x-4">
                <button type="submit" disabled={addLoading} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {addLoading ? 'Adding...' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
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

export default Product;