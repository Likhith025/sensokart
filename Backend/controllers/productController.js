import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

// Helper function to generate dashed name
const generateDashedName = (name) => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

// --- Helper: Cloudinary upload from memory buffer ---
const streamUpload = (fileBuffer, folder, resourceType = 'image', originalName = '') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      type: 'upload',
      access_mode: 'public'
    };

    // For PDF files, preserve the original filename
    if (resourceType === 'raw' && originalName) {
      const fileName = originalName.replace(/\.[^/.]+$/, "");
      uploadOptions.public_id = fileName;
      uploadOptions.filename_override = originalName;
    }

    // Only apply image transformations for images
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 800, height: 800, crop: "limit", quality: "auto" },
        { format: 'webp' }
      ];
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
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

// --- Get Products Controller (Updated with Priority Sorting) ---
export const getProducts = async (req, res) => {
  try {
    const {
      brand,
      category,
      subCategory,
      minPrice,
      maxPrice,
      sortBy = 'priority', // Default to priority sorting
      sortOrder = 'asc',   // Default to ascending (lower priority first = higher importance)
      page = 1,
      limit = 50
    } = req.query;

    console.log('📦 Filter parameters received:', req.query);

    let filter = { isActive: true };
    const sortOptions = {};

    // Helper function to find ID by dashedName
    const findIdByDashedName = async (model, value) => {
      if (!value) return null;

      // If it's a valid ObjectId, use it directly
      if (mongoose.Types.ObjectId.isValid(value)) {
        return value;
      }

      // Otherwise, search by dashedName
      const doc = await model.findOne({ dashedName: value });
      return doc ? doc._id : null;
    };

    // Build filter object - handle both ID and dashedName
    if (brand && brand !== '') {
      console.log('Filtering by brand:', brand);
      const brandId = await findIdByDashedName(Brand, brand);
      if (brandId) {
        filter.brand = brandId;
      } else {
        console.log('Brand not found:', brand);
        return res.json({
          products: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalProducts: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }

    if (category && category !== '') {
      console.log('Filtering by category:', category);
      const categoryId = await findIdByDashedName(Category, category);
      if (categoryId) {
        filter.category = categoryId;
      } else {
        console.log('Category not found:', category);
        return res.json({
          products: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalProducts: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }

    if (subCategory && subCategory !== '') {
      console.log('Filtering by subCategory:', subCategory);
      const subCategoryId = await findIdByDashedName(SubCategory, subCategory);
      if (subCategoryId) {
        filter.subCategory = subCategoryId;
      } else {
        console.log('SubCategory not found:', subCategory);
        return res.json({
          products: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalProducts: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }

    // Price filtering - handle both price and salePrice
    if (minPrice || maxPrice) {
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
            { $or: [{ salePrice: { $exists: false } }, { salePrice: null }] },
            { price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } }
          ]
        });
      } else if (minPrice) {
        priceConditions.push({
          $and: [
            { $or: [{ salePrice: { $exists: false } }, { salePrice: null }] },
            { price: { $gte: parseFloat(minPrice) } }
          ]
        });
      } else if (maxPrice) {
        priceConditions.push({
          $and: [
            { $or: [{ salePrice: { $exists: false } }, { salePrice: null }] },
            { price: { $lte: parseFloat(maxPrice) } }
          ]
        });
      }

      if (priceConditions.length > 0) {
        filter.$or = priceConditions;
      }
    }

    // Sort options - Priority is always first and ASCENDING (lower number = higher priority)
    sortOptions.priority = 1; // Primary sort by priority ASCENDING

    // Secondary sort based on user preference
    if (sortBy === 'price') {
      sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sortOptions['ratings.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    // If sortBy is 'priority', we already set it above

    const skip = (page - 1) * limit;

    console.log('🔍 Final filter:', JSON.stringify(filter, null, 2));
    console.log('📊 Sort options:', JSON.stringify(sortOptions, null, 2));

    const products = await Product.find(filter)
      .populate('brand category subCategory')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    console.log(`✅ Found ${products.length} products out of ${total} total`);
    console.log(`📊 Priority range in results: ${Math.min(...products.map(p => p.priority))} to ${Math.max(...products.map(p => p.priority))}`);

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

// --- Update Product Controller ---
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

    // --- Handle tabDescription ---
    if (updateData.tabDescription !== undefined) {
      updateData.tabDescription = updateData.tabDescription || '';
    }

    // --- Handle dashedName generation ---
    if (updateData.name && updateData.name !== product.name) {
      updateData.dashedName = generateDashedName(updateData.name);
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

    // Handle PDF upload
    if (req.files?.pdf) {
      console.log('📄 Uploading new PDF...');

      // Delete old PDF if exists
      if (product.pdf) {
        const oldPdfPublicId = product.pdf.split('/').pop().split('.')[0];
        console.log('🗑️ Deleting old PDF:', oldPdfPublicId);
        await cloudinary.uploader.destroy(`products/pdfs/${oldPdfPublicId}`, {
          resource_type: 'raw'
        });
      }

      const pdfFile = req.files.pdf[0];
      const pdfResult = await streamUpload(
        pdfFile.buffer,
        'products/pdfs',
        'raw',
        pdfFile.originalname
      );
      updateData.pdf = pdfResult.secure_url;
      updateData.pdfOriginalName = pdfFile.originalname;
      console.log('✅ PDF uploaded successfully:', updateData.pdf);
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

    // Handle PDF removal
    if (updateData.removePdf === 'true' && product.pdf) {
      console.log('🗑️ Removing PDF file...');
      const publicId = product.pdf.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/pdfs/${publicId}`, {
        resource_type: 'raw'
      });
      updateData.pdf = null;
      updateData.pdfOriginalName = null;
      delete updateData.removePdf;
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.salePrice) updateData.salePrice = parseFloat(updateData.salePrice);
    if (updateData.quantity) updateData.quantity = parseInt(updateData.quantity);
    if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority);

    console.log('🔄 Final update data:', JSON.stringify(updateData, null, 2));

    // ✅ Finally update product
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('brand category subCategory');

    console.log('✅ Product updated successfully');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.dashedName) {
        return res.status(400).json({ error: 'Product name already exists. Please choose a different name.' });
      }
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// --- Add Product Controller ---
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      tabDescription,
      price,
      salePrice,
      brand,
      category,
      subCategory,
      quantity,
      features,
      specifications,
      sku,
      manufacturer,
      modelNo,
      measuringParameters,
      priority = 999999 // Default to low priority if not specified
    } = req.body;

    console.log('📦 Form data received:', req.body);
    console.log('🖼️ Files received:', req.files);

    let coverPhotoUrl = null;
    let imageUrls = [];
    let pdfUrl = null;
    let pdfOriginalName = null;

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

    // ✅ Upload PDF (if provided)
    if (req.files?.pdf?.length > 0) {
      console.log('Uploading PDF...');
      const pdfFile = req.files.pdf[0];
      pdfOriginalName = pdfFile.originalname;

      const pdfResult = await streamUpload(
        pdfFile.buffer,
        'products/pdfs',
        'raw',
        pdfFile.originalname
      );
      pdfUrl = pdfResult.secure_url;
      console.log('✅ PDF uploaded:', pdfUrl);
    }

    // ✅ Parse features & specifications safely
    const featuresArray = safeParseJSON(features) || [];
    const specsObject = safeParseJSON(specifications) || {};

    // ✅ Generate dashedName from product name
    const dashedName = generateDashedName(name);

    // ✅ Create new product
    const product = new Product({
      name,
      dashedName,
      description,
      tabDescription: tabDescription || '',
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      brand,
      category,
      subCategory,
      quantity: quantity ? parseInt(quantity) : 0,
      coverPhoto: coverPhotoUrl,
      images: imageUrls,
      pdf: pdfUrl,
      pdfOriginalName: pdfOriginalName,
      features: featuresArray,
      specifications: specsObject,
      sku,
      manufacturer,
      modelNo,
      measuringParameters,
      priority: priority ? parseInt(priority) : 999999
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

// --- Get Products by Category (Updated with Priority Sorting) ---
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

    // Sort options - Priority first (ascending), then secondary sort
    const sortOptions = { priority: 1 }; // Primary sort by priority (ascending)
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

// --- Get Related Products (Updated with Priority Sorting) ---
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
      .sort({ priority: 1, createdAt: -1 }); // Priority first

    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Search Products (Updated with Priority Sorting) ---
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
        { tabDescription: { $regex: q, $options: 'i' } },
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
      .sort({ priority: 1, createdAt: -1 }); // Priority first

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

// --- Get Products by Brand (Updated with Priority Sorting) ---
export const getProductsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page = 1, limit = 12, sortBy = 'priority' } = req.query;

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const skip = (page - 1) * limit;
    const sortOptions = { priority: 1 }; // Primary sort by priority
    if (sortBy === 'price') sortOptions.price = -1;
    else if (sortBy === 'name') sortOptions.name = 1;
    else sortOptions.createdAt = -1;

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

// --- Other controller functions (keep existing) ---
export const downloadProductPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product || !product.pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.redirect(product.pdf);
  } catch (error) {
    console.error('❌ Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
};

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

    // Delete PDF from Cloudinary
    if (product.pdf) {
      const pdfPublicId = product.pdf.split('/').pop().split('.')[0];
      deletePromises.push(cloudinary.uploader.destroy(`products/pdfs/${pdfPublicId}`, {
        resource_type: 'raw'
      }));
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

export const getProductByName = async (req, res) => {
  try {
    const { name } = req.params;

    console.log('🔍 Searching for product with dashedName:', name);

    const product = await Product.findOne({
      dashedName: name,
      isActive: true
    }).populate('brand category subCategory');

    if (!product) {
      console.log('❌ Product not found with dashedName:', name);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product found:', product.name);

    // Increment view count
    await Product.findByIdAndUpdate(product._id, {
      $inc: { 'ratings.count': 1 }
    });

    res.json(product);
  } catch (error) {
    console.error('❌ Error in getProductByName:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('brand category subCategory');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.findByIdAndUpdate(id, { $inc: { 'ratings.count': 1 } });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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