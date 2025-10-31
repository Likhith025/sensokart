import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import SubCategory from "../models/SubCategory.js";
import Product from "../models/Product.js";

// @desc    Get object ID by dashedName for any type
// @route   GET /api/unified/find-id/:dashedName
// @access  Public
export const getObjectIdByDashedName = async (req, res) => {
  try {
    const { dashedName } = req.params;
    
    // Search across all collections using the stored dashedName field
    const [brand, category, subCategory, product] = await Promise.all([
      Brand.findOne({ dashedName }).select('_id name dashedName type').lean(),
      Category.findOne({ dashedName }).select('_id name dashedName type').lean(),
      SubCategory.findOne({ dashedName }).select('_id name dashedName type').lean(),
      Product.findOne({ dashedName }).select('_id name dashedName type').lean()
    ]);

    let result = null;
    let type = null;

    if (brand) {
      result = { _id: brand._id, name: brand.name, dashedName: brand.dashedName };
      type = 'Brand';
    } else if (category) {
      result = { _id: category._id, name: category.name, dashedName: category.dashedName };
      type = 'Category';
    } else if (subCategory) {
      result = { _id: subCategory._id, name: subCategory.name, dashedName: subCategory.dashedName };
      type = 'SubCategory';
    } else if (product) {
      result = { _id: product._id, name: product.name, dashedName: product.dashedName };
      type = 'Product';
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...result,
        type: type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching item",
      error: error.message
    });
  }
};

// @desc    Get item by dashedName (existing function - keep as is)
// @route   GET /api/unified/item/:dashedName
// @access  Public
export const getItemByDashedName = async (req, res) => {
  try {
    const { dashedName } = req.params;
    
    // Search across all collections using the stored dashedName field
    const [brand, category, subCategory, product] = await Promise.all([
      Brand.findOne({ dashedName }).lean(),
      Category.findOne({ dashedName }).lean(),
      SubCategory.findOne({ dashedName }).populate('category', 'name dashedName').lean(),
      Product.findOne({ dashedName })
        .populate('brand', 'name dashedName')
        .populate('category', 'name dashedName')
        .populate('subCategory', 'name dashedName')
        .lean()
    ]);

    let result = null;
    let type = null;

    if (brand) {
      result = brand;
      type = 'Brand';
    } else if (category) {
      result = category;
      type = 'Category';
    } else if (subCategory) {
      result = subCategory;
      type = 'SubCategory';
    } else if (product) {
      result = product;
      type = 'Product';
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Add type to result
    const transformedResult = {
      ...result,
      type: type
    };

    res.status(200).json({
      success: true,
      data: transformedResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching item",
      error: error.message
    });
  }
};

// @desc    Update dashedName for all records in all collections (existing function - keep as is)
// @route   POST /api/unified/update-dashed-names
// @access  Private/Admin
export const updateDashedNamesForAll = async (req, res) => {
  try {
    let results = {
      brands: { updated: 0, errors: [] },
      categories: { updated: 0, errors: [] },
      subCategories: { updated: 0, errors: [] },
      products: { updated: 0, errors: [] }
    };

    // Update Brands
    try {
      const brands = await Brand.find();
      for (const brand of brands) {
        try {
          const newDashedName = brand.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          
          brand.dashedName = newDashedName;
          await brand.save();
          results.brands.updated++;
        } catch (error) {
          results.brands.errors.push({
            id: brand._id,
            name: brand.name,
            error: error.message
          });
        }
      }
    } catch (error) {
      results.brands.errors.push({ error: error.message });
    }

    // Update Categories
    try {
      const categories = await Category.find();
      for (const category of categories) {
        try {
          const newDashedName = category.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          
          category.dashedName = newDashedName;
          await category.save();
          results.categories.updated++;
        } catch (error) {
          results.categories.errors.push({
            id: category._id,
            name: category.name,
            error: error.message
          });
        }
      }
    } catch (error) {
      results.categories.errors.push({ error: error.message });
    }

    // Update SubCategories
    try {
      const subCategories = await SubCategory.find();
      for (const subCategory of subCategories) {
        try {
          const newDashedName = subCategory.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          
          subCategory.dashedName = newDashedName;
          await subCategory.save();
          results.subCategories.updated++;
        } catch (error) {
          results.subCategories.errors.push({
            id: subCategory._id,
            name: subCategory.name,
            error: error.message
          });
        }
      }
    } catch (error) {
      results.subCategories.errors.push({ error: error.message });
    }

    // Update Products (only if they don't have dashedName or name changed)
    try {
      const products = await Product.find();
      for (const product of products) {
        try {
          // Only update if dashedName doesn't exist or name has changed
          if (!product.dashedName || product.isModified('name')) {
            const newDashedName = product.name
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
            
            product.dashedName = newDashedName;
            await product.save();
            results.products.updated++;
          }
        } catch (error) {
          results.products.errors.push({
            id: product._id,
            name: product.name,
            error: error.message
          });
        }
      }
    } catch (error) {
      results.products.errors.push({ error: error.message });
    }

    const totalUpdated = 
      results.brands.updated + 
      results.categories.updated + 
      results.subCategories.updated + 
      results.products.updated;

    const totalErrors = 
      results.brands.errors.length + 
      results.categories.errors.length + 
      results.subCategories.errors.length + 
      results.products.errors.length;

    res.status(200).json({
      success: true,
      message: `Dashed names updated successfully. ${totalUpdated} records updated, ${totalErrors} errors.`,
      results: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating dashed names",
      error: error.message
    });
  }
};