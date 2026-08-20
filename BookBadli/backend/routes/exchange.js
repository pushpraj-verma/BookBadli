
const express = require('express');
const router = express.Router();


const {
  requestBookExchange,
  respondToExchangeRequest,
  getMyRequests,
  getIncomingRequests,
  markExchangeComplete
} = require('../controllers/exchangeController');


const { auth } = require('../middleware/auth');


router.use(auth);

// Exchange request management
router.post('/books/:bookId/request', requestBookExchange);
router.put('/books/:bookId/requests/:requestId/respond', respondToExchangeRequest);
router.put('/books/:bookId/requests/:requestId/complete', markExchangeComplete);

// User's exchange requests
router.get('/my/requests', getMyRequests);           
router.get('/my/incoming', getIncomingRequests);     

// Get exchange statistics
router.get('/stats', async (req, res) => {
  try {
    const Book = require('../models/Book');
    
    
    const userBooks = await Book.find({ owner: req.user._id, isActive: true });
    
    let totalRequestsReceived = 0;
    let acceptedRequests = 0;
    let completedExchanges = 0;
    
    userBooks.forEach(book => {
      totalRequestsReceived += book.exchangeRequests.length;
      acceptedRequests += book.exchangeRequests.filter(req => req.status === 'Accepted').length;
      completedExchanges += book.exchangeRequests.filter(req => req.status === 'Completed').length;
    });
    
    // Get requests sent by user
    const requestsSent = await Book.aggregate([
      { $match: { 'exchangeRequests.requester': req.user._id } },
      { $unwind: '$exchangeRequests' },
      { $match: { 'exchangeRequests.requester': req.user._id } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    
    const totalRequestsSent = requestsSent.length > 0 ? requestsSent[0].total : 0;
    
    res.json({
      success: true,
      data: {
        requestsReceived: totalRequestsReceived,
        requestsSent: totalRequestsSent,
        acceptedRequests,
        completedExchanges,
        responseRate: totalRequestsReceived > 0 ? 
          ((acceptedRequests / totalRequestsReceived) * 100).toFixed(1) : 0,
        completionRate: acceptedRequests > 0 ? 
          ((completedExchanges / acceptedRequests) * 100).toFixed(1) : 0
      }
    });
    
  } catch (error) {
    console.error('Exchange stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching exchange statistics'
    });
  }
});

module.exports = router;