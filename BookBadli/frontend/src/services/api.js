import axios from 'axios'

// Create API instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.error('Access denied:', error.response.data?.error)
    }
    
    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data?.error)
    }
    
    return Promise.reject(error)
  }
)

// Auth API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  logout: () => api.post('/auth/logout'),
  deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
  updateLocation: (locationData) => api.put('/auth/location', locationData),
  getLocation: () => api.get('/auth/location')
}

// Books API methods
export const booksAPI = {
  getAllBooks: (params) => api.get('/books', { params }),
  getBookById: (id) => api.get(`/books/${id}`),
  createBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
  searchBooks: (params) => api.get('/books/search', { params }),
  getNearbyBooks: (params) => api.get('/books/nearby', { params }),
  getUserBooks: (userId, params) => api.get(`/books/user/${userId}`, { params }),
  getMyBooks: (params) => api.get('/books/my/books', { params }),
  getBooksNearMe: (params) => api.get('/books/my/nearby', { params }),
  uploadImages: (imageFiles) => {
    const formData = new FormData()
    imageFiles.forEach(file => formData.append('images', file))
    return api.post('/books/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getFilterOptions: () => api.get('/books/filters/options'),
  getBookStats: () => api.get('/books/stats/overview'),
  validateBook: (bookData) => api.post('/books/validate', bookData)
}

// Exchange API methods
export const exchangeAPI = {
  requestExchange: (bookId, requestData) => 
    api.post(`/exchange/books/${bookId}/request`, requestData),
  respondToRequest: (bookId, requestId, responseData) =>
    api.put(`/exchange/books/${bookId}/requests/${requestId}/respond`, responseData),
  markComplete: (bookId, requestId, completionData) =>
    api.put(`/exchange/books/${bookId}/requests/${requestId}/complete`, completionData),
  getMyRequests: (params) => api.get('/exchange/my/requests', { params }),
  getIncomingRequests: (params) => api.get('/exchange/my/incoming', { params }),
  getExchangeStats: () => api.get('/exchange/stats')
}

// Utility functions for API calls
export const apiUtils = {
  // Handle file upload with progress
  uploadWithProgress: (url, formData, onProgress) => {
    return api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        if (onProgress) onProgress(progress)
      }
    })
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },
  
  // Get stored token
  getToken: () => {
    return localStorage.getItem('token')
  },
  
  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
}

export default api