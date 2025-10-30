import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedPdfType = 'application/pdf';
  
  if (
    allowedImageTypes.includes(file.mimetype) || 
    file.mimetype === allowedPdfType
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP images and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const uploadProductImages = upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'pdf', maxCount: 1 }
]);

export default uploadProductImages;