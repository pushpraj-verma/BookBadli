
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for book images
const bookImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bookbadli/books', // Organized folder structure
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 800,
        height: 1000,
        crop: 'limit', 
        quality: 'auto:good',
        format: 'auto' 
      }
    ],
    public_id: (req, file) => {
      
      const timestamp = Date.now();
      const userId = req.user?._id || 'anonymous';
      return `book_${userId}_${timestamp}`;
    }
  },
});

// Configure Cloudinary storage for user avatars  
const avatarImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bookbadli/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'fill', 
        gravity: 'face', 
        quality: 'auto:good',
        format: 'auto'
      }
    ],
    public_id: (req, file) => {
      const userId = req.user?._id || 'anonymous';
      return `avatar_${userId}_${Date.now()}`;
    }
  },
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! (jpg, jpeg, png, gif, webp)'), false);
  }
};

// Multer configuration for book images
const uploadBookImages = multer({
  storage: bookImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5 
  }
});

// Multer configuration for avatar images
const uploadAvatar = multer({
  storage: avatarImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, 
    files: 1 
  }
});

// Middleware for handling multiple book images
const handleBookImageUpload = (req, res, next) => {
  const upload = uploadBookImages.array('images', 5); 
  
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
     
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 5MB per image.'
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 5 images allowed per book.'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Use "images" for book pictures.'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: `Upload error: ${error.message}`
      });
    }
    
    if (error) {
      
      console.log('📁 Image upload error (continuing anyway):', error.message);
      
    }
    
    // Attach uploaded file info to request 
    if (req.files && req.files.length > 0) {
      req.uploadedImages = req.files.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        isMain: index === 0, 
        uploadedAt: new Date()
      }));
      console.log(`📷 Successfully uploaded ${req.files.length} images`);
    } else {
      req.uploadedImages = [];
      console.log('📷 No images uploaded - will use placeholder');
    }
    
    next();
  });
};

// Middleware for handling single avatar image
const handleAvatarUpload = (req, res, next) => {
  const upload = uploadAvatar.single('avatar'); 
  
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Avatar too large. Maximum size is 2MB.'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: `Upload error: ${error.message}`
      });
    }
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    
    if (req.file) {
      req.uploadedAvatar = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }
    
    next();
  });
};

// Utility function to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Utility function to delete multiple images
const deleteImagesFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(id => cloudinary.uploader.destroy(id));
    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
    throw error;
  }
};

// Middleware to validate image upload requirements
const requireImages = (req, res, next) => {
  if (!req.uploadedImages || req.uploadedImages.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one image is required for the book.'
    });
  }
  next();
};

// Optional images middleware 
const optionalImages = (req, res, next) => {
 
  next();
};


const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${error.message}`
    });
  }
  
  if (error.message.includes('Cloudinary')) {
    return res.status(500).json({
      success: false,
      error: 'Image upload service error. Please try again.'
    });
  }
  
  next(error);
};

module.exports = {
  handleBookImageUpload,
  handleAvatarUpload,
  deleteImageFromCloudinary,
  deleteImagesFromCloudinary,
  requireImages,
  optionalImages,
  handleUploadError,
  cloudinary 
};