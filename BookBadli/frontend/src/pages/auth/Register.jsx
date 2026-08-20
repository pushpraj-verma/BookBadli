import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, BookOpen } from 'lucide-react'
import { registerUser, clearError } from '../../store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { isValidEmail } from '@/lib/utils'

const Register = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, registerError, isAuthenticated } = useSelector(state => state.auth)
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Clear errors on component mount
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const validateForm = () => {
    const newErrors = {}

    // Required fields validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear general register error
    if (registerError) {
      dispatch(clearError())
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Remove confirmPassword from submission data
    const { confirmPassword, ...submitData } = formData

    try {
      await dispatch(registerUser(submitData)).unwrap()
      // Navigation will happen automatically via useEffect
    } catch (error) {
      // Error is handled by Redux
      console.error('Registration failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <BookOpen className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold text-gray-900">BookBadli</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign up for BookBadli</CardTitle>
          </CardHeader>
          <CardContent>
            {registerError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{registerError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? 'border-red-500' : ''}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? 'border-red-500' : ''}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? 'border-red-500' : ''}
                  placeholder="johndoe"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Fields */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Optional Information */}
              <div>
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Location Information */}
              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City (Optional)</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State (Optional)</Label>
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="accept-terms" className="ml-2 text-sm">
                  I agree to the{' '}
                  <Link to="#" className="text-blue-600 hover:text-blue-500">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600">{errors.terms}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Sign in to your account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Info */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-2">Join thousands of book lovers!</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Exchange books without spending money</li>
            <li>• Find books near your location</li>
            <li>• Connect with like-minded readers</li>
            <li>• Build your dream library</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Register