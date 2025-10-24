import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import cloudinary from '../config/cloudinary.js';

// --- Helper: Cloudinary upload from memory buffer ---
const streamUpload = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder,
        transformation: [
          { width: 800, height: 800, crop: "limit", quality: "auto" },
          { format: 'webp' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// --- Helper: Safely parse JSON from form-data ---
const safeParseJSON = (value) => {
  if (!value) return undefined;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (typeof parsed === 'string') return JSON.parse(parsed);
    return parsed;
  } catch {
    return value;
  }
};

// --- Enhanced Product Controller ---
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      brand,
      category,
      subCategory,
      quantity,
      features,
      specifications,
      sku,
      weight,
      manufacturer,
      modelNo,
      measuringParameters
    } = req.body;

    console.log('📦 Form data received:', req.body);
    console.log('🖼️ Files received:', req.files);

    let coverPhotoUrl = null;
    let imageUrls = [];

    // ✅ Upload cover photo (if provided)
    if (req.files?.coverPhoto?.length > 0) {
      console.log('Uploading cover photo...');
      const coverResult = await streamUpload(
        req.files.coverPhoto[0].buffer,
        'products/cover'
      );
      coverPhotoUrl = coverResult.secure_url;
      console.log('✅ Cover photo uploaded:', coverPhotoUrl);
    }

    // ✅ Upload additional images (if provided)
    if (req.files?.images?.length > 0) {
      console.log('Uploading additional images...');
      const uploadPromises = req.files.images.map(file =>
        streamUpload(file.buffer, 'products/images')
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map(r => r.secure_url);
      console.log('✅ Additional images uploaded:', imageUrls);
    }

    // ✅ Parse features & specifications safely
    const featuresArray = safeParseJSON(features) || [];
    const specsObject = safeParseJSON(specifications) || {};

    // ✅ Create new product
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      brand,
      category,
      subCategory,
      quantity: quantity ? parseInt(quantity) : 0,
      coverPhoto: coverPhotoUrl,
      images: imageUrls,
      features: featuresArray,
      specifications: specsObject,
      sku,
      weight: weight || '1 kg',
      manufacturer,
      modelNo,
      measuringParameters
    });

    await product.save();
    await product.populate('brand category subCategory');

    console.log('✅ Product created successfully');
    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('❌ Error adding product:', error);
    if (error.http_code === 400 && error.message === 'Empty file') {
      return res.status(400).json({ error: 'Cloudinary upload failed: Empty file' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// In your products controller
export const getProducts = async (req, res) => {
  try {
    const { 
      brand, 
      category, 
      subCategory,
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;
    
    console.log('📦 Filter parameters received:', req.query);
    
    let filter = { isActive: true };
    const sortOptions = {};
    
    // Build filter object with proper ID matching
    if (brand && brand !== '') {
      console.log('Filtering by brand ID:', brand);
      filter.brand = brand;
    }
    
    if (category && category !== '') {
      console.log('Filtering by category ID:', category);
      filter.category = category;
    }
    
    if (subCategory && subCategory !== '') {
      console.log('Filtering by subCategory ID:', subCategory);
      filter.subCategory = subCategory;
    }
    
    // Price filtering - handle both price and salePrice
    if (minPrice || maxPrice) {
      filter.$or = [];
      
      const priceConditions = [];
      
      // For products with salePrice
      if (minPrice && maxPrice) {
        priceConditions.push({
          salePrice: { 
            $exists: true, 
            $ne: null,
            $gte: parseFloat(minPrice), 
            $lte: parseFloat(maxPrice) 
          }
        });
      } else if (minPrice) {
        priceConditions.push({
          salePrice: { 
            $exists: true, 
            $ne: null,
            $gte: parseFloat(minPrice) 
          }
        });
      } else if (maxPrice) {
        priceConditions.push({
          salePrice: { 
            $exists: true, 
            $ne: null,
            $lte: parseFloat(maxPrice) 
          }
        });
      }
      
      // For products without salePrice (use regular price)
      if (minPrice && maxPrice) {
        priceConditions.push({
          $and: [
            { salePrice: { $exists: false } },
            { price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } }
          ]
        });
      } else if (minPrice) {
        priceConditions.push({
          $and: [
            { salePrice: { $exists: false } },
            { price: { $gte: parseFloat(minPrice) } }
          ]
        });
      } else if (maxPrice) {
        priceConditions.push({
          $and: [
            { salePrice: { $exists: false } },
            { price: { $lte: parseFloat(maxPrice) } }
          ]
        });
      }
      
      if (priceConditions.length > 0) {
        filter.$or = priceConditions;
      }
    }

    // Sort options
    if (sortBy === 'price') {
      sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
    }

    const skip = (page - 1) * limit;
    
    console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));
    
    const products = await Product.find(filter)
      .populate('brand category subCategory')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    console.log(`✅ Found ${products.length} products out of ${total} total`);
    
    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error in getProducts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get products by category with filters
export const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { brand, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;
    
    // Find category by slug or ID
    const category = await Category.findOne({
      $or: [
        { _id: categorySlug },
        { slug: categorySlug }
      ]
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    let filter = { 
      isActive: true, 
      category: category._id 
    };
    
    if (brand) filter.brand = brand;
    
    // Price filtering
    if (minPrice || maxPrice) {
      filter.$or = [
        { 
          $and: [
            { salePrice: { $exists: true, $ne: null } },
            { salePrice: { $gte: parseFloat(minPrice || 0), $lte: parseFloat(maxPrice || 999999) } }
          ]
        },
        { 
          $and: [
            { salePrice: { $exists: false } },
            { price: { $gte: parseFloat(minPrice || 0), $lte: parseFloat(maxPrice || 999999) } }
          ]
        }
      ];
    }
    
    const sortOptions = {};
    if (sortBy === 'price_asc') sortOptions.price = 1;
    else if (sortBy === 'price_desc') sortOptions.price = -1;
    else if (sortBy === 'name') sortOptions.name = 1;
    else sortOptions.createdAt = -1;
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(filter)
      .populate('brand category subCategory')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(filter);
    const brands = await Product.distinct('brand', filter);
    const brandDetails = await Brand.find({ _id: { $in: brands } });
    
    // Get price range for filters
    const priceStats = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    res.json({
      products,
      category,
      filters: {
        brands: brandDetails,
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get related products
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('category brand');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      $or: [
        { category: product.category },
        { brand: product.brand }
      ],
      isActive: true
    })
    .populate('brand category')
    .limit(8)
    .sort({ createdAt: -1 });
    
    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID - Enhanced with related data
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('brand category subCategory');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment view count (optional)
    await Product.findByIdAndUpdate(id, { $inc: { 'ratings.count': 1 } });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product quantity
export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let newQuantity = product.quantity;

    if (operation === 'add') {
      newQuantity += parseInt(quantity);
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, newQuantity - parseInt(quantity));
    } else if (operation === 'set') {
      newQuantity = parseInt(quantity);
    } else {
      return res.status(400).json({ error: 'Invalid operation' });
    }

    product.quantity = newQuantity;
    await product.save();

    res.json({
      message: 'Quantity updated successfully',
      product: {
        id: product._id,
        name: product.name,
        quantity: product.quantity
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete images from Cloudinary
    const deletePromises = [];
    
    if (product.coverPhoto) {
      const publicId = product.coverPhoto.split('/').pop().split('.')[0];
      deletePromises.push(cloudinary.uploader.destroy(`products/cover/${publicId}`));
    }

    if (product.images.length > 0) {
      product.images.forEach(image => {
        const publicId = image.split('/').pop().split('.')[0];
        deletePromises.push(cloudinary.uploader.destroy(`products/images/${publicId}`));
      });
    }

    await Promise.all(deletePromises);
    await Product.findByIdAndDelete(id);

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search products - Enhanced
export const searchProducts = async (req, res) => {
  try {
    const { q, category, brand, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    let filter = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { 'brand.name': { $regex: q, $options: 'i' } },
        { 'category.name': { $regex: q, $options: 'i' } }
      ]
    };
    
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    
    // Price filtering
    if (minPrice || maxPrice) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 
            salePrice: { 
              $gte: parseFloat(minPrice || 0), 
              $lte: parseFloat(maxPrice || 999999) 
            } 
          },
          { 
            price: { 
              $gte: parseFloat(minPrice || 0), 
              $lte: parseFloat(maxPrice || 999999) 
            } 
          }
        ]
      });
    }
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(filter)
      .populate('brand category subCategory')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      searchQuery: q,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product with Cloudinary images - Enhanced
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    /* 🧹 CLEANUP: FEATURES & SPECIFICATIONS BEFORE SAVING */

    // --- Fix FEATURES ---
    if (updateData.features) {
      try {
        if (typeof updateData.features === 'string') {
          const parsed = JSON.parse(updateData.features);
          if (Array.isArray(parsed)) {
            updateData.features = parsed.filter(
              f => typeof f === 'string' && f.trim() !== ''
            );
          } else if (typeof parsed === 'string') {
            updateData.features = parsed
              .split(',')
              .map(f => f.trim())
              .filter(Boolean);
          } else {
            updateData.features = [];
          }
        } else if (Array.isArray(updateData.features)) {
          // Flatten and clean duplicates
          updateData.features = [
            ...new Set(
              updateData.features
                .flat(Infinity)
                .map(f => (typeof f === 'string' ? f.trim() : ''))
                .filter(Boolean)
            )
          ];
        }
      } catch {
        updateData.features = [];
      }
    }

    // --- Fix SPECIFICATIONS ---
    if (updateData.specifications) {
      try {
        if (typeof updateData.specifications === 'string') {
          updateData.specifications = JSON.parse(updateData.specifications);
        }
        if (
          typeof updateData.specifications !== 'object' ||
          Array.isArray(updateData.specifications)
        ) {
          updateData.specifications = {};
        }
      } catch {
        updateData.specifications = {};
      }
    }

    /* ---------------------------------------------------- */

    // Handle cover photo upload
    if (req.files?.coverPhoto) {
      if (product.coverPhoto) {
        const oldPublicId = product.coverPhoto.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/cover/${oldPublicId}`);
      }

      const coverResult = await streamUpload(
        req.files.coverPhoto[0].buffer,
        'products/cover'
      );
      updateData.coverPhoto = coverResult.secure_url;
    }

    // Handle additional images upload
    if (req.files?.images) {
      const imageUploadPromises = req.files.images.map(file =>
        streamUpload(file.buffer, 'products/images')
      );
      const imageResults = await Promise.all(imageUploadPromises);
      const newImageUrls = imageResults.map(result => result.secure_url);

      updateData.images = [...product.images, ...newImageUrls];
    }

    // Handle image removal
    if (updateData.imagesToRemove) {
      const imagesToRemove = Array.isArray(updateData.imagesToRemove)
        ? updateData.imagesToRemove
        : [updateData.imagesToRemove];

      const deletePromises = imagesToRemove.map(imageUrl => {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        return cloudinary.uploader.destroy(`products/images/${publicId}`);
      });

      await Promise.all(deletePromises);

      updateData.images = product.images.filter(
        img => !imagesToRemove.includes(img)
      );
      delete updateData.imagesToRemove;
    }

    // Handle cover photo removal
    if (updateData.removeCoverPhoto === 'true' && product.coverPhoto) {
      const publicId = product.coverPhoto.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/cover/${publicId}`);
      updateData.coverPhoto = null;
      delete updateData.removeCoverPhoto;
    }

    // ✅ Finally update product
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('brand category subCategory');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get products by brand
export const getProductsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt' } = req.query;
    
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = -1;
    
    const products = await Product.find({ 
      brand: brandId, 
      isActive: true 
    })
    .populate('brand category subCategory')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await Product.countDocuments({ brand: brandId, isActive: true });
    
    res.json({
      products,
      brand,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};