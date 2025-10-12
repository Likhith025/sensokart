import Product from '../models/Product.js';

// Add product with images
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

    // Get uploaded files
    const coverPhoto = req.files?.coverPhoto ? req.files.coverPhoto[0].filename : null;
    const images = req.files?.images ? req.files.images.map(file => file.filename) : [];

    const product = new Product({
      name,
      description,
      price,
      salePrice,
      brand,
      category,
      subCategory,
      quantity: quantity || 0,
      coverPhoto,
      images,
      features: features || [],
      specifications: specifications || {},
      sku
    });

    await product.save();
    await product.populate('brand category subCategory');

    // Add full URLs to response
    const productWithUrls = {
      ...product._doc,
      coverPhoto: coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${coverPhoto}` : null,
      images: images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.status(201).json({
      message: 'Product created successfully',
      product: productWithUrls
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all products with full image URLs
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

    // Add full URLs to images
    const productsWithUrls = products.map(product => ({
      ...product._doc,
      coverPhoto: product.coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${product.coverPhoto}` : null,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    }));

    res.json(productsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID with full image URLs
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('brand category subCategory');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add full URLs to images
    const productWithUrls = {
      ...product._doc,
      coverPhoto: product.coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${product.coverPhoto}` : null,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.json(productWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update product quantity
export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

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
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

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

// Update product with images
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Get uploaded files if any
    if (req.files) {
      if (req.files.coverPhoto) {
        updateData.coverPhoto = req.files.coverPhoto[0].filename;
      }
      if (req.files.images) {
        // If updating images, replace the entire array
        updateData.images = req.files.images.map(file => file.filename);
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('brand category subCategory');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add full URLs to response
    const productWithUrls = {
      ...product._doc,
      coverPhoto: product.coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${product.coverPhoto}` : null,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.json({
      message: 'Product updated successfully',
      product: productWithUrls
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update only cover photo
export const updateCoverPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files?.coverPhoto) {
      return res.status(400).json({ error: 'Cover photo is required' });
    }

    const coverPhoto = req.files.coverPhoto[0].filename;

    const product = await Product.findByIdAndUpdate(
      id,
      { coverPhoto },
      { new: true, runValidators: true }
    ).populate('brand category subCategory');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add full URL to response
    const productWithUrls = {
      ...product._doc,
      coverPhoto: `${req.protocol}://${req.get('host')}/uploads/${coverPhoto}`,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.json({
      message: 'Cover photo updated successfully',
      product: productWithUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add more images to product
export const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files?.images) {
      return res.status(400).json({ error: 'Images are required' });
    }

    const newImages = req.files.images.map(file => file.filename);

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add new images to existing ones
    product.images = [...product.images, ...newImages];
    await product.save();
    await product.populate('brand category subCategory');

    // Add full URLs to response
    const productWithUrls = {
      ...product._doc,
      coverPhoto: product.coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${product.coverPhoto}` : null,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.json({
      message: 'Images added successfully',
      product: productWithUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove image from product
export const removeProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageName } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove the specific image
    product.images = product.images.filter(img => img !== imageName);
    await product.save();
    await product.populate('brand category subCategory');

    // Add full URLs to response
    const productWithUrls = {
      ...product._doc,
      coverPhoto: product.coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${product.coverPhoto}` : null,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.json({
      message: 'Image removed successfully',
      product: productWithUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload product images (separate from add/update product)
export const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || (!req.files.coverPhoto && !req.files.images)) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle cover photo upload
    if (req.files.coverPhoto) {
      product.coverPhoto = req.files.coverPhoto[0].filename;
    }

    // Handle additional images upload
    if (req.files.images) {
      const newImages = req.files.images.map(file => file.filename);
      product.images = [...product.images, ...newImages];
    }

    await product.save();
    await product.populate('brand category subCategory');

    // Add full URLs to response
    const productWithUrls = {
      ...product._doc,
      coverPhoto: product.coverPhoto ? `${req.protocol}://${req.get('host')}/uploads/${product.coverPhoto}` : null,
      images: product.images.map(image => `${req.protocol}://${req.get('host')}/uploads/${image}`)
    };

    res.json({
      message: 'Images uploaded successfully',
      product: productWithUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};