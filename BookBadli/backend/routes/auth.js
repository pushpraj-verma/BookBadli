
const express = require('express');
const router = express.Router();


const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  deleteAccount,
  updateLocation,
  getLocation
} = require('../controllers/authController');


const { auth } = require('../middleware/auth');

//public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes 
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/logout', auth, logout);
router.delete('/account', auth, deleteAccount);

// Location management routes
router.put('/location', auth, updateLocation);
router.get('/location', auth, getLocation);


router.get('/test', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working! You are logged in.',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router;


