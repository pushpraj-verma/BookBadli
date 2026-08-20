import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { 
  ArrowUpDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  BookOpen,
  User,
  Calendar,
  Send,
  Inbox
} from 'lucide-react'
import { 
  fetchMyRequests, 
  fetchIncomingRequests, 
  respondToExchangeRequest,
  markExchangeComplete,
  fetchExchangeStats
} from '../../store/slices/exchangeSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import EmptyState from '../../components/common/EmptyState'
import { 
  getInitials, 
  formatRelativeTime, 
  getExchangeStatusColor,
  getConditionColor 
} from '@/lib/utils'

const ExchangeRequests = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { 
    myRequests, 
    incomingRequests, 
    exchangeStats,
    loading, 
    requestLoading 
  } = useSelector(state => state.exchange)

  const [activeTab, setActiveTab] = useState('incoming')
  const [responseDialog, setResponseDialog] = useState({ open: false, request: null })
  const [responseMessage, setResponseMessage] = useState('')
  const [completeDialog, setCompleteDialog] = useState({ open: false, request: null })

  useEffect(() => {
    dispatch(fetchMyRequests())
    dispatch(fetchIncomingRequests())
    dispatch(fetchExchangeStats())
  }, [dispatch])

  const handleRespond = async (action) => {
  if (!responseDialog.request) return

  try {
    await dispatch(respondToExchangeRequest({
      bookId: responseDialog.request.book._id,
      requestId: responseDialog.request._id,
      action,
      response: responseMessage
    })).unwrap()

    setResponseDialog({ open: false, request: null })
    setResponseMessage('')
    
    // Refresh BOTH incoming and sent requests to get updated data
    await dispatch(fetchIncomingRequests()).unwrap()
    await dispatch(fetchMyRequests()).unwrap()
    
  } catch (error) {
    alert(error || 'Failed to respond to request')
  }
}

  const handleMarkComplete = async () => {
    if (!completeDialog.request) return

    try {
      await dispatch(markExchangeComplete({
        bookId: completeDialog.request.book._id,
        requestId: completeDialog.request._id
      })).unwrap()

      setCompleteDialog({ open: false, request: null })
      
      // Refresh data
      dispatch(fetchMyRequests())
      dispatch(fetchIncomingRequests())
    } catch (error) {
      alert(error || 'Failed to mark exchange as complete')
    }
  }

  const stats = [
    {
      title: 'Requests Sent',
      value: exchangeStats?.requestsSent || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Requests Received',
      value: exchangeStats?.requestsReceived || 0,
      icon: Inbox,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Completed',
      value: exchangeStats?.completedExchanges || 0,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Response Rate',
      value: `${exchangeStats?.responseRate || 0}%`,
      icon: ArrowUpDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  const RequestCard = ({ request, type }) => {
    const isIncoming = type === 'incoming'
    const otherUser = isIncoming ? request.requester : request.book.owner
    const isPending = request.status === 'Pending'
    const isAccepted = request.status === 'Accepted'

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Book Image */}
            <div>
              <img
                src={request.book.images?.[0]?.url || '/placeholder-book.jpg'}
                alt={request.book.title}
                className="cursor-pointer w-full md:w-24 flex-shrink-0 aspect-[3/4] object-cover rounded-lg"

                onClick={() => navigate(`/books/${request.book._id}`)}
                
              />
            </div>

            {/* Request Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 
                    className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/books/${request.book._id}`)}
                  >
                    {request.book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {request.book.author}
                  </p>
                </div>
                <Badge 
                  variant="secondary"
                  className={getExchangeStatusColor(request.status)}
                >
                  {request.status}
                </Badge>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.avatar} />
                  <AvatarFallback>
                    {getInitials(otherUser.firstName, otherUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isIncoming ? 'Requested by' : 'Owner'}: {otherUser.firstName} {otherUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{otherUser.username}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">Message:</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {request.message}
                </p>
              </div>

              {/* Response (if exists) */}
              {request.response && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Response:</p>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                    {request.response}
                  </p>
                </div>
              )}

              {/* Contact Information - Show for Accepted Requests */}
              {isAccepted && (
                <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Exchange Accepted - Contact Details</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        <strong>Name:</strong> {otherUser.firstName} {otherUser.lastName}
                      </span>
                    </div>
                    {otherUser.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">
                          <strong>Email:</strong> {otherUser.email}
                        </span>
                      </div>
                    )}
                    {otherUser.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">
                          <strong>Phone:</strong> {otherUser.phoneNumber}
                        </span>
                      </div>
                    )}
                    {!otherUser.phoneNumber && !otherUser.email && (
                      <p className="text-xs text-gray-600 italic">
                        Contact information not available. Use the messaging system or view their profile.
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="text-xs text-green-800">
                        <strong>Next Steps:</strong> Contact {otherUser.firstName} to arrange the book exchange. 
                        Once completed, mark the exchange as complete below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Requested {formatRelativeTime(request.requestedAt)}
                </div>
                {request.respondedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Responded {formatRelativeTime(request.respondedAt)}
                  </div>
                )}
              </div>

              {/* Offered Books (if any) */}
              {request.offeredBooks?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-2">Books offered in exchange:</p>
                  <div className="flex gap-2">
                    {request.offeredBooks.map((book) => (
                      <div 
                        key={book._id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                        onClick={() => navigate(`/books/${book._id}`)}
                      >
                        <img
                          src={book.images?.[0]?.url || '/placeholder-book.jpg'}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="text-xs font-medium text-gray-900 line-clamp-1">
                            {book.title}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConditionColor(book.condition)}`}
                          >
                            {book.condition}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isIncoming && isPending && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setResponseDialog({ open: true, request })
                        setResponseMessage('')
                      }}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResponseDialog({ open: true, request })
                        setResponseMessage('')
                      }}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                {isAccepted && request.canChat && (
                  <Button
                    size="sm"
                    onClick={() => setCompleteDialog({ open: true, request })}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Completed
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/users/${otherUser._id}`)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/books/${request.book._id}`)}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  View Book
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && !myRequests?.length && !incomingRequests?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading exchange requests..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exchange Requests</h1>
          <p className="text-gray-600 mt-2">
            Manage your book exchange requests and offers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${stat.bgColor}`}>
                      <IconComponent className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Incoming ({incomingRequests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent ({myRequests?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Incoming Requests */}
          <TabsContent value="incoming">
            {incomingRequests?.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <RequestCard key={request._id} request={request} type="incoming" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No incoming requests"
                description="When others request your books, they'll appear here"
                action={() => navigate('/my-books')}
                actionText="View My Books"
              />
            )}
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent">
            {myRequests?.length > 0 ? (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <RequestCard key={request._id} request={request} type="sent" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Send}
                title="No sent requests"
                description="Browse books and send exchange requests to get started"
                action={() => navigate('/books')}
                actionText="Browse Books"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Dialog */}
      <AlertDialog open={responseDialog.open} onOpenChange={(open) => setResponseDialog({ open, request: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Respond to Exchange Request</AlertDialogTitle>
            <AlertDialogDescription>
              {responseDialog.request && (
                <>
                  <p className="mb-2">
                    Request for: <strong>{responseDialog.request.book.title}</strong>
                  </p>
                  <p className="mb-4">
                    From: <strong>{responseDialog.request.requester.firstName} {responseDialog.request.requester.lastName}</strong>
                  </p>
                </>
              )}
              <Textarea
                placeholder="Add a response message (optional)..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => handleRespond('reject')}
              disabled={requestLoading}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              Reject
            </Button>
            <AlertDialogAction
              onClick={() => handleRespond('accept')}
              disabled={requestLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {requestLoading ? 'Processing...' : 'Accept'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <AlertDialog open={completeDialog.open} onOpenChange={(open) => setCompleteDialog({ open, request: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Exchange as Complete</AlertDialogTitle>
            <AlertDialogDescription>
              Have you successfully completed the exchange of "{completeDialog.request?.book.title}"?
              This action will mark the exchange as completed and update your statistics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkComplete}
              disabled={requestLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {requestLoading ? 'Processing...' : 'Mark as Completed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ExchangeRequests