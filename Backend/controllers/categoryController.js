import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

// Add category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = new Category({
      name
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

// Add subcategory
export const addSubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    const subCategory = new SubCategory({
      name,
      category
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

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
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