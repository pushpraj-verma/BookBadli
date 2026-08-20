import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { 
  ArrowLeft, 
  MapPin, 
  Eye, 
  Edit, 
  Trash2, 
  Heart,
  Share2,
  Calendar,
  BookOpen,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { fetchBookById, deleteBook } from '../../store/slices/bookSlice'
import { requestBookExchange } from '../../store/slices/exchangeSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import BookGrid from '../../components/books/BookGrid'
import { 
  getConditionColor, 
  formatDate, 
  formatDistance, 
  getInitials,
  capitalize 
} from '@/lib/utils'

const BookDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentBook, loading, error } = useSelector(state => state.books)
  const { user, isAuthenticated } = useSelector(state => state.auth)
  const { requestLoading } = useSelector(state => state.exchange)

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [exchangeMessage, setExchangeMessage] = useState('')
  const [showExchangeForm, setShowExchangeForm] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchBookById(id))
    }
  }, [dispatch, id])

  const isOwner = user && currentBook && currentBook.owner._id === user._id

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? currentBook.images.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === currentBook.images.length - 1 ? 0 : prev + 1
    )
  }

  const handleExchangeRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!exchangeMessage.trim()) {
      alert('Please enter a message for your exchange request')
      return
    }

    try {
      await dispatch(requestBookExchange({
        bookId: currentBook._id,
        message: exchangeMessage,
        offeredBooks: [] // Can be extended to select books
      })).unwrap()

      setShowExchangeForm(false)
      setExchangeMessage('')
      alert('Exchange request sent successfully!')
    } catch (error) {
      alert(error || 'Failed to send exchange request')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await dispatch(deleteBook(currentBook._id)).unwrap()
      navigate('/my-books')
    } catch (error) {
      alert('Failed to delete book')
    } finally {
      setDeleting(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentBook.title,
        text: `Check out "${currentBook.title}" by ${currentBook.author} on BookBadli`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading book details..." />
      </div>
    )
  }

  if (error || !currentBook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The book you are looking for does not exist or has been removed.'}
            </p>
            <Button onClick={() => navigate('/books')}>
              Browse Books
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {/* Main Image */}
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={currentBook.images[currentImageIndex]?.url || '/placeholder-book.jpg'}
                    alt={currentBook.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-book.jpg'
                    }}
                  />
                  
                  {/* Navigation Arrows */}
                  {currentBook.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {currentBook.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                      {currentImageIndex + 1} / {currentBook.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {currentBook.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {currentBook.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square rounded overflow-hidden ${
                          index === currentImageIndex ? 'ring-2 ring-blue-600' : ''
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  {isOwner ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        onClick={() => navigate(`/books/edit/${currentBook._id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Book
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Book
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full flex items-center gap-2"
                        onClick={() => setShowExchangeForm(true)}
                        disabled={currentBook.status !== 'Available'}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {currentBook.status === 'Available' 
                          ? 'Request Exchange' 
                          : `Not Available (${currentBook.status})`}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        Add to Wishlist
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Book Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {currentBook.title}
                    </h1>
                    <p className="text-xl text-gray-600 mb-4">
                      by {currentBook.author}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${getConditionColor(currentBook.condition)} text-sm`}
                  >
                    {currentBook.condition}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {currentBook.analytics?.views || 0} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Added {formatDate(currentBook.createdAt)}
                  </div>
                  {currentBook.distance && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {formatDistance(currentBook.distance)}
                    </div>
                  )}
                </div>

                {/* Description */}
                {currentBook.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {currentBook.description}
                    </p>
                  </div>
                )}

                {/* Book Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Genre</p>
                    <Badge variant="outline">{currentBook.genre}</Badge>
                  </div>
                  {currentBook.language && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Language</p>
                      <p className="text-sm font-medium text-gray-900">{currentBook.language}</p>
                    </div>
                  )}
                  {currentBook.pages && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Pages</p>
                      <p className="text-sm font-medium text-gray-900">{currentBook.pages}</p>
                    </div>
                  )}
                  {currentBook.publishedYear && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Published</p>
                      <p className="text-sm font-medium text-gray-900">{currentBook.publishedYear}</p>
                    </div>
                  )}
                  {currentBook.publisher && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Publisher</p>
                      <p className="text-sm font-medium text-gray-900">{currentBook.publisher}</p>
                    </div>
                  )}
                  {currentBook.isbn && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ISBN</p>
                      <p className="text-sm font-medium text-gray-900">{currentBook.isbn}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Owner Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Book Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={currentBook.owner.avatar} />
                        <AvatarFallback>
                          {getInitials(currentBook.owner.firstName, currentBook.owner.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {currentBook.owner.firstName} {currentBook.owner.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">@{currentBook.owner.username}</p>
                        {currentBook.owner.stats && (
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>{currentBook.owner.stats.totalBooksUploaded || 0} books</span>
                            <span>•</span>
                            <span>{currentBook.owner.stats.totalExchanges || 0} exchanges</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isOwner && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/users/${currentBook.owner._id}`)}
                      >
                        View Profile
                      </Button>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Sign in to view owner details and contact information</span>
                      <Button size="sm" onClick={() => navigate('/login')}>
                        Sign In
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Exchange Preferences */}
            {currentBook.exchangePreferences && (
              <Card>
                <CardHeader>
                  <CardTitle>Exchange Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentBook.exchangePreferences.interestedGenres?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Interested in Genres</p>
                      <div className="flex flex-wrap gap-2">
                        {currentBook.exchangePreferences.interestedGenres.map((genre) => (
                          <Badge key={genre} variant="secondary">{genre}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentBook.exchangePreferences.maxDistance && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Maximum Exchange Distance</p>
                      <p className="text-sm font-medium text-gray-900">
                        Within {currentBook.exchangePreferences.maxDistance}km
                      </p>
                    </div>
                  )}
                  {currentBook.exchangePreferences.preferredConditions?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Preferred Book Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {currentBook.exchangePreferences.preferredConditions.map((condition) => (
                          <Badge key={condition} variant="outline">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentBook.exchangePreferences.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                      <p className="text-sm text-gray-700">{currentBook.exchangePreferences.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Exchange Request Form */}
            {showExchangeForm && !isOwner && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle>Send Exchange Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Message to Owner
                    </label>
                    <Textarea
                      value={exchangeMessage}
                      onChange={(e) => setExchangeMessage(e.target.value)}
                      placeholder="Introduce yourself and explain why you're interested in this book..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {exchangeMessage.length}/500 characters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExchangeRequest}
                      disabled={requestLoading || !exchangeMessage.trim()}
                      className="flex-1"
                    >
                      {requestLoading ? (
                        <div className="flex items-center">
                          <LoadingSpinner size="sm" className="mr-2" />
                          Sending...
                        </div>
                      ) : (
                        'Send Request'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowExchangeForm(false)
                        setExchangeMessage('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentBook?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BookDetail