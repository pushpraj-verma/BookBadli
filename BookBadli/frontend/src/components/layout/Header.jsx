import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Search, BookOpen, User, LogOut, Plus, Menu, X, Bell } from 'lucide-react'
import { logoutUser } from '../../store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const useClickOutside = (handler) => {
  let domNode = useRef();

  useEffect(() => {
    let maybeHandler = (event) => {
      if (domNode.current && !domNode.current.contains(event.target)) {
        handler();
      }
    };
    document.addEventListener("mousedown", maybeHandler);
    return () => {
      document.removeEventListener("mousedown", maybeHandler);
    };
  });

  return domNode;
};

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  
  let dropdownRef = useClickOutside(() => {
    setShowUserDropdown(false);
  });

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/')
      setIsMobileMenuOpen(false)
      setShowUserDropdown(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/books/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMobileMenuOpen(false)
    }
  }
  
  const navLinks = [
    { to: '/books', label: 'Browse Books', auth: false },
    { to: '/books/nearby', label: 'Nearby', auth: false },
    { to: '/dashboard', label: 'Dashboard', auth: true },
    { to: '/my-books', label: 'My Books', auth: true },
    { to: '/exchanges', label: 'Exchanges', auth: true },
  ];

  const NavLink = ({ to, children, className, onClick }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`transition-colors duration-200 ${className} ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600 font-medium'}`}
      >
        {children}
      </Link>
    )
  }
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">BookBadli</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.filter(link => !link.auth).map(link => (
                  <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
              ))}
              {isAuthenticated && navLinks.filter(link => link.auth).map(link => (
                  <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:block w-64">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </form>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/books/create')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Book</span>
                  </Button>
                  
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  </button>

                  <div className="relative" ref={dropdownRef}>
                    <button
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user?.firstName, user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block text-sm font-medium text-gray-700">
                        {user?.firstName}
                      </span>
                    </button>

                    <div className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 transition-all duration-300 ease-in-out ${showUserDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                        <div className="px-4 py-3 border-b">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                            <NavLink to="/profile" onClick={() => setShowUserDropdown(false)} className="flex items-center w-full px-4 py-2 text-sm">
                                <User className="h-4 w-4 mr-3" /> Profile
                            </NavLink>
                            <NavLink to="/dashboard" onClick={() => setShowUserDropdown(false)} className="flex items-center w-full px-4 py-2 text-sm">
                                <BookOpen className="h-4 w-4 mr-3" /> Dashboard
                            </NavLink>
                        </div>
                        <div className="py-1 border-t">
                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <LogOut className="h-4 w-4 mr-3" /> Sign Out
                            </button>
                        </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
                  <Button onClick={() => navigate('/register')}>Sign Up</Button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen border-t' : 'max-h-0'}`}>
          <div className="py-4 px-2 space-y-4">
            <form onSubmit={handleSearch} className="px-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1 px-2">
                {navLinks.filter(link => !link.auth).map(link => (
                    <NavLink key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base">{link.label}</NavLink>
                ))}
                
                {isAuthenticated ? (
                    <>
                        <div className="h-px bg-gray-200 my-2" />
                        {navLinks.filter(link => link.auth).map(link => (
                            <NavLink key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base">{link.label}</NavLink>
                        ))}
                        <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base">Profile</NavLink>
                        <NavLink to="/books/create" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base">Add New Book</NavLink>
                        <div className="h-px bg-gray-200 my-2" />
                        <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base text-red-600 font-medium rounded-md hover:bg-red-50">
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <div className="h-px bg-gray-200 my-2" />
                        <NavLink to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base">Sign In</NavLink>
                        <NavLink to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base">Sign Up</NavLink>
                    </>
                )}
            </nav>
          </div>
      </div>
    </header>
  )
}

export default Header
