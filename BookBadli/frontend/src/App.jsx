import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store/store";
import { fetchUserProfile } from "./store/slices/authSlice";

// Import components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateBook from "./pages/books/CreateBook";
import MyBooks from "./pages/books/MyBooks";
import BookDetail from "./pages/books/BookDetail";
import ExchangeRequests from "./pages/exchange/ExchangeRequests";
import BookList from "./pages/books/BookList";
import EditBook from "./pages/books/EditBook";
import Profile from "./pages/profile/Profile";
import NearbyBooks from "./pages/books/NearbyBooks";
import UserProfile from "./pages/profile/UserProfile";



// Simple placeholder for missing components
//const BookList = () => <div>BookList Page</div>
//const EditBook = () => <div>EditBook Page</div>
//const Profile = () => <div>Profile Page</div>;
//const ExchangeRequests = () => <div>ExchangeRequests Page</div>
const SearchResults = () => <div>SearchResults Page</div>;
//const NearbyBooks = () => <div>NearbyBooks Page</div>;
//const UserProfile = () => <div>UserProfile Page</div>;

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// App Content Component (needs to be inside Provider to use Redux)
const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, token, isAuthenticated]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/create"
              element={
                <ProtectedRoute>
                  <CreateBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-books"
              element={
                <ProtectedRoute>
                  <MyBooks />
                </ProtectedRoute>
              }
            />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route
              path="/exchanges"
              element={
                <ProtectedRoute>
                  <ExchangeRequests />
                </ProtectedRoute>
              }
            />
            <Route path="/books" element={<BookList />} />
            <Route
              path="/books/edit/:id"
              element={
                <ProtectedRoute>
                  <EditBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/nearby"
              element={
                <ProtectedRoute>
                  <NearbyBooks/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:userid"
              element={
                <ProtectedRoute>
                  <UserProfile/>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
