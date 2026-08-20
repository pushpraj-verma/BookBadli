import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { 
  BookOpen, 
  Plus, 
  MapPin, 
  Bell, 
  ArrowUpDown, 
  Users, 
  Eye, 
  TrendingUp,
  Calendar,
  Star,
  MessageSquare,
  Clock
} from 'lucide-react'
import { fetchMyBooks, fetchNearbyBooks } from '../store/slices/bookSlice'
import { fetchMyRequests, fetchIncomingRequests, fetchExchangeStats } from '../store/slices/exchangeSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import BookGrid from '../components/books/BookGrid'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { getInitials, formatRelativeTime, getExchangeStatusColor } from '@/lib/utils'

const Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { userBooks, nearbyBooks, loading } = useSelector(state => state.books)
  const { myRequests, incomingRequests, exchangeStats } = useSelector(state => state.exchange)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardLoading, setDashboardLoading] = useState(true)

  // Fetch all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true)
      try {
        // Fetch user's books
        await dispatch(fetchMyBooks({ limit: 6 })).unwrap()
        
        // Fetch nearby books if user has location
        if (user?.location?.coordinates?.[0] !== 0) {
          await dispatch(fetchNearbyBooks({
            lat: user.location.coordinates[1],
            lng: user.location.coordinates[0],
            radius: 10,
            limit: 6
          })).unwrap()
        }
        
        // Fetch exchange data
        await dispatch(fetchMyRequests({ limit: 5 })).unwrap()
        await dispatch(fetchIncomingRequests({ limit: 5 })).unwrap()
        await dispatch(fetchExchangeStats()).unwrap()
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setDashboardLoading(false)
      }
    }

    if (user) {
      loadDashboardData()
    }
  }, [dispatch, user])

  const handleBookExchange = (book) => {
    // Navigate to book detail page for exchange
    navigate(`/books/${book._id}`)
  }

  const dashboardStats = [
    {
      title: 'My Books',
      value: user?.stats?.totalBooksUploaded || 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: () => navigate('/my-books')
    },
    {
      title: 'Total Exchanges',
      value: user?.stats?.totalExchanges || 0,
      icon: ArrowUpDown,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => navigate('/exchanges')
    },
    {
      title: 'Pending Requests',
      value: (myRequests?.filter(req => req.status === 'Pending')?.length || 0) +
             (incomingRequests?.filter(req => req.status === 'Pending')?.length || 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      action: () => navigate('/exchanges')
    },
    {
      title: 'Community Rating',
      value: user?.stats?.rating ? `${user.stats.rating.toFixed(1)}/5` : 'New',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      action: () => navigate('/profile')
    }
  ]

  const recentActivity = [
    ...myRequests?.slice(0, 3)?.map(req => ({
      type: 'sent',
      title: `Exchange request sent`,
      description: `You requested "${req.book.title}"`,
      time: req.requestedAt,
      status: req.status,
      action: () => navigate('/exchanges')
    })) || [],
    ...incomingRequests?.slice(0, 3)?.map(req => ({
      type: 'received',
      title: `Exchange request received`,
      description: `${req.requester.firstName} wants "${req.book.title}"`,
      time: req.requestedAt,
      status: req.status,
      action: () => navigate('/exchanges')
    })) || []
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading your dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening in your BookBadli community
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card 
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={stat.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => navigate('/books/create')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Book
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/books')}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Browse Books
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/books/nearby')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Find Nearby
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Recent Books */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Recent Books</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/my-books')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {userBooks?.length > 0 ? (
                  <BookGrid
                    books={userBooks}
                    variant="compact"
                    showOwner={false}
                    showDistance={false}
                    showActions={false}
                    className="space-y-3"
                  />
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No books yet"
                    description="Start by adding your first book to exchange"
                    action={() => navigate('/books/create')}
                    actionText="Add Your First Book"
                  />
                )}
              </CardContent>
            </Card>

            {/* Nearby Books */}
            {user?.location?.coordinates?.[0] !== 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Books Near You</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/books/nearby')}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {nearbyBooks?.length > 0 ? (
                    <BookGrid
                      books={nearbyBooks}
                      variant="compact"
                      showDistance={true}
                      showActions={true}
                      onExchangeRequest={handleBookExchange}
                      className="space-y-3"
                    />
                  ) : (
                    <EmptyState
                      icon={MapPin}
                      title="No nearby books"
                      description="Try expanding your search radius or check back later"
                      action={() => navigate('/books/nearby')}
                      actionText="Search Wider Area"
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location Prompt */}
            {user?.location?.coordinates?.[0] === 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Set Your Location
                      </h3>
                      <p className="text-blue-700 text-sm mb-4">
                        Add your location to discover books near you and help others find your books.
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => navigate('/profile')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Update Location
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity?.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={activity.action}
                      >
                        <div className={`p-1 rounded-full ${
                          activity.type === 'sent' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <ArrowUpDown className={`h-3 w-3 ${
                            activity.type === 'sent' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(activity.time)}
                            </span>
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${getExchangeStatusColor(activity.status)}`}
                            >
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/exchanges')}
                    >
                      View All Activity
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    icon={Bell}
                    title="No activity yet"
                    description="Start exchanging books to see activity here"
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>

            {/* Exchange Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Exchange Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requests Sent</span>
                    <Badge variant="outline">{exchangeStats?.requestsSent || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requests Received</span>
                    <Badge variant="outline">{exchangeStats?.requestsReceived || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Exchanges</span>
                    <Badge variant="outline">{exchangeStats?.completedExchanges || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <Badge variant="secondary">
                      {exchangeStats?.responseRate || 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">@{user?.username}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard