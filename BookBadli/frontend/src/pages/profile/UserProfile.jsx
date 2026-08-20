import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Calendar,
  Star,
  Mail,
  Phone,
  MessageSquare,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BookGrid from "../../components/books/BookGrid";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { getInitials, formatDate } from "@/lib/utils";
import api from "../../services/api";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [profileUser, setProfileUser] = useState(null);
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("books");

  const isOwnProfile = currentUser?._id === userId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user books
        const booksResponse = await api.get(`/books/user/${userId}`);

        console.log("Books response:", booksResponse.data); // Debug log

        if (booksResponse.data.success) {
          const books = booksResponse.data.data.books;
          const userData = booksResponse.data.data.user;

          setUserBooks(books);
          setProfileUser(userData);

          console.log("Profile user:", userData);
          console.log("User books:", books); 
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        console.error("API Error:", err); 
        console.error("Error response:", err.response); 
        setError(err.response?.data?.error || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleBookClick = (book) => {
    navigate(`/books/${book._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading profile..." />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              User Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The user profile you are looking for does not exist."}
            </p>
            <Button onClick={() => navigate("/books")}>Browse Books</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOwnProfile) {
    navigate("/profile");
    return null;
  }

  const stats = [
    {
      label: "Books Listed",
      value: profileUser.stats?.totalBooksUploaded || 0,
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      label: "Total Exchanges",
      value: profileUser.stats?.totalExchanges || 0,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Rating",
      value: profileUser.stats?.rating
        ? `${profileUser.stats.rating.toFixed(1)}/5`
        : "New User",
      icon: Star,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback className="text-3xl">
                  {getInitials(profileUser.firstName, profileUser.lastName)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profileUser.firstName} {profileUser.lastName}
                    </h1>
                    <p className="text-gray-600 mb-2">
                      @{profileUser.username}
                    </p>
                  </div>

                  {isAuthenticated && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profileUser.bio && (
                  <p className="text-gray-700 mb-4 whitespace-pre-line">
                    {profileUser.bio}
                  </p>
                )}

                {/* Location & Member Since */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  {profileUser.location?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profileUser.location.city}
                      {profileUser.location.state &&
                        `, ${profileUser.location.state}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(profileUser.createdAt)}
                  </div>
                </div>

                {/* Contact Info - Only for authenticated users */}
                {isAuthenticated && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                      Contact Information
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4" />
                        <a
                          href={`mailto:${profileUser.email}`}
                          className="hover:text-blue-600"
                        >
                          {profileUser.email}
                        </a>
                      </div>
                      {profileUser.phoneNumber && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="h-4 w-4" />
                          <a
                            href={`tel:${profileUser.phoneNumber}`}
                            className="hover:text-blue-600"
                          >
                            {profileUser.phoneNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isAuthenticated && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertDescription className="text-amber-800">
                      Sign in to view contact information and send messages
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-full">
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Books Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {profileUser.firstName}'s Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="books">
                  All Books ({userBooks.length})
                </TabsTrigger>
                <TabsTrigger value="available">
                  Available (
                  {userBooks.filter((b) => b.status === "Available").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="books">
                {userBooks.length > 0 ? (
                  <BookGrid
                    books={userBooks}
                    showOwner={false}
                    showDistance={false}
                    showActions={isAuthenticated}
                    onExchangeRequest={handleBookClick}
                  />
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No books listed yet"
                    description={`${profileUser.firstName} hasn't added any books to their collection yet.`}
                    className="py-12"
                  />
                )}
              </TabsContent>

              <TabsContent value="available">
                {userBooks.filter((b) => b.status === "Available").length >
                0 ? (
                  <BookGrid
                    books={userBooks.filter((b) => b.status === "Available")}
                    showOwner={false}
                    showDistance={false}
                    showActions={isAuthenticated}
                    onExchangeRequest={handleBookClick}
                  />
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No books available"
                    description={`${profileUser.firstName} doesn't have any books available for exchange right now.`}
                    className="py-12"
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
