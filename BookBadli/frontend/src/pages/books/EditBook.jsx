import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, Upload, X, Camera, AlertCircle } from 'lucide-react'
import { fetchBookById, updateBook } from '../../store/slices/bookSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { validateImageFile } from '@/lib/utils'

const EditBook = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentBook, loading, error } = useSelector(state => state.books)
  const { user } = useSelector(state => state.auth)

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
    interestedGenres: [],
    maxDistance: 10,
    preferredConditions: [],
    notes: ''
  })

  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery & Thriller', 'Romance', 
    'Science Fiction', 'Fantasy', 'Biography', 'History',
    'Science & Technology', 'Self-Help', 'Business', 'Health & Fitness',
    'Children', 'Young Adult', 'Horror', 'Adventure', 'Poetry',
    'Drama', 'Philosophy', 'Religion & Spirituality', 'Art & Design',
    'Travel', 'Cooking', 'Sports', 'Politics', 'Economics', 'Education', 'Other'
  ]

  const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor']

  // Fetch book data
  useEffect(() => {
    if (id) {
      dispatch(fetchBookById(id))
    }
  }, [dispatch, id])

  // Pre-fill form when book data loads
  useEffect(() => {
    if (currentBook) {
      // Check if user is the owner
      if (user && currentBook.owner._id !== user._id) {
        alert('You can only edit your own books')
        navigate('/my-books')
        return
      }

      setFormData({
        title: currentBook.title || '',
        author: currentBook.author || '',
        isbn: currentBook.isbn || '',
        genre: currentBook.genre || '',
        condition: currentBook.condition || '',
        language: currentBook.language || 'English',
        pages: currentBook.pages || '',
        publishedYear: currentBook.publishedYear || '',
        publisher: currentBook.publisher || '',
        description: currentBook.description || '',
        interestedGenres: currentBook.exchangePreferences?.interestedGenres || [],
        maxDistance: currentBook.exchangePreferences?.maxDistance || 10,
        preferredConditions: currentBook.exchangePreferences?.preferredConditions || [],
        notes: currentBook.exchangePreferences?.notes || ''
      })

      setExistingImages(currentBook.images || [])
    }
  }, [currentBook, user, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleNewImageSelect = (e) => {
    const files = Array.from(e.target.files)
    
    if (existingImages.length + newImages.length + files.length > 5) {
      setErrors(prev => ({
        ...prev,
        images: 'Maximum 5 images allowed'
      }))
      return
    }

    const validFiles = []
    const newPreviews = []

    files.forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result)
          if (newPreviews.length === validFiles.length) {
            setNewImagePreviews(prev => [...prev, ...newPreviews])
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

    setNewImages(prev => [...prev, ...validFiles])
  }

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required'
    }
    if (!formData.genre) {
      newErrors.genre = 'Genre is required'
    }
    if (!formData.condition) {
      newErrors.condition = 'Condition is required'
    }

    if (existingImages.length + newImages.length === 0) {
      newErrors.images = 'At least one image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const submitData = new FormData()

      // Add text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          if (Array.isArray(formData[key])) {
            submitData.append(key, JSON.stringify(formData[key]))
          } else {
            submitData.append(key, formData[key])
          }
        }
      })

      // Add new images
      newImages.forEach((image) => {
        submitData.append('images', image)
      })

      // Add existing images info (if needed to preserve)
      submitData.append('existingImages', JSON.stringify(existingImages.map(img => img.url)))

      await dispatch(updateBook({ bookId: id, bookData: submitData })).unwrap()
      
      navigate(`/books/${id}`)
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error || 'Failed to update book'
      }))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !currentBook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading book..." />
      </div>
    )
  }

  if (!currentBook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
            <Button onClick={() => navigate('/my-books')}>
              Go to My Books
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Book</h1>
          <p className="text-gray-600 mt-2">
            Update your book information and preferences
          </p>
        </div>

        {/* Error Alert */}
        {(error || errors.submit) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Information */}
          <Card>
            <CardHeader>
              <CardTitle>Book Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className={errors.author ? 'border-red-500' : ''}
                />
                {errors.author && <p className="text-sm text-red-600 mt-1">{errors.author}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genre">Genre *</Label>
                  <select
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select condition</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pages">Pages</Label>
                  <Input
                    id="pages"
                    name="pages"
                    type="number"
                    value={formData.pages}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="publishedYear">Published Year</Label>
                  <Input
                    id="publishedYear"
                    name="publishedYear"
                    type="number"
                    value={formData.publishedYear}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={1000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Book Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Current Images</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImagePreviews.length > 0 && (
                  <div>
                    <Label className="mb-2 block">New Images</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {newImagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt={`New ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Images Button */}
                {(existingImages.length + newImages.length) < 5 && (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Add More Images</span>
                    <span className="text-xs text-gray-500 mt-1">
                      {5 - (existingImages.length + newImages.length)} remaining
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewImageSelect}
                      className="hidden"
                    />
                  </label>
                )}

                {errors.images && (
                  <p className="text-sm text-red-600">{errors.images}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exchange Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Exchange Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Interested in Genres</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {genres.slice(0, 15).map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.interestedGenres.includes(genre)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="maxDistance">
                  Maximum Distance: {formData.maxDistance}km
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
              </div>

              <div>
                <Label>Preferred Conditions</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {conditions.map(condition => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => handleConditionToggle(condition)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.preferredConditions.includes(condition)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={300}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </div>
              ) : (
                'Update Book'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBook