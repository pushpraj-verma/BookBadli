import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ emailOrUsername, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', {
        emailOrUsername,
        password
      })
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.data.tokens.accessToken)
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken)
      
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.data.tokens.accessToken)
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken)
      
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed')
    }
  }
)

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/profile')
      return response.data.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch profile')
    }
  }
)

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', userData)
      return response.data.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile')
    }
  }
)

export const updateUserLocation = createAsyncThunk(
  'auth/updateUserLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/location', locationData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update location')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout')
      // Clear tokens from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return true
    } catch (error) {
      // Even if API call fails, clear tokens locally
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return true
    }
  }
)

// Get token from localStorage for initial state
const getStoredToken = () => {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

const initialState = {
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,
  loginError: null,
  registerError: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.loginError = null
      state.registerError = null
    },
    clearUser: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.loginError = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.tokens.accessToken
        state.isAuthenticated = true
        state.loginError = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.loginError = action.payload
        state.isAuthenticated = false
      })

      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.registerError = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.tokens.accessToken
        state.isAuthenticated = true
        state.registerError = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.registerError = action.payload
        state.isAuthenticated = false
      })

      // Fetch profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update profile cases
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload
        state.error = null
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload
      })

      // Update location cases
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload.user }
        }
        state.error = null
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.error = action.payload
      })

      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
      })
  }
})

export const { clearError, clearUser, setCredentials } = authSlice.actions
export default authSlice.reducer