
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No valid token provided.' 
      });
    }
    
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }
    
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found. Invalid token.' 
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account has been deactivated.' 
      });
    }
    
    
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token format.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token has expired. Please login again.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error during authentication.' 
    });
  }
};


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
    
   
    next();
  } catch (error) {
    
    next();
  }
};


const adminAuth = async (req, res, next) => {
  try {
    
    await auth(req, res, () => {});
    
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error during admin authentication.'
    });
  }
};


const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({ 
          success: false,
          error: 'Resource ID is required.' 
        });
      }
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ 
          success: false,
          error: 'Resource not found.' 
        });
      }
      
      
      if (resource.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. You can only modify your own resources.' 
        });
      }
      
      
      req.resource = resource;
      next();
      
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error during ownership verification.' 
      });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d', 
      issuer: 'BookBadli',
      audience: 'BookBadli-Users'
    }
  );
};

// Generate refresh token 
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { 
      expiresIn: '30d', // Refresh token expires in 30 days
      issuer: 'BookBadli',
      audience: 'BookBadli-Users'
    }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  checkOwnership,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};