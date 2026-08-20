import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { BookOpen, Plus, Edit, Trash2, Eye, Filter, Search } from 'lucide-react'
import { fetchMyBooks, deleteBook } from '../../store/slices/bookSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import BookGrid from '../../components/books/BookGrid'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { getConditionColor, formatRelativeTime } from '@/lib/utils'

const MyBooks = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userBooks, loading, pagination } = useSelector(state => state.books)
  const { user } = useSelector(state => state.auth)

  const [filteredBooks, setFilteredBooks] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch user's books on mount
  useEffect(() => {
    dispatch(fetchMyBooks({ page: 1, limit: 50 }))
  }, [dispatch])

  // Filter books based on status and search
  useEffect(() => {
    let filtered = userBooks || []

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(book => book.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query)
      )
    }

    setFilteredBooks(filtered)
  }, [userBooks, statusFilter, searchQuery])

  const handleDeleteClick = (book) => {
    setBookToDelete(book)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return

    setDeleting(true)
    try {
      await dispatch(deleteBook(bookToDelete._id)).unwrap()
      setDeleteDialogOpen(false)
      setBookToDelete(null)
    } catch (error) {
      console.error('Error deleting book:', error)
    } finally {
      setDeleting(false)
    }
  }

  const stats = {
    total: userBooks?.length || 0,
    available: userBooks?.filter(b => b.status === 'Available').length || 0,
    reserved: userBooks?.filter(b => b.status === 'Reserved').length || 0,
    exchanged: userBooks?.filter(b => b.status === 'Exchanged').length || 0
  }

  const statusOptions = [
    { value: 'all', label: 'All Books', count: stats.total },
    { value: 'Available', label: 'Available', count: stats.available },
    { value: 'Reserved', label: 'Reserved', count: stats.reserved },
    { value: 'Exchanged', label: 'Exchanged', count: stats.exchanged }
  ]

  if (loading && !userBooks?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading your books..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
            <p className="text-gray-600 mt-2">
              Manage your book collection and track exchanges
            </p>
          </div>
          <Button
            onClick={() => navigate('/books/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Book
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statusOptions.map((option) => (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all ${
                statusFilter === option.value
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setStatusFilter(option.value)}
            >
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {option.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {option.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by title, author, or genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Active Filters */}
              {(statusFilter !== 'all' || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Books List */}
        {filteredBooks.length > 0 ? (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <Card key={book._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Book Image */}
                    <div className="w-full md:w-32 flex-shrink-0">
                      <img
                        src={book.images?.[0]?.url || '/placeholder-book.jpg'}
                        alt={book.title}
                        className="w-full aspect-[3/4] object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = '/placeholder-book.jpg'
                        }}
                      />
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {book.title}
                          </h3>
                          <p className="text-gray-600 mb-2">by {book.author}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={getConditionColor(book.condition)}
                        >
                          {book.condition}
                        </Badge>
                      </div>

                      {/* Book Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Genre</p>
                          <p className="text-sm font-medium text-gray-900">
                            {book.genre}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge variant="outline" className="text-xs">
                            {book.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Views</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {book.analytics?.views || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Added</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatRelativeTime(book.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {book.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {book.description}
                        </p>
                      )}

                      {/* Exchange Requests */}
                      {book.exchangeRequests?.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>{book.exchangeRequests.length}</strong> exchange request
                            {book.exchangeRequests.length !== 1 ? 's' : ''} received
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/books/${book._id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/books/edit/${book._id}`)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(book)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={
              searchQuery || statusFilter !== 'all'
                ? 'No books found'
                : 'No books yet'
            }
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Start building your collection by adding your first book'
            }
            action={
              searchQuery || statusFilter !== 'all'
                ? () => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }
                : () => navigate('/books/create')
            }
            actionText={
              searchQuery || statusFilter !== 'all'
                ? 'Clear Filters'
                : 'Add Your First Book'
            }
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{bookToDelete?.title}"? This action
              cannot be undone and will also remove any associated exchange requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </div>
              ) : (
                'Delete Book'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MyBooks