const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phoneNumber, address, city, state } = req.body;
    
    
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: username, email, password, firstName, lastName'
      });
    }
    
    //user already exists?
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken'
        });
      }
    }
    
    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber || '',
      location: {
        address: address || '',
        city: city || '',
        state: state || ''
      }
    });
    
    
    await user.save();
    
    
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
   
    user.lastLoginAt = new Date();
    await user.save();
    
  
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to BookBadli!',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '7d'
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error during registration. Please try again.'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email/username and password'
      });
    }
    
    // Finding user by email or username 
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    }).select('+password'); 
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.'
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
   
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    
    user.lastLoginAt = new Date();
    await user.save();
    
    
    user.password = undefined;
    
    res.json({
      success: true,
      message: 'Login successful! Welcome back to BookBadli!',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '7d'
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login. Please try again.'
    });
  }
};

// current user profile
const getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    
   
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'phoneNumber', 'avatar',
      'preferences', 'location'
    ];
    
    
    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });
    
   
    if (updates.location) {
      updates.location = {
        ...updates.location,
        type: 'Point' 
      };
    }
    
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
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
      error: 'Server error while updating profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both current and new password'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }
    
    
    const user = await User.findById(req.user._id).select('+password');
    
    
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while changing password'
    });
  }
};

// Logout 
const logout = async (req, res) => {
  try {
    
    
    await User.findByIdAndUpdate(req.user._id, {
      lastLogoutAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required to delete account'
      });
    }
    
    
    const user = await User.findById(req.user._id).select('+password');
    
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect'
      });
    }
    
    // Soft delete 
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Account deactivated successfully. Contact support to reactivate.'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting account'
    });
  }
};

// Update user location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, city, state } = req.body;
    
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: 'Latitude must be between -90 and 90'
      });
    }
    
    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Longitude must be between -180 and 180'
      });
    }
    
    // Update user location
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB expects [longitude, latitude]
          address: address ? address.trim() : '',
          city: city ? city.trim() : '',
          state: state ? state.trim() : ''
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        user,
        coordinates: {
          latitude: lat,
          longitude: lng
        },
        address: user.location.address,
        city: user.location.city,
        state: user.location.state
      }
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating location'
    });
  }
};

// Get user's current location
const getLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('location');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if location is set 
    const hasLocation = user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0;
    
    res.json({
      success: true,
      data: {
        hasLocation,
        coordinates: hasLocation ? {
          latitude: user.location.coordinates[1],
          longitude: user.location.coordinates[0]
        } : null,
        address: user.location.address,
        city: user.location.city,
        state: user.location.state,
        message: hasLocation ? 'Location is set' : 'Location not set yet'
      }
    });
    
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching location'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
  updateLocation,
  getLocation
};