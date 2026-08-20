import React from 'react'
import { BookOpen } from 'lucide-react'
import BookCard from './BookCard'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

const BookGrid = ({
  books = [],
  loading = false,
  error = null,
  variant = 'default',
  showOwner = true,
  showDistance = true,
  showActions = true,
  onExchangeRequest,
  onAddToWishlist,
  emptyTitle = "No books found",
  emptyDescription = "Try adjusting your search or browse other categories.",
  emptyAction,
  emptyActionText,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading books..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <EmptyState
          icon={BookOpen}
          title="Unable to load books"
          description={error}
          action={() => window.location.reload()}
          actionText="Try Again"
        />
      </div>
    )
  }

  if (!books.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        actionText={emptyActionText}
        className="py-12"
      />
    )
  }

  const gridClasses = {
    compact: 'grid grid-cols-1 gap-3',
    default: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6',
    detailed: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
  }

  return (
    <div className={`${gridClasses[variant]} ${className}`}>
      {books.map((book) => (
        <BookCard
          key={book._id}
          book={book}
          variant={variant}
          showOwner={showOwner}
          showDistance={showDistance}
          showActions={showActions}
          onExchangeRequest={onExchangeRequest}
          onAddToWishlist={onAddToWishlist}
        />
      ))}
    </div>
  )
}

export default BookGrid
