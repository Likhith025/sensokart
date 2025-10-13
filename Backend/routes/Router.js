import express from 'express';
import { addUser, loginUser, getMe } from '../controllers/userController.js';
import { protect, protectAdmin } from '../middlewares/auth.js';
//import { uploadProductImages as uploadMiddleware } from '../middleware/upload.js';
import { uploadProductImages as uploadMiddleware } from '../middlewares/upload.js';

import { 
  addCategory, 
  addSubCategory, 
  getCategories, 
  getSubCategoriesByCategory, 
  getCategoriesWithSubcategories 
} from '../controllers/categoryController.js';

import { 
  addBrand, 
  getBrands, 
  getBrandById, 
  updateBrand, 
  deleteBrand 
} from '../controllers/brandController.js';

import { 
  addProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  updateQuantity,
  searchProducts,
  uploadProductImages,
  removeProductImage
} from '../controllers/productController.js';


import { 
  upsertPage, 
  getPages, 
  getPageBySlug, 
  getPageByTitle,
  deletePage 
} from '../controllers/pageController.js';

import { 
  createEnquiry, 
  getEnquiries, 
  getEnquiryById, 
  updateEnquiryStatus, 
  deleteEnquiry 
} from '../controllers/enquiryController.js';

import { 
  createContact, 
  getContacts, 
  getContactById, 
  updateContactStatus, 
  deleteContact 
} from '../controllers/contactController.js';




const router = express.Router();

router.post('/user/register', addUser);
router.post('/login', loginUser);
router.get('/me', protectAdmin, getMe);

router.get('/category', getCategories);
router.get('/category/with-subcategories',getCategoriesWithSubcategories);
router.get('/category/:categoryId/subcategories',getSubCategoriesByCategory);

// Admin only routes
router.post('/category/add', protectAdmin, addCategory);
router.post('/subcategory/add', protectAdmin, addSubCategory);

router.get('/brand', getBrands);
router.get('/brand/:id', getBrandById);

// Admin only routes
router.post('/brand/add', protectAdmin, addBrand);
router.put('/brand/:id', protectAdmin, updateBrand);
router.delete('/brand/:id', protectAdmin, deleteBrand);

// Public routes
router.get('/products', getProducts);
router.get('/products/search', searchProducts);
router.get('/products/:id', getProductById);

// Admin only routes
router.post('/products/add', protectAdmin, uploadMiddleware, addProduct);
router.put('/products/:id', protectAdmin, uploadMiddleware, updateProduct);
router.patch('/products/:id/quantity', protectAdmin, updateQuantity);
router.patch('/products/:id/upload-images', protectAdmin, uploadMiddleware, uploadProductImages);
router.patch('/products/:id/remove-image', protectAdmin, removeProductImage);
router.delete('/products/:id', protectAdmin, deleteProduct);

router.get('/page', getPages);
router.get('/page/slug/:slug', getPageBySlug);
router.get('/page/title/:title', getPageByTitle);

// Admin only routes
router.post('/page/upsert', protectAdmin, upsertPage);
router.delete('/page/:id', protectAdmin, deletePage);

router.post('/enquiry', createEnquiry);

// Admin routes
router.get('/enquiry/', protectAdmin, getEnquiries);
router.get('/enquiry/:id', protectAdmin, getEnquiryById);
router.put('/enquiry/:id/status', protectAdmin, updateEnquiryStatus);
router.delete('/enquiry/:id', protectAdmin, deleteEnquiry);

router.post('/contacts', createContact);

// Admin routes
router.get('/contacts', protectAdmin, getContacts);
router.get('/contacts/:id', protectAdmin, getContactById);
router.put('/contacts/:id/status', protectAdmin, updateContactStatus);
router.delete('/contacts/:id', protectAdmin, deleteContact);

// Add this to your product routes temporarily
router.post('/test-upload', uploadProductImages, async (req, res) => {
  try {
    console.log('Files:', req.files);
    
    if (!req.files || (!req.files.coverPhoto && !req.files.images)) {
      return res.status(400).json({ error: 'No files received' });
    }

    res.json({
      message: 'Files received successfully',
      files: {
        coverPhoto: req.files.coverPhoto ? req.files.coverPhoto[0] : null,
        images: req.files.images ? req.files.images.map(f => f) : []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;