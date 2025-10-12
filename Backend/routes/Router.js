import express from 'express';
import { addUser, loginUser, getMe } from '../controllers/userController.js';
import { protect, protectAdmin } from '../middlewares/auth.js';
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
  updateCoverPhoto,
  addProductImages,
  removeProductImage,
  uploadProductImages
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

router.get('/product', getProducts);
router.get('/product/search', searchProducts);
router.get('/product/:id', getProductById);

// Admin only routes
router.post('/product/add', protectAdmin, uploadProductImages, addProduct);
router.put('/product/:id', protectAdmin, uploadProductImages, updateProduct);
router.patch('/product/:id/quantity', protectAdmin, updateQuantity);
router.patch('/product/:id/cover-photo', protectAdmin, uploadProductImages, updateCoverPhoto);
router.patch('/product/:id/add-images', protectAdmin, uploadProductImages, addProductImages);
router.patch('/product/:id/remove-image', protectAdmin, removeProductImage);
router.delete('/product/:id', protectAdmin, deleteProduct);

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

router.post('/', createContact);

// Admin routes
router.get('/', protectAdmin, getContacts);
router.get('/:id', protectAdmin, getContactById);
router.put('/:id/status', protectAdmin, updateContactStatus);
router.delete('/:id', protectAdmin, deleteContact);



export default router;