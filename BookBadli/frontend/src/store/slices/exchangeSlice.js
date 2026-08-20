import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// Async thunks for exchange operations
export const requestBookExchange = createAsyncThunk(
  'exchange/requestBookExchange',
  async ({ bookId, message, offeredBooks }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/exchange/books/${bookId}/request`, {
        message,
        offeredBooks
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send exchange request')
    }
  }
)

export const respondToExchangeRequest = createAsyncThunk(
  'exchange/respondToExchangeRequest',
  async ({ bookId, requestId, action, response }, { rejectWithValue }) => {
    try {
      const apiResponse = await api.put(`/exchange/books/${bookId}/requests/${requestId}/respond`, {
        action,
        response
      })
      return apiResponse.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to respond to exchange request')
    }
  }
)

export const fetchMyRequests = createAsyncThunk(
  'exchange/fetchMyRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/exchange/my/requests', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch your requests')
    }
  }
)

export const fetchIncomingRequests = createAsyncThunk(
  'exchange/fetchIncomingRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/exchange/my/incoming', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch incoming requests')
    }
  }
)

export const markExchangeComplete = createAsyncThunk(
  'exchange/markExchangeComplete',
  async ({ bookId, requestId, rating, review }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/exchange/books/${bookId}/requests/${requestId}/complete`, {
        rating,
        review
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark exchange as complete')
    }
  }
)

export const fetchExchangeStats = createAsyncThunk(
  'exchange/fetchExchangeStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/exchange/stats')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch exchange statistics')
    }
  }
)

const initialState = {
  myRequests: [],
  incomingRequests: [],
  exchangeStats: {
    requestsReceived: 0,
    requestsSent: 0,
    acceptedRequests: 0,
    completedExchanges: 0,
    responseRate: 0,
    completionRate: 0
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  },
  loading: false,
  requestLoading: false,
  error: null,
  successMessage: null
}

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null
    },
    updateRequestStatus: (state, action) => {
      const { requestId, status, response } = action.payload
      
      // Update in myRequests
      const myRequestIndex = state.myRequests.findIndex(req => req._id === requestId)
      if (myRequestIndex !== -1) {
        state.myRequests[myRequestIndex].status = status
        if (response) {
          state.myRequests[myRequestIndex].response = response
        }
        state.myRequests[myRequestIndex].respondedAt = new Date().toISOString()
      }

      // Update in incomingRequests
      const incomingRequestIndex = state.incomingRequests.findIndex(req => req._id === requestId)
      if (incomingRequestIndex !== -1) {
        state.incomingRequests[incomingRequestIndex].status = status
        if (response) {
          state.incomingRequests[incomingRequestIndex].response = response
        }
        state.incomingRequests[incomingRequestIndex].respondedAt = new Date().toISOString()
      }
    },
    removeRequest: (state, action) => {
      const requestId = action.payload
      state.myRequests = state.myRequests.filter(req => req._id !== requestId)
      state.incomingRequests = state.incomingRequests.filter(req => req._id !== requestId)
    }
  },
  extraReducers: (builder) => {
    builder
      // Request book exchange cases
      .addCase(requestBookExchange.pending, (state) => {
        state.requestLoading = true
        state.error = null
      })
      .addCase(requestBookExchange.fulfilled, (state, action) => {
        state.requestLoading = false
        state.myRequests.unshift(action.payload.request)
        state.successMessage = 'Exchange request sent successfully!'
        state.error = null
      })
      .addCase(requestBookExchange.rejected, (state, action) => {
        state.requestLoading = false
        state.error = action.payload
      })

      // Respond to exchange request cases
      .addCase(respondToExchangeRequest.pending, (state) => {
        state.requestLoading = true
        state.error = null
      })
      .addCase(respondToExchangeRequest.fulfilled, (state, action) => {
        state.requestLoading = false
        const updatedRequest = action.payload.request
        
        // Update the request in incomingRequests
        const requestIndex = state.incomingRequests.findIndex(
          req => req._id === updatedRequest._id
        )
        if (requestIndex !== -1) {
          state.incomingRequests[requestIndex] = updatedRequest
        }
        
        state.successMessage = `Exchange request ${updatedRequest.status.toLowerCase()} successfully!`
        state.error = null
      })
      .addCase(respondToExchangeRequest.rejected, (state, action) => {
        state.requestLoading = false
        state.error = action.payload
      })

      // Fetch my requests cases
      .addCase(fetchMyRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.loading = false
        state.myRequests = action.payload.requests
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch incoming requests cases
      .addCase(fetchIncomingRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.loading = false
        state.incomingRequests = action.payload.requests
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchIncomingRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Mark exchange complete cases
      .addCase(markExchangeComplete.pending, (state) => {
        state.requestLoading = true
        state.error = null
      })
      .addCase(markExchangeComplete.fulfilled, (state, action) => {
        state.requestLoading = false
        const completedRequest = action.payload.request
        
        // Update request status in both arrays
        const updateInArray = (array) => {
          const index = array.findIndex(req => req._id === completedRequest._id)
          if (index !== -1) {
            array[index].status = 'Completed'
            array[index].completedAt = completedRequest.completedAt
          }
        }
        
        updateInArray(state.myRequests)
        updateInArray(state.incomingRequests)
        
        state.successMessage = 'Exchange marked as completed successfully!'
        state.error = null
      })
      .addCase(markExchangeComplete.rejected, (state, action) => {
        state.requestLoading = false
        state.error = action.payload
      })

      // Fetch exchange stats cases
      .addCase(fetchExchangeStats.fulfilled, (state, action) => {
        state.exchangeStats = action.payload
      })
      .addCase(fetchExchangeStats.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const {
  clearError,
  clearSuccessMessage,
  updateRequestStatus,
  removeRequest
} = exchangeSlice.actions

export default exchangeSlice.reducer