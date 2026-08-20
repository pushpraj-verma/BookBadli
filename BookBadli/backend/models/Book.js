
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Basic book information
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  
  isbn: {
    type: String,
    trim: true,
    sparse: true, 
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: [
      'Fiction',
      'Non-Fiction', 
      'Mystery & Thriller',
      'Romance',
      'Science Fiction',
      'Fantasy',
      'Biography',
      'History',
      'Science & Technology',
      'Self-Help',
      'Business',
      'Health & Fitness',
      'Children',
      'Young Adult',
      'Horror',
      'Adventure',
      'Poetry',
      'Drama',
      'Philosophy',
      'Religion & Spirituality',
      'Art & Design',
      'Travel',
      'Cooking',
      'Sports',
      'Politics',
      'Economics',
      'Education',
      'Other'
    ]
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: '',
    trim: true
  },
  
  // Physical book details
  condition: {
    type: String,
    required: [true, 'Book condition is required'],
    enum: {
      values: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
      message: 'Condition must be: New, Like New, Very Good, Good, Fair, or Poor'
    }
  },
  
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'English',
    trim: true
  },
  
  pages: {
    type: Number,
    min: [1, 'Pages must be at least 1'],
    max: [10000, 'Pages cannot exceed 10,000']
  },
  
  publishedYear: {
    type: Number,
    min: [1800, 'Published year must be after 1800'],
    max: [new Date().getFullYear(), 'Published year cannot be in the future'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Published year must be a valid integer'
    }
  },
  
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  
  // Book images from Cloudinary
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    publicId: {
      type: String, 
      required: [true, 'Image public ID is required']
    },
    isMain: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Owner information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: [true, 'Book owner is required']
  },
  
  // Location 
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;    // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    },
    address: {
      type: String,
      default: '',
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      default: '',
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      default: '',
      maxlength: [50, 'State name cannot exceed 50 characters']
    }
  },
  
  // Exchange preferences and settings
  exchangePreferences: {
    interestedGenres: [{
      type: String,
      enum: [
        'Fiction', 'Non-Fiction', 'Mystery & Thriller', 'Romance', 
        'Science Fiction', 'Fantasy', 'Biography', 'History', 
        'Science & Technology', 'Self-Help', 'Business', 'Health & Fitness',
        'Children', 'Young Adult', 'Horror', 'Adventure', 'Poetry', 
        'Drama', 'Philosophy', 'Religion & Spirituality', 'Art & Design', 
        'Travel', 'Cooking', 'Sports', 'Politics', 'Economics', 'Education', 'Other'
      ]
    }],
    maxDistance: {
      type: Number, // Maximum distance for exchange (in km)
      default: 10,
      min: [1, 'Distance must be at least 1 km'],
      max: [100, 'Distance cannot exceed 100 km']
    },
    preferredConditions: [{
      type: String,
      enum: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor']
    }],
    notes: {
      type: String,
      maxlength: [300, 'Exchange notes cannot exceed 300 characters'],
      default: '',
      trim: true
    }
  },
  
  // Availability and status
  status: {
    type: String,
    enum: {
      values: ['Available', 'Reserved', 'Exchanged', 'Unavailable'],
      message: 'Status must be: Available, Reserved, Exchanged, or Unavailable'
    },
    default: 'Available'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Exchange requests from other users
  exchangeRequests: [{
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending'
    },
    message: {
      type: String,
      maxlength: [500, 'Request message cannot exceed 500 characters'],
      trim: true
    },
    offeredBooks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book' // Books offered in exchange
    }],
    respondedAt: Date,
    response: {
      type: String,
      maxlength: [500, 'Response cannot exceed 500 characters'],
      trim: true
    }
  }],
  
  // Analytics and tracking
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    totalRequests: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: Date.now
    },
    viewHistory: [{
      viewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewedAt: {
        type: Date,
        default: Date.now
      },
      ipAddress: String
    }]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
bookSchema.index({ location: '2dsphere' }); // Geospatial queries for nearby books
bookSchema.index({ title: 'text', author: 'text', description: 'text' }); // Full-text search
bookSchema.index({ genre: 1, condition: 1 }); // Filter by genre and condition
bookSchema.index({ owner: 1 }); // Find books by owner
bookSchema.index({ status: 1, isActive: 1 }); // Find available books
bookSchema.index({ createdAt: -1 }); // Sort by newest first
bookSchema.index({ 'analytics.views': -1 }); // Popular books

// Update the updatedAt field before saving
bookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure at least one image is marked as main
bookSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const hasMainImage = this.images.some(img => img.isMain);
    if (!hasMainImage) {
      this.images[0].isMain = true; // Make first image main if none selected
    }
  }
  next();
});

// Static method to find books near a location
bookSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 
      }
    },
    status: 'Available',
    isActive: true
  }).populate('owner', 'username firstName lastName avatar');
};

// Static method for advanced search
bookSchema.statics.search = function(searchTerm, filters = {}) {
  const query = {
    status: 'Available',
    isActive: true
  };
  
  // Text search
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  // Apply filters
  if (filters.genre) query.genre = filters.genre;
  if (filters.condition) query.condition = { $in: filters.condition };
  if (filters.language) query.language = filters.language;
  if (filters.minYear) query.publishedYear = { $gte: filters.minYear };
  if (filters.maxYear) query.publishedYear = { ...query.publishedYear, $lte: filters.maxYear };
  
  return this.find(query).populate('owner', 'username firstName lastName avatar');
};

// Instance method to increment view count
bookSchema.methods.incrementView = function(viewerId = null, ipAddress = null) {
  this.analytics.views += 1;
  this.analytics.lastViewedAt = new Date();
  
  if (viewerId) {
    this.analytics.viewHistory.push({
      viewer: viewerId,
      viewedAt: new Date(),
      ipAddress
    });
    
    // Keep only last 100 views to prevent bloating
    if (this.analytics.viewHistory.length > 100) {
      this.analytics.viewHistory = this.analytics.viewHistory.slice(-100);
    }
  }
  
  return this.save();
};

// Instance method to add exchange request
bookSchema.methods.addExchangeRequest = function(requestData) {
  this.exchangeRequests.push(requestData);
  this.analytics.totalRequests += 1;
  return this.save();
};

// Instance method to get main image
bookSchema.methods.getMainImage = function() {
  const mainImage = this.images.find(img => img.isMain);
  return mainImage || this.images[0] || null;
};

// Virtual for book age
bookSchema.virtual('bookAge').get(function() {
  if (!this.publishedYear) return null;
  return new Date().getFullYear() - this.publishedYear;
});

// Include virtuals in JSON output
bookSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);