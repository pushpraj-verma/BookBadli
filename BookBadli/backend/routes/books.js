
const express = require('express');
const router = express.Router();


const {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getUserBooks,
  searchBooks,
  findNearbyBooks,
  getBooksNearMe
} = require('../controllers/bookController');


const { auth, optionalAuth } = require('../middleware/auth');
const { 
  handleBookImageUpload, 
  requireImages, 
  optionalImages 
} = require('../middleware/upload');


router.post('/upload-images', 
  auth,                    
  handleBookImageUpload,   
  (req, res) => {
    try {
      if (!req.uploadedImages || req.uploadedImages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No images uploaded'
        });
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${req.uploadedImages.length} images`,
        data: {
          images: req.uploadedImages.map(img => ({
            url: img.url,
            publicId: img.publicId,
            isMain: img.isMain
          }))
        }
      });
      
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Error uploading images'
      });
    }
  }
);


router.get('/', optionalAuth, getAllBooks);


router.get('/nearby', optionalAuth, findNearbyBooks);


router.get('/search', optionalAuth, searchBooks);


router.get('/:id', optionalAuth, getBookById);


router.get('/user/:userId', optionalAuth, getUserBooks);


router.post('/', 
  auth,                   
  handleBookImageUpload,   
  createBook               
);


router.put('/:id', 
  auth,                    
  handleBookImageUpload,   
  optionalImages,          
  updateBook               
);


router.delete('/:id', auth, deleteBook);


router.get('/my/books', auth, (req, res) => {
  req.params.userId = req.user._id; 
  getUserBooks(req, res);
});


router.get('/my/nearby', auth, getBooksNearMe);



// Get book statistics 
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const Book = require('../models/Book');
    
    
    const totalBooks = await Book.countDocuments({ isActive: true });
    const availableBooks = await Book.countDocuments({ 
      status: 'Available', 
      isActive: true 
    });
    const userBooks = await Book.countDocuments({ 
      owner: req.user._id, 
      isActive: true 
    });
    
    // Get popular genres
    const genreStats = await Book.aggregate([
      { $match: { status: 'Available', isActive: true } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    
    const recentBooks = await Book.find({ 
      status: 'Available', 
      isActive: true 
    })
    .populate('owner', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalBooks,
          availableBooks,
          userBooks,
          exchangeRate: totalBooks > 0 ? ((totalBooks - availableBooks) / totalBooks * 100).toFixed(1) : 0
        },
        popularGenres: genreStats.map(item => ({
          genre: item._id,
          count: item.count
        })),
        recentBooks
      }
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching statistics'
    });
  }
});


router.get('/filters/options', async (req, res) => {
  try {
    const Book = require('../models/Book');
    
   
    const genres = await Book.distinct('genre', { 
      status: 'Available', 
      isActive: true 
    });
    
    const conditions = await Book.distinct('condition', { 
      status: 'Available', 
      isActive: true 
    });
    
    const languages = await Book.distinct('language', { 
      status: 'Available', 
      isActive: true 
    });
    
    // Get year range
    const yearStats = await Book.aggregate([
      { $match: { status: 'Available', isActive: true, publishedYear: { $exists: true } } },
      { 
        $group: { 
          _id: null, 
          minYear: { $min: '$publishedYear' },
          maxYear: { $max: '$publishedYear' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        genres: genres.sort(),
        conditions,
        languages: languages.sort(),
        yearRange: yearStats.length > 0 ? {
          min: yearStats[0].minYear,
          max: yearStats[0].maxYear
        } : { min: 1800, max: new Date().getFullYear() }
      }
    });
    
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching filter options'
    });
  }
});


router.post('/validate', auth, (req, res) => {
  try {
    const { title, author, genre, condition } = req.body;
    
    const errors = [];
    
    if (!title || title.trim().length < 1) {
      errors.push('Title is required');
    }
    if (!author || author.trim().length < 1) {
      errors.push('Author is required');
    }
    if (!genre) {
      errors.push('Genre is required');
    }
    if (!condition) {
      errors.push('Condition is required');
    }
    
    if (title && title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }
    if (author && author.length > 100) {
      errors.push('Author cannot exceed 100 characters');
    }
    
    res.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        errors
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation error'
    });
  }
});

module.exports = router;