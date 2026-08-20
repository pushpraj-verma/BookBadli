import React, { useState, useEffect } from 'react'
import { Search, Filter, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const SearchFilters = ({
  filters = {},
  onFiltersChange,
  onSearch,
  filterOptions = {
    genres: [],
    conditions: [],
    languages: [],
    yearRange: { min: 1800, max: new Date().getFullYear() }
  },
  showLocationFilter = false,
  loading = false,
  className = ''
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    genre: '',
    condition: [],
    language: '',
    minYear: '',
    maxYear: '',
    sortBy: 'newest',
    radius: 10,
    ...filters
  })
  
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }))
  }, [filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange && onFiltersChange(newFilters)
  }

  const handleConditionToggle = (condition) => {
    const currentConditions = localFilters.condition || []
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition]
    
    handleFilterChange('condition', newConditions)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch && onSearch(localFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      genre: '',
      condition: [],
      language: '',
      minYear: '',
      maxYear: '',
      sortBy: 'newest',
      radius: 10
    }
    setLocalFilters(clearedFilters)
    onFiltersChange && onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.entries(localFilters).some(([key, value]) => {
    if (key === 'search' || key === 'sortBy') return false
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== 10
  })

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search books, authors, genres..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-20"
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              value={localFilters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="author">Author A-Z</option>
              <option value="popular">Most Popular</option>
              {showLocationFilter && <option value="distance">Nearest First</option>}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {Object.values(localFilters).filter(v => Array.isArray(v) ? v.length : v && v !== 'newest' && v !== 10).length}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {localFilters.genre && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Genre: {localFilters.genre}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('genre', '')}
                />
              </Badge>
            )}
            {localFilters.condition.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Conditions: {localFilters.condition.join(', ')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('condition', [])}
                />
              </Badge>
            )}
            {localFilters.language && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Language: {localFilters.language}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('language', '')}
                />
              </Badge>
            )}
          </div>
        )}

        {showAdvanced && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Genre</label>
                <select
                  value={localFilters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">All Genres</option>
                  {filterOptions.genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
                <select
                  value={localFilters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                >
                  <option value="">All Languages</option>
                  {filterOptions.languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              {showLocationFilter && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Within {localFilters.radius}km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={localFilters.radius}
                    onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1km</span>
                    <span>50km</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Condition</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.conditions.map((condition) => (
                  <Badge
                    key={condition}
                    variant={localFilters.condition.includes(condition) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleConditionToggle(condition)}
                  >
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">From Year</label>
                <Input
                  type="number"
                  placeholder={filterOptions.yearRange.min.toString()}
                  min={filterOptions.yearRange.min}
                  max={filterOptions.yearRange.max}
                  value={localFilters.minYear}
                  onChange={(e) => handleFilterChange('minYear', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">To Year</label>
                <Input
                  type="number"
                  placeholder={filterOptions.yearRange.max.toString()}
                  min={filterOptions.yearRange.min}
                  max={filterOptions.yearRange.max}
                  value={localFilters.maxYear}
                  onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SearchFilters
