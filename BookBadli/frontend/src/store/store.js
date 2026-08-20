import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import booksReducer from './slices/bookSlice'
import exchangeReducer from './slices/exchangeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    exchange: exchangeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
})

export default store