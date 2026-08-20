import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MapPin, Eye, Heart, MessageSquare, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getConditionColor, formatDistance, truncateText, getInitials } from '@/lib/utils'

const BookCard = ({ 
  book, 
  showOwner = true, 
  showDistance = true, 
  showActions = true,
  variant = 'default', 
  onExchangeRequest,
  onAddToWishlist,
  className = ''
}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)
  
  const {
    _id,
    title,
    author,
    images,
    condition,
    genre,
    owner,
    location,
    distance,
    analytics,
    status
  } = book

  const mainImage = images?.find(img => img.isMain) || images?.[0]
  const imageUrl = mainImage?.url || '/placeholder-book.jpg'

  const handleExchangeClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      navigate('/register')
      return
    }
    
    onExchangeRequest && onExchangeRequest(book)
  }

  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    onAddToWishlist && onAddToWishlist(book)
  }

  const handleOwnerClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    navigate(`/users/${owner._id}`)
  }

  if (variant === 'compact') {
    return (
      <Card className={`group hover:shadow-md transition-all duration-200 ${className}`}>
        <Link to={`/books/${_id}`} className="block">
          <div className="flex gap-3 p-4">
            <img
              src={imageUrl}
              alt={title}
              className="w-16 h-20 object-cover rounded border flex-shrink-0"
              onError={(e) => {
                e.target.src = '/placeholder-book.jpg'
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 text-gray-900 group-hover:text-blue-600">
                {title}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{author}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getConditionColor(condition)}`}
                >
                  {condition}
                </Badge>
                {showDistance && distance && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(distance)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  return (
    <Card className={`group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className}`}>
      <div className="relative">
        <Link to={`/books/${_id}`}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full aspect-[3/4] object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.target.src = '/placeholder-book.jpg'
            }}
          />
        </Link>
        
        {status !== 'Available' && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-red-100 text-red-800"
          >
            {status}
          </Badge>
        )}

        {showActions && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-2 left-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
            title={!isAuthenticated ? "Login to add to wishlist" : "Add to wishlist"}
          >
            {!isAuthenticated ? (
              <Lock className="h-4 w-4 text-gray-600" />
            ) : (
              <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
            )}
          </button>
        )}
      </div>

      <CardContent className="p-4">
        <Link to={`/books/${_id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 group-hover:text-blue-600 mb-1">
            {title}
          </h3>
        </Link>
        
        <p className="text-xs text-gray-600 mb-2">{author}</p>

        {variant === 'detailed' && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {truncateText(book.description || '', 80)}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="outline" 
            className="text-xs"
          >
            {genre}
          </Badge>
          <Badge 
            variant="secondary" 
            className={`text-xs ${getConditionColor(condition)}`}
          >
            {condition}
          </Badge>
        </div>

        {(showDistance || analytics) && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            {showDistance && distance && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {formatDistance(distance)}
              </span>
            )}
            {analytics?.views && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {analytics.views}
              </span>
            )}
          </div>
        )}

        {showOwner && owner && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <Avatar className="h-6 w-6">
              <AvatarImage src={owner.avatar} />
              <AvatarFallback className="text-xs">
                {getInitials(owner.firstName, owner.lastName)}
              </AvatarFallback>
            </Avatar>
            {isAuthenticated ? (
              <button 
                onClick={handleOwnerClick}
                className="text-xs text-gray-600 hover:text-blue-600 font-medium"
              >
                {owner.firstName} {owner.lastName}
              </button>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Login to view owner
              </span>
            )}
          </div>
        )}

        {showActions && status === 'Available' && (
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  onClick={handleExchangeClick}
                  className="flex-1 text-xs"
                >
                  Request Exchange
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/books/${_id}`)}
                  className="px-3"
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="flex-1 text-xs"
                >
                  Sign Up to Exchange
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="px-3 text-xs"
                >
                  Login
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BookCard
