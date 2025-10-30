import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const userRole = Cookies.get('userRole')?.toLowerCase() || 'user';
  const token = Cookies.get('authToken');

  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
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
    manufacturer: '',
    modelNo: '',
    measuringParameters: ''
  });
  const [editSpecsFields, setEditSpecsFields] = useState([{ key: '', value: '' }]);
  const [editCoverPhoto, setEditCoverPhoto] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [editPdf, setEditPdf] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [removeCoverPhoto, setRemoveCoverPhoto] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  const [imagesToRemove, setImagesToRemove] = useState([]);

  // Preview States
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    name: '',
    description: '',
    tabDescription: '',
    price: '',
    salePrice: '',
    brand: '',
    category: '',
    subCategory: '',
    quantity: '',
    features: [],
    specifications: {},
    coverPhoto: null,
    images: []
  });

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

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data);
        setSelectedImage(data.coverPhoto || data.images?.[0] || '');

        // Set edit form data
        setEditFormData({
          name: data.name || '',
          description: data.description || '',
          tabDescription: data.tabDescription || '',
          price: data.price || '',
          salePrice: data.salePrice || '',
          brand: data.brand?._id || '',
          category: data.category?._id || '',
          subCategory: data.subCategory?._id || '',
          quantity: data.quantity || '',
          features: data.features?.join(', ') || '',
          sku: data.sku || '',
          manufacturer: data.manufacturer || '',
          modelNo: data.modelNo || '',
          measuringParameters: data.measuringParameters || ''
        });

        // Parse specifications
        let specs = [];
        try {
          const specsData = data.specifications;
          if (specsData && typeof specsData === 'object' && !Array.isArray(specsData)) {
            specs = Object.entries(specsData)
              .filter(([key, value]) => key && value)
              .map(([key, value]) => ({ key, value: String(value) }));
          }
          if (!specs.length) {
            specs = [{ key: '', value: '' }];
          }
        } catch (specErr) {
          console.error('Error parsing specifications:', specErr);
          specs = [{ key: '', value: '' }];
        }
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

  const downloadPdf = async () => {
    if (!product.pdf) return;

    try {
      setDownloadLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/${id}/download-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = product.pdfOriginalName || `${product.name.replace(/\s+/g, '_')}_brochure.pdf`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      alert('Download failed. Please try again later.');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Edit functionality
  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    if (e.target.name === 'category') {
      fetchSubCategories(e.target.value);
    }
  };

  const handleEditFileChange = (e, type) => {
    if (type === 'cover') {
      setEditCoverPhoto(e.target.files[0]);
      setRemoveCoverPhoto(false);
    } else if (type === 'pdf') {
      setEditPdf(e.target.files[0]);
      setRemovePdf(false);
    } else {
      setEditImages(Array.from(e.target.files));
    }
  };

  const removeEditCoverPhoto = () => {
    setEditCoverPhoto(null);
    setRemoveCoverPhoto(true);
  };

  const removeEditPdf = () => {
    setEditPdf(null);
    setRemovePdf(true);
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

  // Preview functionality
  const generatePreview = () => {
    const specifications = {};
    editSpecsFields.forEach(field => {
      if (field.key?.trim() && field.value?.trim()) {
        specifications[field.key.trim()] = field.value.trim();
      }
    });

    const featuresArray = editFormData.features
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const brandName = brands.find(b => b._id === editFormData.brand)?.name || '';
    const categoryName = categories.find(c => c._id === editFormData.category)?.name || '';
    const subCategoryName = subCategories.find(s => s._id === editFormData.subCategory)?.name || '';

    setPreviewData({
      name: editFormData.name,
      description: editFormData.description,
      tabDescription: editFormData.tabDescription,
      price: editFormData.price,
      salePrice: editFormData.salePrice,
      brand: brandName,
      category: categoryName,
      subCategory: subCategoryName,
      quantity: editFormData.quantity,
      features: featuresArray,
      specifications: specifications,
      coverPhoto: editCoverPhoto ? URL.createObjectURL(editCoverPhoto) : (product.coverPhoto && !removeCoverPhoto ? product.coverPhoto : null),
      images: [
        ...(editImages.map(img => URL.createObjectURL(img))),
        ...(product.images ? product.images.filter(img => !imagesToRemove.includes(img)) : [])
      ]
    });

    setShowPreview(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editLoading) return;

    try {
      setEditLoading(true);
      setEditError('');
      setEditSuccess('');

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
        if (field.key?.trim() && field.value?.trim()) {
          specifications[field.key.trim()] = field.value.trim();
        }
      });
      formData.append('specifications', JSON.stringify(specifications));

      // Add files
      if (editCoverPhoto) formData.append('coverPhoto', editCoverPhoto);
      if (editPdf) formData.append('pdf', editPdf);
      editImages.forEach((image) => formData.append('images', image));

      // Add removal flags
      if (removeCoverPhoto) formData.append('removeCoverPhoto', 'true');
      if (removePdf) formData.append('removePdf', 'true');
      if (imagesToRemove.length > 0) {
        formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update product';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setEditSuccess('Product updated successfully!');
      setProduct(result.product || result);
      setIsEditMode(false);
      setShowPreview(false);

      // Reset edit states
      setEditCoverPhoto(null);
      setEditImages([]);
      setEditPdf(null);
      setRemoveCoverPhoto(false);
      setRemovePdf(false);
      setImagesToRemove([]);

      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating product:', err);
      setEditError(err.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const getSpecificationsEntries = () => {
    try {
      const specs = product?.specifications;
      if (!specs || typeof specs !== 'object') return [];
      
      return Object.entries(specs)
        .filter(([key, value]) => key && value)
        .map(([key, value]) => [key, String(value)]);
    } catch (err) {
      console.error('Error parsing specifications:', err);
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
        <div className="pt-20 md:pt-32">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-8 md:pb-16">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-gray-200 h-64 md:h-96 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="bg-gray-200 h-6 md:h-8 rounded w-3/4"></div>
                  <div className="bg-gray-200 h-4 md:h-6 rounded w-1/2"></div>
                  <div className="bg-gray-200 h-16 md:h-20 rounded"></div>
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
        <div className="pt-20 md:pt-32">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-8 md:pb-16 text-center">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Product Not Found</h2>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{error || 'The product you are looking for does not exist.'}</p>
              <Link
                to="/shop"
                className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
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
  const displayPrice = product.salePrice || product.price;
  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar cartItems={cartItems} />
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Product Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview Images */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewData.coverPhoto || '/placeholder-image.jpg'}
                    alt={previewData.name}
                    className="w-full h-48 object-contain"
                  />
                </div>
                {previewData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {previewData.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-16 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Details */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{previewData.name}</h1>
                  <div className="text-sm text-gray-600 space-y-1">
                    {previewData.brand && <p>Brand: {previewData.brand}</p>}
                    {previewData.category && <p>Category: {previewData.category}</p>}
                    {previewData.subCategory && <p>Subcategory: {previewData.subCategory}</p>}
                    <p>SKU: {editFormData.sku}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(previewData.price)}
                  </span>
                  {previewData.salePrice && previewData.salePrice < previewData.price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(previewData.price)}
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                        Sale
                      </span>
                    </>
                  )}
                </div>

                <div className="border-t border-b border-gray-200 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Status:</span>
                    <span className={`text-sm font-semibold ${
                      previewData.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {previewData.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: previewData.description }} />
                </div>

                {previewData.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {previewData.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(previewData.specifications).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Specifications:</h3>
                    <div className="space-y-2">
                      {Object.entries(previewData.specifications).map(([key, value], index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {editLoading ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-16 md:pt-24">
        {/* Breadcrumb Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center space-x-1 md:space-x-2 py-3 md:py-4 text-xs md:text-sm overflow-x-auto">
              <Link to="/" className="text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap">Home</Link>
              <span className="text-gray-400">/</span>
              <Link to="/shop" className="text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap">Shop</Link>
              <span className="text-gray-400">/</span>
              {product.category && (
                <>
                  <Link
                    to={`/shop?category=${product.category._id}`}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap"
                  >
                    {product.category.name}
                  </Link>
                  <span className="text-gray-400">/</span>
                </>
              )}
              <span className="text-gray-900 font-medium whitespace-nowrap truncate max-w-[120px] md:max-w-none">
                {product.name}
              </span>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-4 md:p-8">
              {/* Product Images */}
              <div className="space-y-3 md:space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-48 md:h-96 object-contain"
                  />
                  {hasSale && (
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 bg-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                      SALE
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1 md:gap-2">
                  {[product.coverPhoto, ...product.images].filter(Boolean).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      onClick={() => setSelectedImage(img)}
                      className={`w-full h-12 md:h-20 object-cover rounded-md cursor-pointer border-2 transition-all duration-200 hover:border-blue-400 hover:scale-105 ${
                        selectedImage === img ? 'border-blue-500' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="px-3 md:px-4 py-1 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer text-xs md:text-sm"
                    >
                      {isEditMode ? 'Cancel Edit' : 'Edit Product'}
                    </button>
                  )}
                </div>

                {editError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 md:p-4">
                    <p className="text-red-700 text-sm md:text-base">{editError}</p>
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 md:p-4">
                    <p className="text-green-700 text-sm md:text-base">{editSuccess}</p>
                  </div>
                )}

                {isEditMode && userRole === 'admin' ? (
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Edit Product</h2>
                      <button
                        type="button"
                        onClick={generatePreview}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 cursor-pointer text-sm"
                      >
                        Preview Changes
                      </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="space-y-4 md:space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                            required
                          />
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                          <select
                            name="brand"
                            value={editFormData.brand}
                            onChange={handleEditInputChange}
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
                            value={editFormData.category}
                            onChange={handleEditInputChange}
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
                            value={editFormData.subCategory}
                            onChange={handleEditInputChange}
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
                          value={editFormData.description}
                          onChange={(value) => setEditFormData({...editFormData, description: value})}
                          placeholder="Enter main product description..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tab Description (Sub Description)</label>
                        <RichTextEditor
                          value={editFormData.tabDescription}
                          onChange={(value) => setEditFormData({...editFormData, tabDescription: value})}
                          placeholder="Enter detailed description for the tab section..."
                        />
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                        <input
                          type="text"
                          name="features"
                          value={editFormData.features}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                          placeholder="Feature 1, Feature 2, Feature 3"
                        />
                      </div>

                      {/* Specifications */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                        {editSpecsFields.map((field, index) => (
                          <div key={index} className="flex flex-col md:flex-row gap-2 mb-2">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => handleEditSpecsChange(index, 'key', e.target.value)}
                              placeholder="Specification Name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleEditSpecsChange(index, 'value', e.target.value)}
                              placeholder="Specification Value"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text text-sm md:text-base"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditSpecsField(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEditSpecsField}
                          className="px-3 md:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
                        >
                          Add Specification
                        </button>
                      </div>

                      {/* File Uploads */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Cover Photo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                          {product.coverPhoto && !removeCoverPhoto && !editCoverPhoto && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-1">Current:</p>
                              <div className="relative inline-block">
                                <img
                                  src={product.coverPhoto}
                                  alt="Current Cover"
                                  className="w-20 h-20 object-cover rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => setRemoveCoverPhoto(true)}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-all duration-200 cursor-pointer text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => coverPhotoInputRef.current.click()}
                              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm"
                            >
                              {editCoverPhoto ? 'Change Cover' : 'Upload Cover'}
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
                                <span className="text-sm text-gray-600 truncate">{editCoverPhoto.name}</span>
                                <button
                                  type="button"
                                  onClick={removeEditCoverPhoto}
                                  className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PDF File */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Product PDF</label>
                          {product.pdf && !removePdf && !editPdf && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-1">Current:</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-blue-600">📄 {product.pdfOriginalName || 'product.pdf'}</span>
                                <button
                                  type="button"
                                  onClick={() => setRemovePdf(true)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => pdfInputRef.current.click()}
                              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm"
                            >
                              {editPdf ? 'Change PDF' : 'Upload PDF'}
                            </button>
                            <input
                              type="file"
                              ref={pdfInputRef}
                              onChange={(e) => handleEditFileChange(e, 'pdf')}
                              accept=".pdf"
                              className="hidden"
                            />
                            {editPdf && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 truncate">{editPdf.name}</span>
                                <button
                                  type="button"
                                  onClick={removeEditPdf}
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
                        {product.images && product.images.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-2">
                              {product.images
                                .filter(img => !imagesToRemove.includes(img))
                                .map((img, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={img}
                                      alt={`Product ${index + 1}`}
                                      className="w-16 h-16 object-cover rounded-md"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeExistingImage(img)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => imagesInputRef.current.click()}
                            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm"
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
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                              {editImages.map((img, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(img)}
                                    alt={`New ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeEditImage(index)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 cursor-pointer"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="py-2 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 cursor-pointer text-sm md:text-base"
                        >
                          {editLoading ? 'Updating...' : 'Update Product'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditMode(false)}
                          className="py-2 md:py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-200 cursor-pointer text-sm md:text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    <div>
                      <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                      <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4 text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                        <span>Brand: {product.brand?.name}</span>
                        <span className="hidden md:inline">•</span>
                        <span>SKU: {product.sku}</span>
                        {product.modelNo && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span>Model: {product.modelNo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4">
                      <span className="text-2xl md:text-3xl font-bold text-gray-900">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasSale && (
                        <>
                          <span className="text-lg md:text-xl text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs md:text-sm font-semibold">
                            Save {formatPrice(product.price - product.salePrice)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="border-t border-b border-gray-200 py-3 md:py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Status:</span>
                        <span className={`text-sm font-semibold ${
                          product.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="prose prose-sm text-gray-600 max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>

                    <div className="border-t border-gray-200 pt-4 md:pt-6">
                      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                        {product.quantity > 0 && (
                          <>
                            <div className="flex items-center border border-gray-300 rounded-md self-start">
                              <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-3 md:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-3 md:px-4 py-2 border-l border-r border-gray-300 min-w-8 md:min-w-12 text-center text-sm md:text-base">
                                {quantity}
                              </span>
                              <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-3 md:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={addToCart}
                              className="py-2 md:py-3 px-4 md:px-6 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base"
                            >
                              Add to Cart
                            </button>
                          </>
                        )}
                      </div>

                      {cartQuantity > 0 && (
                        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-blue-50 rounded-md">
                          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                            <span className="text-blue-800 text-sm md:text-base">
                              {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'} in cart
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateCartQuantity(product._id, cartQuantity - 1)}
                                className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded text-xs md:text-sm hover:bg-blue-700 transition-all duration-200 cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => updateCartQuantity(product._id, cartQuantity + 1)}
                                className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded text-xs md:text-sm hover:bg-blue-700 transition-all duration-200 cursor-pointer"
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

            {/* Product Tabs */}
            <div className="border-t border-gray-200">
              <div className="max-w-4xl mx-auto">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
                    {['description', 'specification', 'download'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm capitalize transition-all duration-200 cursor-pointer whitespace-nowrap ${
                          activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab === 'specification' ? 'Specifications' : 
                         tab === 'download' ? 'Downloads' : tab}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="py-4 md:py-8 px-4 md:px-0">
                  {activeTab === 'description' && (
                    <div className="prose prose-sm md:prose-lg max-w-none">
                      {product.tabDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: product.tabDescription }} />
                      ) : (
                        <p className="text-gray-500">No detailed description available.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'specification' && (
                    <div className="space-y-4 md:space-y-6">
                      <h3 className="text-lg md:text-xl font-semibold">Technical Specifications</h3>
                      {specificationsEntries.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="hidden md:block">
                            <table className="min-w-full divide-y divide-gray-200">
                              <tbody className="divide-y divide-gray-200">
                                {specificationsEntries.map(([key, value], index) => (
                                  <tr key={index} className={`hover:bg-gray-100 transition-colors duration-150 cursor-default ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}>
                                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-normal text-sm text-gray-600">
                                      {value}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="md:hidden space-y-2 p-3">
                            {specificationsEntries.map(([key, value], index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="font-medium text-gray-900 text-sm capitalize mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-gray-600 text-sm">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm md:text-base">No specifications available.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'download' && (
                    <div className="space-y-4 md:space-y-6">
                      <h3 className="text-lg md:text-xl font-semibold">Product Downloads</h3>
                      {product.pdf ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 md:space-x-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-lg md:text-xl">📄</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm md:text-base">Product Brochure</h4>
                                <p className="text-gray-600 text-xs md:text-sm">
                                  {product.pdfOriginalName || 'Product specification sheet'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={downloadPdf}
                              disabled={downloadLoading}
                              className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm md:text-base flex items-center gap-2"
                            >
                              {downloadLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Downloading...
                                </>
                              ) : (
                                'Download PDF'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                          <p className="text-gray-500 text-sm md:text-base">No downloads available for this product.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 md:mt-12">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Related Products</h2>
                <Link
                  to={`/shop?category=${product.category?._id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 cursor-pointer text-sm md:text-base"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div 
                    key={relatedProduct._id} 
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/product/${relatedProduct._id}`)}
                  >
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                      <img
                        src={relatedProduct.coverPhoto || relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        className="w-full h-32 md:h-48 object-cover"
                      />
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors duration-200 text-sm md:text-base">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-base md:text-lg font-bold text-gray-900">
                          {formatPrice(relatedProduct.salePrice || relatedProduct.price)}
                        </span>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-xs md:text-sm transition-colors duration-200 cursor-pointer">
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