
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  
  // Profile information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  avatar: {
    type: String, // URL to profile picture from Cloudinary
    default: ''
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  phoneNumber: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    default: ''
  },
  
  // Location for nearby book matching
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
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
  
  // User preferences for book exchange
  preferences: {
    maxDistance: {
      type: Number, // Maximum distance for book exchanges (in km)
      default: 10,
      min: [1, 'Distance must be at least 1 km'],
      max: [100, 'Distance cannot exceed 100 km']
    },
    favoriteGenres: [{
      type: String,
      enum: [
        'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
        'Fantasy', 'Biography', 'History', 'Science', 'Technology',
        'Self-Help', 'Business', 'Health', 'Children', 'Young Adult',
        'Horror', 'Adventure', 'Poetry', 'Drama', 'Philosophy',
        'Religion', 'Art', 'Travel', 'Cooking', 'Other'
      ]
    }],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      newBooksNearby: {
        type: Boolean,
        default: true
      },
      exchangeRequests: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Account status and verification
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Activity tracking
  stats: {
    totalBooksUploaded: {
      type: Number,
      default: 0
    },
    totalExchanges: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
userSchema.index({ location: '2dsphere' }); // For location-based searches
userSchema.index({ email: 1 }); // For login queries
userSchema.index({ username: 1 }); // For profile searches

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user's full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to calculate user rating
userSchema.methods.calculateRating = function() {
  if (this.stats.totalRatings === 0) return 0;
  return (this.stats.rating / this.stats.totalRatings).toFixed(1);
};

// Remove sensitive information from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find users near a location
userSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('User', userSchema);