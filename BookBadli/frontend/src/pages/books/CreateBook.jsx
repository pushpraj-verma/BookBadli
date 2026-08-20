import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Upload, X, Camera, MapPin, ChevronRight, AlertCircle } from 'lucide-react'
import { createBook } from '../../store/slices/bookSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { validateImageFile } from '@/lib/utils'

const CreateBook = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { loading, error } = useSelector(state => state.books)

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    condition: '',
    language: 'English',
    pages: '',
    publishedYear: '',
    publisher: '',
    description: '',
    // Exchange preferences
    interestedGenres: [],
    maxDistance: 10,
    preferredConditions: [],
    notes: ''
  })

  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const [useUserLocation, setUseUserLocation] = useState(true)

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery & Thriller', 'Romance', 
    'Science Fiction', 'Fantasy', 'Biography', 'History',
    'Science & Technology', 'Self-Help', 'Business', 'Health & Fitness',
    'Children', 'Young Adult', 'Horror', 'Adventure', 'Poetry',
    'Drama', 'Philosophy', 'Religion & Spirituality', 'Art & Design',
    'Travel', 'Cooking', 'Sports', 'Politics', 'Economics', 'Education', 'Other'
  ]

  const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    
    if (images.length + files.length > 5) {
      setErrors(prev => ({
        ...prev,
        images: 'Maximum 5 images allowed'
      }))
      return
    }

    // Validate each file
    const validFiles = []
    const newPreviews = []

    files.forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result)
          if (newPreviews.length === validFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      } else {
        setErrors(prev => ({
          ...prev,
          images: validation.error
        }))
      }
    })

    setImages(prev => [...prev, ...validFiles])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validateStep1 = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters'
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required'
    } else if (formData.author.length > 100) {
      newErrors.author = 'Author cannot exceed 100 characters'
    }

    if (!formData.genre) {
      newErrors.genre = 'Genre is required'
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required'
    }

    if (formData.pages && (formData.pages < 1 || formData.pages > 10000)) {
      newErrors.pages = 'Pages must be between 1 and 10,000'
    }

    if (formData.publishedYear) {
      const year = parseInt(formData.publishedYear)
      const currentYear = new Date().getFullYear()
      if (year < 1800 || year > currentYear) {
        newErrors.publishedYear = `Year must be between 1800 and ${currentYear}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateStep1()) {
      setCurrentStep(1)
      return
    }

    if (images.length === 0) {
      setErrors(prev => ({
        ...prev,
        images: 'At least one image is required'
      }))
      setCurrentStep(2)
      return
    }

    try {
      // Create FormData for multipart upload
      const submitData = new FormData()

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          if (Array.isArray(formData[key])) {
            submitData.append(key, JSON.stringify(formData[key]))
          } else {
            submitData.append(key, formData[key])
          }
        }
      })

      // Add images
      images.forEach((image, index) => {
        submitData.append('images', image)
      })

      // Add location data if using user location
      if (useUserLocation && user?.location) {
        submitData.append('latitude', user.location.coordinates[1])
        submitData.append('longitude', user.location.coordinates[0])
        submitData.append('address', user.location.address || '')
        submitData.append('city', user.location.city || '')
        submitData.append('state', user.location.state || '')
      }

      await dispatch(createBook(submitData)).unwrap()
      
      // Success - navigate to user's books
      navigate('/my-books')
    } catch (error) {
      console.error('Error creating book:', error)
      setErrors(prev => ({
        ...prev,
        submit: error || 'Failed to create book. Please try again.'
      }))
    }
  }

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      interestedGenres: prev.interestedGenres.includes(genre)
        ? prev.interestedGenres.filter(g => g !== genre)
        : [...prev.interestedGenres, genre]
    }))
  }

  const handleConditionToggle = (condition) => {
    setFormData(prev => ({
      ...prev,
      preferredConditions: prev.preferredConditions.includes(condition)
        ? prev.preferredConditions.filter(c => c !== condition)
        : [...prev.preferredConditions, condition]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Book</h1>
          <p className="text-gray-600 mt-2">
            Share your books with the community and start exchanging
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Book Details</span>
            </div>
            <ChevronRight className="mx-4 text-gray-400" />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Images & Preferences</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {(error || errors.submit) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Book Details */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Book Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Book Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter book title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Author */}
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Enter author name"
                    className={errors.author ? 'border-red-500' : ''}
                  />
                  {errors.author && (
                    <p className="mt-1 text-sm text-red-600">{errors.author}</p>
                  )}
                </div>

                {/* Genre and Condition */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre *</Label>
                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${
                        errors.genre ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select genre</option>
                      {genres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                    {errors.genre && (
                      <p className="mt-1 text-sm text-red-600">{errors.genre}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="condition">Condition *</Label>
                    <select
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${
                        errors.condition ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select condition</option>
                      {conditions.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                    {errors.condition && (
                      <p className="mt-1 text-sm text-red-600">{errors.condition}</p>
                    )}
                  </div>
                </div>

                {/* ISBN and Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isbn">ISBN (Optional)</Label>
                    <Input
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleInputChange}
                      placeholder="978-3-16-148410-0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      placeholder="English"
                    />
                  </div>
                </div>

                {/* Pages and Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pages">Number of Pages (Optional)</Label>
                    <Input
                      id="pages"
                      name="pages"
                      type="number"
                      value={formData.pages}
                      onChange={handleInputChange}
                      placeholder="250"
                      className={errors.pages ? 'border-red-500' : ''}
                    />
                    {errors.pages && (
                      <p className="mt-1 text-sm text-red-600">{errors.pages}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="publishedYear">Published Year (Optional)</Label>
                    <Input
                      id="publishedYear"
                      name="publishedYear"
                      type="number"
                      value={formData.publishedYear}
                      onChange={handleInputChange}
                      placeholder="2020"
                      className={errors.publishedYear ? 'border-red-500' : ''}
                    />
                    {errors.publishedYear && (
                      <p className="mt-1 text-sm text-red-600">{errors.publishedYear}</p>
                    )}
                  </div>
                </div>

                {/* Publisher */}
                <div>
                  <Label htmlFor="publisher">Publisher (Optional)</Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    placeholder="Publisher name"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the book..."
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                  >
                    Next: Add Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Images & Preferences */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Images & Exchange Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label>Book Images * (Max 5)</Label>
                  <div className="mt-2">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {images.length < 5 && (
                        <label className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <Camera className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Add Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {errors.images && (
                      <p className="mt-1 text-sm text-red-600">{errors.images}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      First image will be used as the main image. Max file size: 5MB per image.
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Book Location
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="useUserLocation"
                        checked={useUserLocation}
                        onChange={(e) => setUseUserLocation(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="useUserLocation" className="cursor-pointer">
                        Use my profile location
                      </Label>
                    </div>
                    {useUserLocation && user?.location && (
                      <p className="text-sm text-gray-600">
                        {user.location.address || user.location.city || 'Location from profile'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exchange Preferences */}
                <div>
                  <Label>Interested in Genres (Optional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genres.slice(0, 15).map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreToggle(genre)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          formData.interestedGenres.includes(genre)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Distance */}
                <div>
                  <Label htmlFor="maxDistance">
                    Maximum Exchange Distance: {formData.maxDistance}km
                  </Label>
                  <input
                    type="range"
                    id="maxDistance"
                    name="maxDistance"
                    min="1"
                    max="50"
                    value={formData.maxDistance}
                    onChange={handleInputChange}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1km</span>
                    <span>50km</span>
                  </div>
                </div>

                {/* Preferred Conditions */}
                <div>
                  <Label>Preferred Book Conditions (Optional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {conditions.map(condition => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => handleConditionToggle(condition)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          formData.preferredConditions.includes(condition)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information about exchange preferences..."
                    rows={3}
                    maxLength={300}
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </div>
                    ) : (
                      'Create Book Listing'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreateBook