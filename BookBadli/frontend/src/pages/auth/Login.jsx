import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, BookOpen } from 'lucide-react'
import { loginUser, clearError } from '../../store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, loginError, isAuthenticated } = useSelector(state => state.auth)
  
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

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
    
    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
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
    
    // Clear general login error
    if (loginError) {
      dispatch(clearError())
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await dispatch(loginUser(formData)).unwrap()
      // Navigation will happen automatically via useEffect
    } catch (error) {
      // Error is handled by Redux
      console.error('Login failed:', error)
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
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="emailOrUsername">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  className={errors.emailOrUsername ? 'border-red-500' : ''}
                  placeholder="Enter your email or username"
                />
                {errors.emailOrUsername && (
                  <p className="mt-1 text-sm text-red-600">{errors.emailOrUsername}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="remember-me" className="ml-2 text-sm">
                    Remember me
                  </Label>
                </div>

                <div className="text-sm">
                  <Link to="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to BookBadli?</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/register')}
                >
                  Create your account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Account Info */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>Demo Account:</strong><br />
            Email: demo@bookbadli.com | Password: demo123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login