const Book = require('../models/Book');
const User = require('../models/User');

// Request book exchange
const requestBookExchange = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { message, offeredBooks } = req.body;
    const requesterId = req.user._id;

    // Find the requested book
    const book = await Book.findById(bookId).populate('owner', 'username firstName lastName email');

    if (!book || !book.isActive || book.status !== 'Available') {
      return res.status(404).json({
        success: false,
        error: 'Book not found or not available for exchange'
      });
    }

    // Check if user is trying to request their own book
    if (book.owner._id.toString() === requesterId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot request your own book'
      });
    }

    // Check if user already has a pending request for this book
    const existingRequest = book.exchangeRequests.find(
      req => req.requester.toString() === requesterId.toString() && req.status === 'Pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending request for this book'
      });
    }

    // Validate offered books 
    let validOfferedBooks = [];
    if (offeredBooks && offeredBooks.length > 0) {
      const userBooks = await Book.find({
        _id: { $in: offeredBooks },
        owner: requesterId,
        status: 'Available',
        isActive: true
      });

      if (userBooks.length !== offeredBooks.length) {
        return res.status(400).json({
          success: false,
          error: 'Some offered books are not valid or not available'
        });
      }

      validOfferedBooks = userBooks.map(book => book._id);
    }

    // Create exchange request
    const exchangeRequest = {
      requester: requesterId,
      requestedAt: new Date(),
      status: 'Pending',
      message: message || `Hi! I'm interested in exchanging books with you.`,
      offeredBooks: validOfferedBooks,
      response: '',
      respondedAt: null
    };

    // Add request to book
    book.exchangeRequests.push(exchangeRequest);
    book.analytics.totalRequests += 1;
    await book.save();

    // Populate the request for response
    await book.populate({
      path: 'exchangeRequests.requester',
      select: 'username firstName lastName avatar'
    });

    await book.populate({
      path: 'exchangeRequests.offeredBooks',
      select: 'title author images condition'
    });

    const newRequest = book.exchangeRequests[book.exchangeRequests.length - 1];

    res.status(201).json({
      success: true,
      message: 'Exchange request sent successfully!',
      data: {
        request: newRequest,
        book: {
          _id: book._id,
          title: book.title,
          author: book.author,
          owner: book.owner
        }
      }
    });

  } catch (error) {
    console.error('Request exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while requesting book exchange'
    });
  }
};

// Respond to exchange request 
const respondToExchangeRequest = async (req, res) => {
  try {
    const { bookId, requestId } = req.params;
    const { action, response } = req.body; // action: 'accept' or 'reject'
    const ownerId = req.user._id;

    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "accept" or "reject"'
      });
    }

    // Find the book and verify ownership
    const book = await Book.findById(bookId);
    if (!book || book.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only respond to requests for your own books'
      });
    }

    // Find the exchange request
    const requestIndex = book.exchangeRequests.findIndex(
      req => req._id.toString() === requestId && req.status === 'Pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Exchange request not found or already responded to'
      });
    }

    // Update the request
    const exchangeRequest = book.exchangeRequests[requestIndex];
    exchangeRequest.status = action === 'accept' ? 'Accepted' : 'Rejected';
    exchangeRequest.response = response || (action === 'accept' ? 'Request accepted!' : 'Request rejected');
    exchangeRequest.respondedAt = new Date();

    // If accepted, update book status to Reserved
    if (action === 'accept') {
      book.status = 'Reserved';
      
      // Reject all other pending requests for this book
      book.exchangeRequests.forEach((req, index) => {
        if (index !== requestIndex && req.status === 'Pending') {
          req.status = 'Rejected';
          req.response = 'Book was reserved for another exchange';
          req.respondedAt = new Date();
        }
      });
    }

    await book.save();

    // Populate for response
    await book.populate({
      path: 'exchangeRequests.requester',
      select: 'username firstName lastName avatar'
    });

    await book.populate({
      path: 'exchangeRequests.offeredBooks',
      select: 'title author images condition'
    });

    const updatedRequest = book.exchangeRequests[requestIndex];

    res.json({
      success: true,
      message: `Exchange request ${action}ed successfully!`,
      data: {
        request: updatedRequest,
        book: {
          _id: book._id,
          title: book.title,
          author: book.author,
          status: book.status
        },
        chatEnabled: action === 'accept'
      }
    });

  } catch (error) {
    console.error('Respond to exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while responding to exchange request'
    });
  }
};


const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find books with requests from this user
    const booksWithMyRequests = await Book.find({
      'exchangeRequests.requester': userId,
      isActive: true
    })
    .populate('owner', 'username firstName lastName avatar')
    .populate({
      path: 'exchangeRequests.offeredBooks',
      select: 'title author images condition'
    })
    .sort({ 'exchangeRequests.requestedAt': -1 })
    .skip(skip)
    .limit(limit);

    
    const myRequests = [];
    booksWithMyRequests.forEach(book => {
      const userRequests = book.exchangeRequests.filter(
        req => req.requester.toString() === userId.toString()
      );
      
      userRequests.forEach(request => {
        myRequests.push({
          _id: request._id,
          book: {
            _id: book._id,
            title: book.title,
            author: book.author,
            images: book.images,
            owner: book.owner,
            status: book.status
          },
          requestedAt: request.requestedAt,
          status: request.status,
          message: request.message,
          response: request.response,
          respondedAt: request.respondedAt,
          offeredBooks: request.offeredBooks,
          canChat: request.status === 'Accepted'
        });
      });
    });

    const totalRequests = myRequests.length;
    const totalPages = Math.ceil(totalRequests / limit);

    res.json({
      success: true,
      data: {
        requests: myRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalRequests,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching your exchange requests'
    });
  }
};

// Get exchange requests received by current user 
const getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find user's books that have exchange requests
    const userBooksWithRequests = await Book.find({
      owner: userId,
      'exchangeRequests.0': { $exists: true }, 
      isActive: true
    })
    .populate({
      path: 'exchangeRequests.requester',
      select: 'username firstName lastName avatar stats.rating'
    })
    .populate({
      path: 'exchangeRequests.offeredBooks',
      select: 'title author images condition'
    })
    .sort({ 'exchangeRequests.requestedAt': -1 })
    .skip(skip)
    .limit(limit);

    
    const incomingRequests = [];
    userBooksWithRequests.forEach(book => {
      book.exchangeRequests.forEach(request => {
        incomingRequests.push({
          _id: request._id,
          book: {
            _id: book._id,
            title: book.title,
            author: book.author,
            images: book.images,
            status: book.status
          },
          requester: request.requester,
          requestedAt: request.requestedAt,
          status: request.status,
          message: request.message,
          response: request.response,
          respondedAt: request.respondedAt,
          offeredBooks: request.offeredBooks,
          canChat: request.status === 'Accepted'
        });
      });
    });

    const totalRequests = incomingRequests.length;
    const totalPages = Math.ceil(totalRequests / limit);

    res.json({
      success: true,
      data: {
        requests: incomingRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalRequests,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching incoming exchange requests'
    });
  }
};


const markExchangeComplete = async (req, res) => {
  try {
    const { bookId, requestId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;

    
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    const requestIndex = book.exchangeRequests.findIndex(
      req => req._id.toString() === requestId && req.status === 'Accepted'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Exchange request not found or not accepted'
      });
    }

    const exchangeRequest = book.exchangeRequests[requestIndex];
    
  
    if (book.owner.toString() !== userId.toString() && 
        exchangeRequest.requester.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this exchange'
      });
    }

    // Mark exchange as completed
    exchangeRequest.status = 'Completed';
    exchangeRequest.completedAt = new Date();
    book.status = 'Exchanged';

    
    await User.findByIdAndUpdate(book.owner, {
      $inc: { 'stats.totalExchanges': 1 }
    });

    await User.findByIdAndUpdate(exchangeRequest.requester, {
      $inc: { 'stats.totalExchanges': 1 }
    });

    await book.save();

    res.json({
      success: true,
      message: 'Exchange marked as completed successfully!',
      data: {
        request: exchangeRequest,
        book: {
          _id: book._id,
          title: book.title,
          status: book.status
        }
      }
    });

  } catch (error) {
    console.error('Mark exchange complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking exchange as complete'
    });
  }
};

module.exports = {
  requestBookExchange,
  respondToExchangeRequest,
  getMyRequests,
  getIncomingRequests,
  markExchangeComplete
};