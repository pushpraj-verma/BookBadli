const Book = require('../models/Book');
const User = require('../models/User');
const { deleteImagesFromCloudinary } = require('../middleware/upload');

// Create new book
const createBook = async (req, res) => {
  try {
    const {
      title, author, isbn, genre, description, condition, language,
      pages, publishedYear, publisher, address, city, state,
      interestedGenres, maxDistance, preferredConditions, notes,
      images 
    } = req.body;
    
    console.log('📝 Book creation request received');
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('🖼️ Form-data images:', req.uploadedImages ? req.uploadedImages.length : 0);
    console.log('🖼️ JSON images:', images ? images.length : 0);
    
    
    if (!title || !author || !genre || !condition) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: title, author, genre, condition'
      });
    }
    
    
    let bookImages = [];
    
   
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      bookImages = req.uploadedImages;
      console.log('✅ Using form-data uploaded images');
    } 
    
    else if (images && Array.isArray(images) && images.length > 0) {
      bookImages = images.map((img, index) => ({
        url: typeof img === 'string' ? img : img.url,
        publicId: typeof img === 'string' ? `json_upload_${Date.now()}_${index}` : img.publicId,
        isMain: index === 0,
        uploadedAt: new Date()
      }));
      console.log('✅ Using JSON provided image URLs');
    }
    
    else {
      bookImages = [{
        url: 'https://via.placeholder.com/400x600.png?text=Book+Cover',
        publicId: 'placeholder_' + Date.now(),
        isMain: true,
        uploadedAt: new Date()
      }];
      console.log('📷 Using placeholder image (no images provided)');
    }
    
    
    const user = await User.findById(req.user._id);
    
    
    const bookLocation = {
      type: 'Point',
      coordinates: user.location.coordinates, 
      address: address || user.location.address || '',
      city: city || user.location.city || '',
      state: state || user.location.state || ''
    };
    
   
    if (req.body.longitude && req.body.latitude) {
      bookLocation.coordinates = [
        parseFloat(req.body.longitude),
        parseFloat(req.body.latitude)
      ];
    }
    
    // Create book object
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      genre,
      condition,
      description: description ? description.trim() : '',
      language: language || 'English',
      owner: req.user._id,
      location: bookLocation,
      images: bookImages,
      status: 'Available',
      isActive: true
    };
    
    
    if (isbn) bookData.isbn = isbn.trim();
    if (pages) bookData.pages = parseInt(pages);
    if (publishedYear) bookData.publishedYear = parseInt(publishedYear);
    if (publisher) bookData.publisher = publisher.trim();
    
    
    if (interestedGenres || maxDistance || preferredConditions || notes) {
      bookData.exchangePreferences = {
        interestedGenres: interestedGenres ? 
          (Array.isArray(interestedGenres) ? interestedGenres : JSON.parse(interestedGenres || '[]')) : [],
        maxDistance: maxDistance ? parseInt(maxDistance) : 10,
        preferredConditions: preferredConditions ? 
          (Array.isArray(preferredConditions) ? preferredConditions : JSON.parse(preferredConditions || '[]')) : [],
        notes: notes ? notes.trim() : ''
      };
    }
    
    console.log('📚 Creating book with data:', {
      title: bookData.title,
      author: bookData.author,
      genre: bookData.genre,
      imagesCount: bookData.images.length,
      imageSource: req.uploadedImages ? 'form-data' : (images ? 'json-urls' : 'placeholder'),
      location: bookData.location
    });
    
    // Create and save book
    const book = new Book(bookData);
    await book.save();
    
    // Update user's book count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalBooksUploaded': 1 }
    });
    
    // Populate owner information before sending response
    await book.populate('owner', 'username firstName lastName avatar');
    
    console.log('✅ Book created successfully:', book._id);
    
    res.status(201).json({
      success: true,
      message: 'Book added successfully to BookBadli!',
      data: {
        book
      }
    });
    
  } catch (error) {
    console.error('❌ Create book error:', error);
    
    // Clean up uploaded images if book creation fails
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      try {
        const publicIds = req.uploadedImages.map(img => img.publicId);
        await deleteImagesFromCloudinary(publicIds);
        console.log('🧹 Cleaned up failed upload images');
      } catch (cleanupError) {
        console.error('Error cleaning up images:', cleanupError);
      }
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating book. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all books with pagination and filtering
const getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    
    const filters = {
      status: 'Available',
      isActive: true
    };
    
  
    if (req.query.genre) filters.genre = req.query.genre;
    if (req.query.condition) filters.condition = { $in: req.query.condition.split(',') };
    if (req.query.language) filters.language = req.query.language;
    if (req.query.minYear) filters.publishedYear = { $gte: parseInt(req.query.minYear) };
    if (req.query.maxYear) {
      filters.publishedYear = { ...filters.publishedYear, $lte: parseInt(req.query.maxYear) };
    }
    
    
    let searchQuery = {};
    if (req.query.search) {
      searchQuery = {
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { author: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      };
    }
    
    
    const query = { ...filters, ...searchQuery };
    
    
    let sortBy = { createdAt: -1 }; // Default: newest first
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'title':
          sortBy = { title: 1 };
          break;
        case 'author':
          sortBy = { author: 1 };
          break;
        case 'year':
          sortBy = { publishedYear: -1 };
          break;
        case 'popular':
          sortBy = { 'analytics.views': -1 };
          break;
        case 'oldest':
          sortBy = { createdAt: 1 };
          break;
        default:
          sortBy = { createdAt: -1 };
      }
    }
    
    
    const books = await Book.find(query)
      .populate('owner', 'username firstName lastName avatar')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(); 
    
    
    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limit);
    
    
    const availableGenres = await Book.distinct('genre', { status: 'Available', isActive: true });
    const availableConditions = await Book.distinct('condition', { status: 'Available', isActive: true });
    const availableLanguages = await Book.distinct('language', { status: 'Available', isActive: true });
    
    res.json({
      success: true,
      data: {
        books,
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        filters: {
          availableGenres: availableGenres.sort(),
          availableConditions,
          availableLanguages: availableLanguages.sort()
        }
      }
    });
    
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching books'
    });
  }
};


const getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const book = await Book.findById(bookId)
      .populate('owner', 'username firstName lastName avatar bio location stats')
      .populate('exchangeRequests.requester', 'username firstName lastName avatar')
      .populate('exchangeRequests.offeredBooks', 'title author images');
    
    if (!book || !book.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
   
    if (req.user && req.user._id.toString() !== book.owner._id.toString()) {
      await book.incrementView(req.user._id, req.ip);
    } else if (!req.user) {
      await book.incrementView(null, req.ip);
    }
    
    res.json({
      success: true,
      data: {
        book
      }
    });
    
  } catch (error) {
    console.error('Get book by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching book'
    });
  }
};

// Update book 
const updateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const updates = req.body;
    
    
    const book = await Book.findById(bookId);
    
    if (!book || !book.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    if (book.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own books'
      });
    }
    
    
    const allowedUpdates = [
      'title', 'author', 'isbn', 'genre', 'description', 'condition',
      'language', 'pages', 'publishedYear', 'publisher', 'status',
      'exchangePreferences', 'location'
    ];
    
  
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      
      filteredUpdates.images = [...book.images, ...req.uploadedImages];
    }
    
    // Update book
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate('owner', 'username firstName lastName avatar');
    
    res.json({
      success: true,
      message: 'Book updated successfully',
      data: {
        book: updatedBook
      }
    });
    
  } catch (error) {
    console.error('Update book error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating book'
    });
  }
};

// Delete book 
const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const book = await Book.findById(bookId);
    
    if (!book || !book.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    if (book.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own books'
      });
    }
    
    // Soft delete 
    book.isActive = false;
    book.status = 'Unavailable';
    await book.save();
    
    
    if (book.images && book.images.length > 0) {
      try {
        const publicIds = book.images.map(img => img.publicId);
        await deleteImagesFromCloudinary(publicIds);
      } catch (imageError) {
        console.error('Error deleting images:', imageError);
        
      }
    }
    
   
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalBooksUploaded': -1 }
    });
    
    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting book'
    });
  }
};

// Get books by specific user
const getUserBooks = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const query = { 
      owner: userId,
      isActive: true
    };
    
    
    if (userId.toString() !== req.user._id.toString()) {
      query.status = 'Available';
    }
    
    const books = await Book.find(query)
      .populate('owner', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limit);
    
    res.json({
      success: true,
      data: {
        books,
        user: {
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          stats: user.stats
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    });
    
  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user books'
    });
  }
};


const searchBooks = async (req, res) => {
  try {
    const { q: searchTerm, ...filters } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    
    let query = Book.search(searchTerm, filters);
    
    const books = await query
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalBooks = await Book.search(searchTerm, filters).countDocuments();
    const totalPages = Math.ceil(totalBooks / limit);
    
    res.json({
      success: true,
      data: {
        books,
        searchTerm,
        filters: filters,
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    });
    
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching books'
    });
  }
};

// Find books nearby 
const findNearbyBooks = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 12 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude (lat) and longitude (lng) are required'
      });
    }
    
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates provided'
      });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates out of valid range'
      });
    }
    
    console.log(`🔍 Searching for books near: ${latitude}, ${longitude} within ${searchRadius}km`);
    
    
    const baseQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] 
          },
          $maxDistance: searchRadius * 1000 
        }
      },
      status: 'Available',
      isActive: true
    };
    
   
    if (req.query.genre) {
      baseQuery.genre = req.query.genre;
      console.log(`📚 Filtering by genre: ${req.query.genre}`);
    }
    
    if (req.query.condition) {
      const conditions = req.query.condition.split(',');
      baseQuery.condition = { $in: conditions };
      console.log(`🏷️ Filtering by conditions: ${conditions.join(', ')}`);
    }
    
    if (req.query.language) {
      baseQuery.language = req.query.language;
      console.log(`🌐 Filtering by language: ${req.query.language}`);
    }
    
    if (req.query.minYear) {
      baseQuery.publishedYear = { $gte: parseInt(req.query.minYear) };
      console.log(`📅 Filtering by min year: ${req.query.minYear}`);
    }
    
    if (req.query.maxYear) {
      baseQuery.publishedYear = { 
        ...baseQuery.publishedYear, 
        $lte: parseInt(req.query.maxYear) 
      };
      console.log(`📅 Filtering by max year: ${req.query.maxYear}`);
    }
    
    
    if (req.query.search) {
      baseQuery.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { author: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
      console.log(`🔍 Text search: ${req.query.search}`);
    }
    
    
    let books = await Book.find(baseQuery)
      .populate('owner', 'username firstName lastName avatar stats.rating')
      .limit(parseInt(limit));
    
    console.log(`📚 Found ${books.length} books matching criteria`);
    
    
    books = books.map(book => {
      
      const bookLng = book.location.coordinates[0];
      const bookLat = book.location.coordinates[1];
      
      const R = 6371; 
      const dLat = (bookLat - latitude) * Math.PI / 180;
      const dLng = (bookLng - longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(bookLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return {
        ...book.toObject(),
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        distanceText: distance < 1 ? 
          `${Math.round(distance * 1000)}m away` : 
          `${Math.round(distance * 100) / 100}km away`
      };
    });
    
    // Sort by distance 
    books.sort((a, b) => a.distance - b.distance);
    
    
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'popular':
          books.sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0));
          break;
        case 'newest':
          books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          books.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'title':
          books.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'author':
          books.sort((a, b) => a.author.localeCompare(b.author));
          break;
        default:
          
          break;
      }
    }
    
    // Get filter statistics for frontend
    const totalQuery = { ...baseQuery };
    delete totalQuery.location; 
    totalQuery.status = 'Available';
    totalQuery.isActive = true;
    
   
    res.json({
      success: true,
      data: {
        books,
        searchCenter: {
          latitude,
          longitude,
          address: req.query.address || `${latitude}, ${longitude}`
        },
        searchRadius: searchRadius,
        appliedFilters: {
          genre: req.query.genre || null,
          condition: req.query.condition ? req.query.condition.split(',') : null,
          language: req.query.language || null,
          search: req.query.search || null,
          minYear: req.query.minYear ? parseInt(req.query.minYear) : null,
          maxYear: req.query.maxYear ? parseInt(req.query.maxYear) : null,
          sortBy: req.query.sortBy || 'distance'
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1, 
          totalBooks: books.length,
          hasNextPage: false,
          hasPrevPage: false,
          limit: parseInt(limit)
        },
        summary: {
          message: `Found ${books.length} books within ${searchRadius}km${req.query.genre ? ` in ${req.query.genre} genre` : ''}${req.query.condition ? ` with condition: ${req.query.condition}` : ''}`,
          searchTime: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Find nearby books error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while finding nearby books',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get books near current user's location
const getBooksNearMe = async (req, res) => {
  try {
    
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user || !user.location || user.location.coordinates[0] === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please set your location first using PUT /api/auth/location'
      });
    }
    
    
    req.query.lat = user.location.coordinates[1]; // latitude
    req.query.lng = user.location.coordinates[0]; //longitude
    req.query.address = user.location.address || 'Your Location';
    
    
    return findNearbyBooks(req, res);
    
  } catch (error) {
    console.error('Get books near me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while finding books near you'
    });
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getUserBooks,
  searchBooks,
  findNearbyBooks,
  getBooksNearMe
};