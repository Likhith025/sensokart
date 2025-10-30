import multer from 'multer';

const storage = multer.memoryStorage(); // ✅ use memory storage

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadProductImages = upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'pdf', maxCount: 1 }
]);
