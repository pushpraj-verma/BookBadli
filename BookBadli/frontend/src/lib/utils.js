import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format date functions
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(dateString)
}

// Distance formatting
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`
  }
  return `${Math.round(distance * 10) / 10}km away`
}

// Capitalize first letter
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Generate avatar initials
export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

// Book condition colors
export const getConditionColor = (condition) => {
  const colors = {
    'New': 'bg-green-100 text-green-800',
    'Like New': 'bg-green-100 text-green-800',
    'Very Good': 'bg-blue-100 text-blue-800',
    'Good': 'bg-yellow-100 text-yellow-800',
    'Fair': 'bg-orange-100 text-orange-800',
    'Poor': 'bg-red-100 text-red-800'
  }
  return colors[condition] || 'bg-gray-100 text-gray-800'
}

// Exchange status colors
export const getExchangeStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Accepted': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Cancelled': 'bg-gray-100 text-gray-800',
    'Completed': 'bg-blue-100 text-blue-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// File validation
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }
  
  return { valid: true }
}

// Generate placeholder image URL
export const getPlaceholderImageUrl = (width = 400, height = 600, text = 'Book Cover') => {
  return `https://via.placeholder.com/${width}x${height}.png?text=${encodeURIComponent(text)}`
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}