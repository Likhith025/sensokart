import Product from '../models/Product.js';

// Upload product images to Cloudinary
export const uploadProductImagesCloudinary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.cloudinaryUrls || (!req.cloudinaryUrls.coverPhoto && req.cloudinaryUrls.images.length === 0)) {
      return res.status(400).json({ error: 'No images provided or upload failed' });
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update cover photo if provided
    if (req.cloudinaryUrls.coverPhoto) {
      product.coverPhoto = req.cloudinaryUrls.coverPhoto;
    }

    // Add new images to existing ones
    if (req.cloudinaryUrls.images.length > 0) {
      product.images = [...product.images, ...req.cloudinaryUrls.images];
    }

    await product.save();
    await product.populate('brand category subCategory');

    res.json({
      message: 'Images uploaded to Cloudinary successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete image from Cloudinary and product
export const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove image from arrays
    if (product.coverPhoto === imageUrl) {
      product.coverPhoto = null;
    }
    
    product.images = product.images.filter(img => img !== imageUrl);

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