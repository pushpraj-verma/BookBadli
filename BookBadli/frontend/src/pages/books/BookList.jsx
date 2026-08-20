import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { BookOpen, Filter, X } from 'lucide-react'
import { fetchBooks, fetchFilterOptions, setFilters, clearFilters } from '../../store/slices/bookSlice'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import BookGrid from '../../components/books/BookGrid'
import SearchFilters from '../../components/books/SearchFilters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const BookList = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const { books, loading, error, pagination, filters, filterOptions } = useSelector(state => state.books)
  const { isAuthenticated } = useSelector(state => state.auth)
  
  const [showFilters, setShowFilters] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Load filter options on mount
  useEffect(() => {
    dispatch(fetchFilterOptions())
  }, [dispatch])

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      genre: searchParams.get('genre') || '',
      condition: searchParams.get('condition')?.split(',').filter(Boolean) || [],
      language: searchParams.get('language') || '',
      minYear: searchParams.get('minYear') || '',
      maxYear: searchParams.get('maxYear') || '',
      sortBy: searchParams.get('sortBy') || 'newest',
    }
    dispatch(setFilters(urlFilters))
  }, [searchParams, dispatch])

  // Fetch books when filters or page changes
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 12,
      ...filters,
      condition: filters.condition?.join(',')
    }

    // Remove empty params
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })

    dispatch(fetchBooks(params))
  }, [dispatch, filters, currentPage])

  const handleFiltersChange = (newFilters) => {
    dispatch(setFilters(newFilters))
    setCurrentPage(1) // Reset to first page on filter change
    
    // Update URL params
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','))
        } else {
          params.set(key, value)
        }
      }
    })
    setSearchParams(params)
  }

  const handleSearch = (searchFilters) => {
    handleFiltersChange(searchFilters)
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
    setSearchParams({})
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sortBy') return false
    if (Array.isArray(value)) return value.length > 0
    return value !== ''
  })

  const handleExchangeRequest = (book) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(`/books/${book._id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Books
          </h1>
          <p className="text-gray-600">
            Discover books available for exchange in your community
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-4">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                filterOptions={filterOptions}
                showLocationFilter={false}
                loading={loading}
              />

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full mt-4 flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>

          {/* Books Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing {books.length > 0 ? ((currentPage - 1) * 12 + 1) : 0} - {Math.min(currentPage * 12, pagination.totalBooks)} of {pagination.totalBooks} books
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Books Grid */}
            <BookGrid
              books={books}
              loading={loading}
              error={error}
              showOwner={isAuthenticated}
              showDistance={false}
              showActions={true}
              onExchangeRequest={handleExchangeRequest}
              emptyTitle={hasActiveFilters ? "No books match your filters" : "No books available"}
              emptyDescription={hasActiveFilters ? "Try adjusting your filters to see more results" : "Be the first to add books to the community!"}
              emptyAction={hasActiveFilters ? handleClearFilters : (isAuthenticated ? () => navigate('/books/create') : () => navigate('/register'))}
              emptyActionText={hasActiveFilters ? "Clear Filters" : (isAuthenticated ? "Add Your Books" : "Sign Up to Add Books")}
            />

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookList