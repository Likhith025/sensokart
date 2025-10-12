import Brand from '../models/Brand.js';

// Add brand
export const addBrand = async (req, res) => {
  try {
    const { name } = req.body;

    const brand = new Brand({
      name
    });

    await brand.save();

    res.status(201).json({
      message: 'Brand created successfully',
      brand
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Brand already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all brands
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const brand = await Brand.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({
      message: 'Brand updated successfully',
      brand
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Brand name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};