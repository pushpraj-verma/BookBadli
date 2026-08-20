import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// Async thunks for book operations
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/books', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch books')
    }
  }
)

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/books/${bookId}`)
      return response.data.data.book
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch book')
    }
  }
)

export const createBook = createAsyncThunk(
  'books/createBook',
  async (bookData, { rejectWithValue }) => {
    try {
      const response = await api.post('/books', bookData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data.data.book
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create book')
    }
  }
)

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async ({ bookId, bookData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/books/${bookId}`, bookData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data.data.book
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update book')
    }
  }
)

export const deleteBook = createAsyncThunk(
  'books/deleteBook',
  async (bookId, { rejectWithValue }) => {
    try {
      await api.delete(`/books/${bookId}`)
      return bookId
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete book')
    }
  }
)

export const searchBooks = createAsyncThunk(
  'books/searchBooks',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/books/search', { params: searchParams })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Search failed')
    }
  }
)

export const fetchNearbyBooks = createAsyncThunk(
  'books/fetchNearbyBooks',
  async (locationParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/books/nearby', { params: locationParams })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to find nearby books')
    }
  }
)

export const fetchUserBooks = createAsyncThunk(
  'books/fetchUserBooks',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/books/user/${userId}`, { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user books')
    }
  }
)

export const fetchMyBooks = createAsyncThunk(
  'books/fetchMyBooks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/books/my/books', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch your books')
    }
  }
)

export const fetchFilterOptions = createAsyncThunk(
  'books/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/books/filters/options')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch filter options')
    }
  }
)

const initialState = {
  books: [],
  currentBook: null,
  userBooks: [],
  searchResults: [],
  nearbyBooks: [],
  filterOptions: {
    genres: [],
    conditions: [],
    languages: [],
    yearRange: { min: 1800, max: new Date().getFullYear() }
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12
  },
  loading: false,
  searchLoading: false,
  error: null,
  searchError: null,
  filters: {
    genre: '',
    condition: [],
    language: '',
    minYear: '',
    maxYear: '',
    search: '',
    sortBy: 'newest'
  }
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.searchError = null
    },
    clearCurrentBook: (state) => {
      state.currentBook = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        genre: '',
        condition: [],
        language: '',
        minYear: '',
        maxYear: '',
        search: '',
        sortBy: 'newest'
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = []
      state.searchError = null
    },
    updateBookInList: (state, action) => {
      const { bookId, updatedBook } = action.payload
      
      // Update in main books list
      const bookIndex = state.books.findIndex(book => book._id === bookId)
      if (bookIndex !== -1) {
        state.books[bookIndex] = updatedBook
      }

      // Update in user books list
      const userBookIndex = state.userBooks.findIndex(book => book._id === bookId)
      if (userBookIndex !== -1) {
        state.userBooks[userBookIndex] = updatedBook
      }

      // Update current book if it matches
      if (state.currentBook && state.currentBook._id === bookId) {
        state.currentBook = updatedBook
      }
    },
    removeBookFromList: (state, action) => {
      const bookId = action.payload
      
      state.books = state.books.filter(book => book._id !== bookId)
      state.userBooks = state.userBooks.filter(book => book._id !== bookId)
      state.searchResults = state.searchResults.filter(book => book._id !== bookId)
      
      if (state.currentBook && state.currentBook._id === bookId) {
        state.currentBook = null
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch books cases
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false
        state.books = action.payload.books
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch book by ID cases
      .addCase(fetchBookById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.loading = false
        state.currentBook = action.payload
        state.error = null
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create book cases
      .addCase(createBook.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBook.fulfilled, (state, action) => {
        state.loading = false
        state.books.unshift(action.payload)
        state.userBooks.unshift(action.payload)
        state.error = null
      })
      .addCase(createBook.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update book cases
      .addCase(updateBook.fulfilled, (state, action) => {
        const updatedBook = action.payload
        
        // Update in all relevant lists
        const updateInArray = (array) => {
          const index = array.findIndex(book => book._id === updatedBook._id)
          if (index !== -1) {
            array[index] = updatedBook
          }
        }
        
        updateInArray(state.books)
        updateInArray(state.userBooks)
        updateInArray(state.searchResults)
        
        if (state.currentBook && state.currentBook._id === updatedBook._id) {
          state.currentBook = updatedBook
        }
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.error = action.payload
      })

      // Delete book cases
      .addCase(deleteBook.fulfilled, (state, action) => {
        const bookId = action.payload
        state.books = state.books.filter(book => book._id !== bookId)
        state.userBooks = state.userBooks.filter(book => book._id !== bookId)
        state.searchResults = state.searchResults.filter(book => book._id !== bookId)
        
        if (state.currentBook && state.currentBook._id === bookId) {
          state.currentBook = null
        }
      })
      .addCase(deleteBook.rejected, (state, action) => {
        state.error = action.payload
      })

      // Search books cases
      .addCase(searchBooks.pending, (state) => {
        state.searchLoading = true
        state.searchError = null
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.searchLoading = false
        state.searchResults = action.payload.books
        state.searchError = null
      })
      .addCase(searchBooks.rejected, (state, action) => {
        state.searchLoading = false
        state.searchError = action.payload
      })

      // Fetch nearby books cases
      .addCase(fetchNearbyBooks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNearbyBooks.fulfilled, (state, action) => {
        state.loading = false
        state.nearbyBooks = action.payload.books
        state.error = null
      })
      .addCase(fetchNearbyBooks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch user books cases
      .addCase(fetchUserBooks.fulfilled, (state, action) => {
        state.userBooks = action.payload.books
        state.pagination = action.payload.pagination
      })
      .addCase(fetchUserBooks.rejected, (state, action) => {
        state.error = action.payload
      })

      // Fetch my books cases
      .addCase(fetchMyBooks.fulfilled, (state, action) => {
        state.userBooks = action.payload.books
        state.pagination = action.payload.pagination
      })
      .addCase(fetchMyBooks.rejected, (state, action) => {
        state.error = action.payload
      })

      // Fetch filter options cases
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = action.payload
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const {
  clearError,
  clearCurrentBook,
  setFilters,
  clearFilters,
  clearSearchResults,
  updateBookInList,
  removeBookFromList
} = booksSlice.actions

export default booksSlice.reducer