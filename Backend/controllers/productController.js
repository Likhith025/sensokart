import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// --- Helper: Cloudinary upload from memory buffer ---
const streamUpload = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
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
    // handle double-stringified JSON
    if (typeof parsed === 'string') return JSON.parse(parsed);
    return parsed;
  } catch {
    return value;
  }
};

// --- Main Controller ---
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
      sku
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
      specifications: specsObject, // ✅ fixed — Map now gets correct object
      sku
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

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, featured } = req.query;
    
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (featured) filter.isFeatured = featured === 'true';
    
    if (minPrice || maxPrice) {
      filter.$or = [
        { salePrice: {} },
        { price: {} }
      ];
      
      if (minPrice) {
        filter.$or[0].salePrice.$gte = parseFloat(minPrice);
        filter.$or[1].price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter.$or[0].salePrice.$lte = parseFloat(maxPrice);
        filter.$or[1].price.$lte = parseFloat(maxPrice);
      }
    }

    const products = await Product.find(filter)
      .populate('brand category subCategory')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('brand category subCategory');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

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
    if (product.coverPhoto) {
      const publicId = product.coverPhoto.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/cover/${publicId}`);
    }

    if (product.images.length > 0) {
      const deletePromises = product.images.map(image => {
        const publicId = image.split('/').pop().split('.')[0];
        return cloudinary.uploader.destroy(`products/images/${publicId}`);
      });
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(id);

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } }
      ]
    }).populate('brand category subCategory');

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product with Cloudinary images
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle cover photo upload
    if (req.files?.coverPhoto) {
      // Delete old cover photo from Cloudinary
      if (product.coverPhoto) {
        const oldPublicId = product.coverPhoto.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/cover/${oldPublicId}`);
      }

      const coverResult = await cloudinary.uploader.upload(req.files.coverPhoto[0].path, {
        folder: 'products/cover'
      });
      updateData.coverPhoto = coverResult.secure_url;
    }

    // Handle additional images upload
    if (req.files?.images) {
      // Delete old images from Cloudinary if replacing all
      if (updateData.replaceImages === 'true') {
        const deletePromises = product.images.map(image => {
          const publicId = image.split('/').pop().split('.')[0];
          return cloudinary.uploader.destroy(`products/images/${publicId}`);
        });
        await Promise.all(deletePromises);
        updateData.images = [];
      }

      const imageUploadPromises = req.files.images.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: 'products/images'
        })
      );
      const imageResults = await Promise.all(imageUploadPromises);
      const newImageUrls = imageResults.map(result => result.secure_url);
      
      updateData.images = [...product.images, ...newImageUrls];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('brand category subCategory');

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

// Upload product images to Cloudinary
export const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverPhoto, images, title, description } = req.body;

    if (!coverPhoto && (!images || images.length === 0)) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Upload cover photo
    if (coverPhoto) {
      if (product.coverPhoto) {
        const oldPublicId = product.coverPhoto.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/cover/${oldPublicId}`);
      }

      const coverResult = await cloudinary.uploader.upload(coverPhoto, {
        folder: 'products/cover'
      });
      product.coverPhoto = coverResult.secure_url;
    }

    // Upload additional images
    if (images && images.length > 0) {
      const imageUploadPromises = images.map(img =>
        cloudinary.uploader.upload(img, { folder: 'products/images' })
      );
      const imageResults = await Promise.all(imageUploadPromises);
      const newImageUrls = imageResults.map(result => result.secure_url);
      product.images = [...(product.images || []), ...newImageUrls];
    }

    // Optional: update title/description
    if (title) product.title = title;
    if (description) product.description = description;

    await product.save();
    await product.populate('brand category subCategory');

    res.json({
      message: 'Images uploaded successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove specific image from product
export const removeProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, isCoverPhoto } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (isCoverPhoto && product.coverPhoto === imageUrl) {
      // Delete from Cloudinary
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/cover/${publicId}`);
      
      product.coverPhoto = null;
    } else {
      // Delete from images array and Cloudinary
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/images/${publicId}`);
      
      product.images = product.images.filter(img => img !== imageUrl);
    }

    await product.save();
    await product.populate('brand category subCategory');

    res.json({
      message: 'Image removed successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};