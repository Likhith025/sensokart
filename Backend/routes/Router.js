import express from 'express';
import { addUser, loginUser, getMe,   updateProfile, 
  changePassword , getUsers, deleteUser, updateUserRole, toggleUserStatus, updateUser, changePasswordu
 } from '../controllers/userController.js';
import { protect, protectAdmin } from '../middlewares/auth.js';
import { uploadProductImages as uploadMiddleware } from '../middlewares/upload.js';

import { 
  addCategory, 
  addSubCategory, 
  getCategories, 
  getSubCategoriesByCategory, 
  getCategoriesWithSubcategories,
  getSubCategories,
  updateCategory,
  deleteCategory,
  updateSubCategory,
  deleteSubCategory
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
  getProductsByCategory,
  getProductsByBrand,
  getRelatedProducts,
  getProductByName,
  downloadProductPdf
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
  deleteEnquiry ,
  updateEnquiry,
  getEnquiryStats,
  respondToEnquiry
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

router.put('/user/profile', protect, updateProfile);
router.put('/user/change-pass', protect, changePassword);
router.put('/user/change-password', protect, changePasswordu);


router.get('/admin/users', protectAdmin, getUsers);
router.delete('/admin/users/:id', protectAdmin, deleteUser);
router.put('/admin/users/:id/role', protectAdmin, updateUserRole);
router.put('/admin/users/:id/status', protectAdmin, toggleUserStatus);
router.put('/admin/users/:id/edit', protectAdmin, updateUser);


// Public routes
router.get('/category', getCategories);
router.get('/subcategory', getSubCategories);
router.get('/category/with-subcategories', getCategoriesWithSubcategories);
router.get('/category/:categoryId/subcategories', getSubCategoriesByCategory);

// Admin only routes
router.post('/category/add', protectAdmin, addCategory);
router.put('/category/:id', protectAdmin, updateCategory);
router.delete('/category/:id', protectAdmin, deleteCategory);

router.post('/subcategory/add', protectAdmin, addSubCategory);
router.put('/subcategory/:id', protectAdmin, updateSubCategory);
router.delete('/subcategory/:id', protectAdmin, deleteSubCategory);
router.get('/brand', getBrands);
router.get('/brand/:id', getBrandById);

router.get('/brand', getBrands);
router.get('/brand/:id', getBrandById);

// Admin only routes
router.post('/brand/add', protectAdmin, addBrand);
router.put('/brand/:id', protectAdmin, updateBrand);
router.delete('/brand/:id', protectAdmin, deleteBrand);

router.get('/products', getProducts);
router.get('/products/search', searchProducts);
router.get('/products/category/:categorySlug', getProductsByCategory);
router.get('/products/brand/:brandId', getProductsByBrand);
router.get('/products/name/:name', getProductByName); // ← ADD THIS
router.get('/products/:id/related', getRelatedProducts);
router.get('/products/:id', getProductById);

// Admin only routes
router.post('/products/add', protectAdmin, uploadMiddleware, addProduct);
router.put('/products/:id', protectAdmin, uploadMiddleware, updateProduct);
router.patch('/products/:id/quantity', protectAdmin, updateQuantity);
router.delete('/products/:id', protectAdmin, deleteProduct);
// routes/productRoutes.js
router.get('/:id/download-pdf', downloadProductPdf);

router.get('/page', getPages);
router.get('/page/slug/:slug', getPageBySlug);
router.get('/page/title/:title', getPageByTitle);

// Admin only routes
router.post('/page/upsert', protectAdmin, upsertPage);
router.delete('/page/:id', protectAdmin, deletePage);

// Public route
router.post('/enquiry', createEnquiry);

// Admin routes
router.get('/enquiry/', protectAdmin, getEnquiries);
router.get('/enquiry/stats', protectAdmin, getEnquiryStats);
router.get('/enquiry/:id', protectAdmin, getEnquiryById);
router.put('/enquiry/:id', protectAdmin, updateEnquiry);
router.post('/enquiry/:id/respond', protectAdmin, respondToEnquiry);
router.delete('/enquiry/:id', protectAdmin, deleteEnquiry);


router.post('/contacts', createContact);

// Admin routes
router.get('/contacts', protectAdmin, getContacts);
router.get('/contacts/:id', protectAdmin, getContactById);
router.put('/contacts/:id/status', protectAdmin, updateContactStatus);
router.delete('/contacts/:id', protectAdmin, deleteContact);

// Add this to your product routes temporarily


export default router;