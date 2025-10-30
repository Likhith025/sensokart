import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';

// Add category
export const addCategory = async (req, res) => {
  try {
    const { name, descriptionTitle, description } = req.body;

    const category = new Category({
      name,
      descriptionTitle: descriptionTitle || "",
      description: description || ""
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, descriptionTitle, description } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { 
        name, 
        descriptionTitle: descriptionTitle || "",
        description: description || "" 
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is used in any products
    const productsUsingCategory = await Product.find({ category: id });
    
    if (productsUsingCategory.length > 0) {
      const productNames = productsUsingCategory.slice(0, 3).map(p => p.name);
      return res.status(400).json({ 
        error: `Cannot delete category. It is being used by ${productsUsingCategory.length} product(s).`,
        productCount: productsUsingCategory.length,
        sampleProducts: productNames,
        message: `This category is associated with ${productsUsingCategory.length} product(s) including: ${productNames.join(', ')}${productsUsingCategory.length > 3 ? '...' : ''}`
      });
    }

    // Delete all subcategories associated with this category first
    await SubCategory.deleteMany({ category: id });

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category and associated subcategories deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add subcategory
export const addSubCategory = async (req, res) => {
  try {
    const { name, category, descriptionTitle, description } = req.body;

    const subCategory = new SubCategory({
      name,
      category,
      descriptionTitle: descriptionTitle || "",
      description: description || ""
    });

    await subCategory.save();
    await subCategory.populate('category');

    res.status(201).json({
      message: 'SubCategory created successfully',
      subCategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update subcategory
export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, descriptionTitle, description } = req.body;

    const subCategory = await SubCategory.findByIdAndUpdate(
      id,
      { 
        name, 
        category, 
        descriptionTitle: descriptionTitle || "",
        description: description || "" 
      },
      { new: true, runValidators: true }
    ).populate('category');

    if (!subCategory) {
      return res.status(404).json({ error: 'SubCategory not found' });
    }

    res.json({
      message: 'SubCategory updated successfully',
      subCategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete subcategory
export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subcategory is used in any products
    const productsUsingSubCategory = await Product.find({ subCategory: id });
    
    if (productsUsingSubCategory.length > 0) {
      const productNames = productsUsingSubCategory.slice(0, 3).map(p => p.name);
      return res.status(400).json({ 
        error: `Cannot delete subcategory. It is being used by ${productsUsingSubCategory.length} product(s).`,
        productCount: productsUsingSubCategory.length,
        sampleProducts: productNames,
        message: `This subcategory is associated with ${productsUsingSubCategory.length} product(s) including: ${productNames.join(', ')}${productsUsingSubCategory.length > 3 ? '...' : ''}`
      });
    }

    const subCategory = await SubCategory.findByIdAndDelete(id);

    if (!subCategory) {
      return res.status(404).json({ error: 'SubCategory not found' });
    }

    res.json({
      message: 'SubCategory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all subcategories
export const getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find().populate('category').sort({ name: 1 });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get subcategories by category
export const getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subCategories = await SubCategory.find({ category: categoryId }).populate('category').sort({ name: 1 });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all categories with their subcategories
export const getCategoriesWithSubcategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'category',
          as: 'subCategories'
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};