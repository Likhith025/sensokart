import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Topbar from '../components/TopBar';
import API_BASE_URL from '../src';

// Fixed Rich Text Editor Component with proper line break handling
const RichTextEditor = ({ value, onChange, placeholder = "Enter description..." }) => {
  const textareaRef = React.useRef(null);

  const handleFormat = (format) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Get the display text (without HTML tags)
    const displayText = getDisplayText(value);
    const selectedText = displayText.substring(start, end);
    
    if (!selectedText) return;

    let formattedText = '';
    let newValue = '';

    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      default:
        formattedText = selectedText;
    }

    // Replace the selected text with formatted version in the HTML
    const beforeText = displayText.substring(0, start);
    const afterText = displayText.substring(end);
    
    // Convert the new text back to HTML format
    const newDisplayText = beforeText + formattedText + afterText;
    const newHtml = newDisplayText.replace(/\n/g, '<br>');
    
    onChange(newHtml);

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + formattedText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleList = (type) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const displayText = getDisplayText(value);
    
    const textBefore = displayText.substring(0, cursorPos);
    const textAfter = displayText.substring(cursorPos);
    
    let newText = '';
    if (type === 'bullet') {
      newText = textBefore + (textBefore.endsWith('\n') || !textBefore ? '' : '\n') + '• ' + textAfter;
    } else if (type === 'number') {
      newText = textBefore + (textBefore.endsWith('\n') || !textBefore ? '' : '\n') + '1. ' + textAfter;
    }
    
    // Convert back to HTML
    const newHtml = newText.replace(/\n/g, '<br>');
    onChange(newHtml);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + (type === 'bullet' ? 3 : 4);
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleTextareaChange = (e) => {
    // Convert newlines to <br> tags for proper HTML display
    const textWithBreaks = e.target.value.replace(/\n/g, '<br>');
    onChange(textWithBreaks);
  };

  // Convert HTML back to text with proper line breaks for editing
  const getDisplayText = (html) => {
    if (!html) return '';
    
    // Convert <br> tags back to newlines for editing
    return html.replace(/<br\s*\/?>/gi, '\n')
               .replace(/<\/p>/gi, '\n\n')
               .replace(/<\/div>/gi, '\n')
               .replace(/<[^>]*>/g, '')
               .replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"');
  };

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-300 bg-gray-50">
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className="px-3 py-2 rounded hover:bg-gray-200 cursor-pointer border border-gray-300 bg-white min-w-[40px]"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('italic')}
          className="px-3 py-2 rounded hover:bg-gray-200 cursor-pointer border border-gray-300 bg-white min-w-[40px]"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('underline')}
          className="px-3 py-2 rounded hover:bg-gray-200 cursor-pointer border border-gray-300 bg-white min-w-[40px]"
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <button
          type="button"
          onClick={() => handleList('bullet')}
          className="px-3 py-2 rounded hover:bg-gray-200 cursor-pointer border border-gray-300 bg-white text-sm"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => handleList('number')}
          className="px-3 py-2 rounded hover:bg-gray-200 cursor-pointer border border-gray-300 bg-white text-sm"
          title="Numbered List"
        >
          1. List
        </button>
      </div>
      
      {/* Textarea */}
      <div className="p-1">
        <textarea
          ref={textareaRef}
          value={getDisplayText(value)}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          rows="6"
          className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none text-sm md:text-base whitespace-pre-wrap"
          style={{ lineHeight: '1.6' }}
        />
      </div>
      
      {/* Preview */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <label className="text-xs text-gray-500 font-medium mb-2 block">Preview:</label>
        <div 
          className="text-sm mt-1 prose prose-sm max-w-none"
          style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </div>
    </div>
  );
};

const AddNewProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tabDescription: '',
    price: '',
    salePrice: '',
    brand: '',
    category: '',
    subCategory: '',
    quantity: '',
    features: '',
    sku: '',
    isActive: true
  });

  const [specsFields, setSpecsFields] = useState([{ key: '', value: '' }]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Refs for file inputs
  const coverPhotoInputRef = React.useRef(null);
  const imagesInputRef = React.useRef(null);
  const pdfInputRef = React.useRef(null);

  useEffect(() => {
    const savedCart = Cookies.get('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    Cookies.set('cart', JSON.stringify(cartItems), { expires: 7 });
  }, [cartItems]);

  // Redirect if not admin
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/shop');
    }
  }, [userRole, navigate]);

  // Fetch dropdown data
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.category) {
      fetchSubCategories(formData.category);
    } else {
      setSubCategories([]);
    }
  }, [formData.category]);

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

  // Form handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'category') {
      setFormData(prev => ({ ...prev, subCategory: '' }));
    }
  };

  const handleFileChange = (e, type) => {
    if (type === 'cover') {
      setCoverPhoto(e.target.files[0]);
    } else if (type === 'pdf') {
      setPdf(e.target.files[0]);
    } else {
      setImages(Array.from(e.target.files));
    }
  };

  const removeCoverPhoto = () => {
    setCoverPhoto(null);
    if (coverPhotoInputRef.current) {
      coverPhotoInputRef.current.value = '';
    }
  };

  const removePdf = () => {
    setPdf(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formDataToSend = new FormData();

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value);
        }
      });

      // Add features as array
      const featuresArray = formData.features
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (featuresArray.length > 0) {
        formDataToSend.append('features', JSON.stringify(featuresArray));
      }

      // Add specifications
      const specifications = {};
      specsFields.forEach(field => {
        if (field.key?.trim() && field.value?.trim()) {
          specifications[field.key.trim()] = field.value.trim();
        }
      });
      if (Object.keys(specifications).length > 0) {
        formDataToSend.append('specifications', JSON.stringify(specifications));
      }

      // Add files
      if (coverPhoto) formDataToSend.append('coverPhoto', coverPhoto);
      if (pdf) formDataToSend.append('pdf', pdf);
      images.forEach((image) => formDataToSend.append('images', image));

      const response = await fetch(`${API_BASE_URL}/products/add`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create product';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setSuccess('Product created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        tabDescription: '',
        price: '',
        salePrice: '',
        brand: '',
        category: '',
        subCategory: '',
        quantity: '',
        features: '',
        sku: '',
        isActive: true
      });
      setSpecsFields([{ key: '', value: '' }]);
      setCoverPhoto(null);
      setImages([]);
      setPdf(null);
      
      // Clear file inputs
      if (coverPhotoInputRef.current) coverPhotoInputRef.current.value = '';
      if (imagesInputRef.current) imagesInputRef.current.value = '';
      if (pdfInputRef.current) pdfInputRef.current.value = '';

      setTimeout(() => {
        setSuccess('');
        // Navigate to the new product page or shop
        if (result.product?._id) {
          navigate(`/shop`);
        } else {
          navigate('/shop');
        }
      }, 2000);

    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Topbar cartItems={cartItems} />
        <div className="pt-20 md:pt-32">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-8 md:pb-16 text-center">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">You don't have permission to access this page.</p>
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
              >
                Back to Shop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar cartItems={cartItems} />
      <div className="pt-16 md:pt-24">
        {/* Breadcrumb Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center space-x-1 md:space-x-2 py-3 md:py-4 text-xs md:text-sm overflow-x-auto">
              <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap">Home</button>
              <span className="text-gray-400">/</span>
              <button onClick={() => navigate('/shop')} className="text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap">Shop</button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium whitespace-nowrap">Add New Product</span>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 md:p-8">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Add New Product</h1>
                <p className="text-gray-600 mt-2 text-sm md:text-base">Fill in the details below to create a new product</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 md:p-4 mb-6">
                  <p className="text-red-700 text-sm md:text-base">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 md:p-4 mb-6">
                  <p className="text-green-700 text-sm md:text-base">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                    <input
                      type="number"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      required
                      min="0"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm md:text-base"
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
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm md:text-base"
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
                      value={formData.subCategory}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm md:text-base"
                      required
                    >
                      <option value="">Select Sub Category</option>
                      {subCategories.map(subCategory => (
                        <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descriptions with Rich Text Editors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({...formData, description: value})}
                    placeholder="Enter main product description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tab Description (Sub Description)</label>
                  <RichTextEditor
                    value={formData.tabDescription}
                    onChange={(value) => setFormData({...formData, tabDescription: value})}
                    placeholder="Enter detailed description for the tab section..."
                  />
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                  <input
                    type="text"
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                    placeholder="Feature 1, Feature 2, Feature 3"
                  />
                </div>

                {/* Specifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                  {specsFields.map((field, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-2 mb-2">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => handleSpecsChange(index, 'key', e.target.value)}
                        placeholder="Specification Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleSpecsChange(index, 'value', e.target.value)}
                        placeholder="Specification Value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecsField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSpecsField}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
                  >
                    Add Specification
                  </button>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Cover Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo *</label>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => coverPhotoInputRef.current.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm md:text-base"
                      >
                        {coverPhoto ? 'Change Cover Photo' : 'Upload Cover Photo'}
                      </button>
                      <input
                        type="file"
                        ref={coverPhotoInputRef}
                        onChange={(e) => handleFileChange(e, 'cover')}
                        accept="image/*"
                        className="hidden"
                        required={!coverPhoto}
                      />
                      {coverPhoto && (
                        <div className="flex items-center gap-2 mt-2">
                          <img
                            src={URL.createObjectURL(coverPhoto)}
                            alt="Cover preview"
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 truncate">{coverPhoto.name}</p>
                            <button
                              type="button"
                              onClick={removeCoverPhoto}
                              className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDF File */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product PDF</label>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm md:text-base"
                      >
                        {pdf ? 'Change PDF' : 'Upload PDF'}
                      </button>
                      <input
                        type="file"
                        ref={pdfInputRef}
                        onChange={(e) => handleFileChange(e, 'pdf')}
                        accept=".pdf"
                        className="hidden"
                      />
                      {pdf && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-600 truncate">{pdf.name}</span>
                          <button
                            type="button"
                            onClick={removePdf}
                            className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => imagesInputRef.current.click()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm md:text-base"
                    >
                      Upload Additional Images
                    </button>
                    <input
                      type="file"
                      multiple
                      ref={imagesInputRef}
                      onChange={(e) => handleFileChange(e, 'images')}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  {images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Selected Images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {images.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 cursor-pointer text-sm md:text-base font-semibold"
                  >
                    {loading ? 'Creating Product...' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-200 cursor-pointer text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewProduct;