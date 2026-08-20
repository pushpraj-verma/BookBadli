import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { MapPin, Locate, AlertCircle, Filter, X } from 'lucide-react'
import { fetchNearbyBooks } from '../../store/slices/bookSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import BookGrid from '../../components/books/BookGrid'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const NearbyBooks = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { nearbyBooks, loading, error } = useSelector(state => state.books)
  const { user, isAuthenticated } = useSelector(state => state.auth)

  const [radius, setRadius] = useState(10)
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    address: ''
  })
  const [filters, setFilters] = useState({
    genre: '',
    condition: '',
    sortBy: 'distance'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [searching, setSearching] = useState(false)

  const genres = [
    'All', 'Fiction', 'Non-Fiction', 'Mystery & Thriller', 'Romance', 
    'Science Fiction', 'Fantasy', 'Biography', 'History',
    'Science & Technology', 'Self-Help', 'Business'
  ]

  const conditions = ['All', 'New', 'Like New', 'Very Good', 'Good', 'Fair']

  // Load user's location if available
  useEffect(() => {
    if (user?.location?.coordinates?.[0] !== 0) {
      setLocation({
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
        address: user.location.address || user.location.city || 'Your Location'
      })
      // Auto-search with user's location
      handleSearch(
        user.location.coordinates[1],
        user.location.coordinates[0],
        10
      )
    }
  }, [user])

  const handleSearch = async (lat, lng, searchRadius) => {
    if (!lat || !lng) {
      setLocationError('Please provide location coordinates')
      return
    }

    setSearching(true)
    setLocationError('')

    try {
      const params = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: searchRadius || radius,
        limit: 50
      }

      // Add filters
      if (filters.genre && filters.genre !== 'All') {
        params.genre = filters.genre
      }
      if (filters.condition && filters.condition !== 'All') {
        params.condition = filters.condition
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy
      }

      await dispatch(fetchNearbyBooks(params)).unwrap()
    } catch (err) {
      setLocationError(err || 'Failed to find nearby books')
    } finally {
      setSearching(false)
    }
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setLocation({
            latitude: lat,
            longitude: lng,
            address: 'Current Location'
          })
          
          handleSearch(lat, lng, radius)
        },
        (error) => {
          setLocationError('Unable to detect location. Please enter manually.')
        }
      )
    } else {
      setLocationError('Geolocation is not supported by your browser')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    if (location.latitude && location.longitude) {
      handleSearch(location.latitude, location.longitude, radius)
    }
  }

  const clearFilters = () => {
    setFilters({
      genre: '',
      condition: '',
      sortBy: 'distance'
    })
  }

  const handleExchangeRequest = (book) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(`/books/${book._id}`)
  }

  const hasActiveFilters = filters.genre || filters.condition

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Books Near You
          </h1>
          <p className="text-gray-600">
            Discover books available for exchange in your neighborhood
          </p>
        </div>

        {/* Location & Search Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Search Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}

            {/* Location Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={location.latitude}
                  onChange={(e) => setLocation(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="28.6139"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={location.longitude}
                  onChange={(e) => setLocation(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="77.2090"
                />
              </div>
              <div>
                <Label htmlFor="address">Location Name</Label>
                <Input
                  id="address"
                  value={location.address}
                  onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g., My Home"
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div>
              <Label htmlFor="radius">
                Search Radius: {radius}km
              </Label>
              <input
                type="range"
                id="radius"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1km</span>
                <span>50km</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCurrentLocation}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Locate className="h-4 w-4" />
                Use Current Location
              </Button>
              <Button
                onClick={() => handleSearch(location.latitude, location.longitude, radius)}
                disabled={!location.latitude || !location.longitude || searching}
                className="flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Search Nearby
                  </>
                )}
              </Button>
              {!user?.location?.coordinates?.[0] && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  Set Default Location
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[filters.genre, filters.condition].filter(Boolean).length}
              </Badge>
            )}
          </Button>

          {showFilters && (
            <Card className="mt-4">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <select
                      id="genre"
                      value={filters.genre}
                      onChange={(e) => handleFilterChange('genre', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1"
                    >
                      {genres.map(genre => (
                        <option key={genre} value={genre === 'All' ? '' : genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      value={filters.condition}
                      onChange={(e) => handleFilterChange('condition', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1"
                    >
                      {conditions.map(condition => (
                        <option key={condition} value={condition === 'All' ? '' : condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="sortBy">Sort By</Label>
                    <select
                      id="sortBy"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 mt-1"
                    >
                      <option value="distance">Nearest First</option>
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="title">Title A-Z</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={applyFilters} size="sm">
                    Apply Filters
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {location.latitude && location.longitude && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {loading ? (
                'Searching...'
              ) : nearbyBooks?.length > 0 ? (
                `Found ${nearbyBooks.length} books within ${radius}km of ${location.address || 'your location'}`
              ) : (
                `No books found within ${radius}km. Try increasing the search radius.`
              )}
            </p>
          </div>
        )}

        {/* Books Grid */}
        <BookGrid
          books={nearbyBooks || []}
          loading={loading}
          error={error}
          showOwner={isAuthenticated}
          showDistance={true}
          showActions={true}
          onExchangeRequest={handleExchangeRequest}
          emptyTitle={
            !location.latitude || !location.longitude
              ? "Set your location to discover nearby books"
              : "No books found nearby"
          }
          emptyDescription={
            !location.latitude || !location.longitude
              ? "Enter coordinates or use your current location to search"
              : `Try increasing the search radius or adjusting filters`
          }
          emptyAction={
            !location.latitude || !location.longitude
              ? handleCurrentLocation
              : () => setRadius(Math.min(radius + 10, 50))
          }
          emptyActionText={
            !location.latitude || !location.longitude
              ? "Use Current Location"
              : radius < 50 ? `Expand to ${Math.min(radius + 10, 50)}km` : "View All Books"
          }
        />
      </div>
    </div>
  )
}

export default NearbyBooks