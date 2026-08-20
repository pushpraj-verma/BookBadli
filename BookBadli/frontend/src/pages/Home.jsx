import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { BookOpen, Users, MapPin, ArrowRight, Search, Shield, Heart } from 'lucide-react'
import { fetchBooks } from '../store/slices/bookSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import BookGrid from '../components/books/BookGrid'

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { books, loading } = useSelector(state => state.books)
  const { isAuthenticated, user } = useSelector(state => state.auth)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchBooks({ limit: 8, sortBy: 'newest' }))
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/books/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleExchangeRequest = (book) => {
    console.log('Exchange request for:', book.title)
  }

  const features = [
    {
      icon: BookOpen,
      title: "Exchange Books",
      description: "Trade your books with fellow book lovers without spending money.",
      authBenefit: "Start exchanging immediately"
    },
    {
      icon: MapPin,
      title: "Find Nearby",
      description: "Discover books available for exchange in your neighborhood.",
      authBenefit: "See exact locations and distances"
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with readers who share your interests and preferences.",
      authBenefit: "View full user profiles and ratings"
    }
  ];

  const stats = [
    { label: "Books Available", value: "10,000+", icon: BookOpen },
    { label: "Active Users", value: "2,500+", icon: Users },
    { label: "Successful Exchanges", value: "5,000+", icon: Heart }
  ];

  const authBenefits = [
    "View book owner details and profiles",
    "Send exchange requests instantly",
    "Save books to your wishlist",
    "Get personalized recommendations",
    "Access advanced search filters",
    "Track your exchange history"
  ];

  const howItWorksSteps = (isAuthenticated) => [
    {
      step: "1",
      title: isAuthenticated ? "List Your Books" : "Create Account",
      description: isAuthenticated
        ? "Upload photos and details of books you want to exchange."
        : "Sign up for free and set up your profile."
    },
    {
      step: "2",
      title: isAuthenticated ? "Find & Request" : "Browse & Discover",
      description: isAuthenticated
        ? "Browse books near you and send exchange requests."
        : "Explore thousands of books from readers in your area."
    },
    {
      step: "3",
      title: isAuthenticated ? "Meet & Exchange" : "Start Exchanging",
      description: isAuthenticated
        ? "Connect with other readers and complete your exchange."
        : "List your books and start making exchange requests."
    }
  ];
  const steps = howItWorksSteps(isAuthenticated);


  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
              Exchange Books, <span className="block text-blue-200">Build Community</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {isAuthenticated
                ? `Welcome back, ${user?.firstName}! Discover your next great read.`
                : "Trade books without money. Connect with readers and grow your personal library."}
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for 'The Alchemist'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-28 py-3 text-gray-900 bg-white rounded-full border-0 shadow-lg focus:ring-4 focus:ring-blue-300 transition-shadow"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-full px-6"
                >
                  Search
                </Button>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button size="lg" onClick={() => navigate('/books')} className="text-lg px-8 py-3">Browse Books</Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/books/create')} className="text-lg px-8 py-3 bg-white/10 border-white text-white hover:bg-white hover:text-blue-600">Add Your Book</Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="text-lg px-8 py-3">Get Started Free</Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/books')} className="text-lg px-8 py-3 bg-white/10 border-white text-white hover:bg-white hover:text-blue-600">Browse Collection</Button>
                </>
              )}
            </div>
            
            {!isAuthenticated && (
              <div className="mt-10 max-w-md mx-auto p-3 bg-black/20 rounded-lg border border-white/20">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-5 w-5 text-blue-200" />
                  <span className="font-semibold text-sm">Sign up to unlock full features & contact owners!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="p-8">
                  <IconComponent className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                  <div className="text-gray-500 font-medium tracking-wide uppercase text-sm">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Books Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Recently Added Books</h2>
              <p className="text-gray-600">
                {isAuthenticated
                  ? "Discover the latest books available for exchange"
                  : "Preview our collection - sign up to start exchanging"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/books')}
              className="hidden md:flex items-center gap-2"
            >
              View All Books
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {!isAuthenticated && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Limited Preview</h3>
                  <p className="text-amber-700 text-sm mb-2">
                    You're viewing books as a guest. Sign up for full access:
                  </p>
                  <ul className="text-amber-700 text-sm list-disc list-inside space-y-1">
                    <li>Contact book owners directly</li>
                    <li>Send and manage exchange requests</li>
                    <li>Save books to your personal wishlist</li>
                  </ul>
                  <Button
                    size="sm"
                    onClick={() => navigate('/register')}
                    className="mt-3 bg-amber-600 hover:bg-amber-700"
                  >
                    Sign Up for Full Access
                  </Button>
                </div>
              </div>
            </div>
          )}

          <BookGrid
            books={books}
            loading={loading}
            onExchangeRequest={handleExchangeRequest}
            // ... other props for BookGrid
          />

          <div className="text-center mt-8 md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate('/books')}
              className="w-full sm:w-auto"
            >
              View All Books
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose BookBadli?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of book lovers who are rediscovering the joy of reading through sharing and community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="text-center p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    {!isAuthenticated && feature.authBenefit && (
                      <Badge variant="secondary" className="font-semibold text-blue-700 bg-blue-100">
                        {feature.authBenefit}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Authentication Benefits Section */}
      {!isAuthenticated && (
        <section className="py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Unlock Full Access</h2>
            <p className="text-lg text-gray-600 mb-8">
              Create a free account to access all BookBadli features.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8 text-left">
              {authBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/register')} className="text-lg px-8 py-3">Create Free Account</Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-3">Already have an account?</Button>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className={`py-16 md:py-20 lg:py-24 ${!isAuthenticated ? 'bg-slate-50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start exchanging books in three simple, straightforward steps.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            <div className="hidden md:block absolute top-8 left-0 w-full">
              <svg className="w-full" height="2">
                <line x1="16.66%" y1="0" x2="83.33%" y2="0" strokeWidth="2" strokeDasharray="8, 8" className="stroke-gray-300" />
              </svg>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold ring-8 ring-white">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-blue-700 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Exchanging?</h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our community of book lovers and start building your dream library today, one exchange at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/register')} className="text-lg px-8 py-3">Sign Up Free</Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/books')} className="text-lg px-8 py-3 bg-white/10 border-white text-white hover:bg-white hover:text-blue-600">Browse Books First</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home