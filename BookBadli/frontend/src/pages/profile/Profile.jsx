import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { User, MapPin, Lock, Bell, Mail, Phone, Edit2, Save, X } from 'lucide-react'
import { updateUserProfile, updateUserLocation, fetchUserProfile } from '../../store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getInitials } from '@/lib/utils'

const Profile = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector(state => state.auth)

  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phoneNumber: ''
  })

  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        phoneNumber: user.phoneNumber || ''
      })

      setLocationData({
        address: user.location?.address || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        latitude: user.location?.coordinates?.[1] || '',
        longitude: user.location?.coordinates?.[0] || ''
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleLocationChange = (e) => {
    const { name, value } = e.target
    setLocationData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setErrors({})
    setSuccessMessage('')

    try {
      await dispatch(updateUserProfile(profileData)).unwrap()
      setSuccessMessage('Profile updated successfully!')
      setEditMode(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrors({ submit: error || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLocation = async () => {
    setSaving(true)
    setErrors({})
    setSuccessMessage('')

    // Validate coordinates
    if (!locationData.latitude || !locationData.longitude) {
      setErrors({ location: 'Latitude and longitude are required' })
      setSaving(false)
      return
    }

    try {
      await dispatch(updateUserLocation({
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        address: locationData.address,
        city: locationData.city,
        state: locationData.state
      })).unwrap()

      setSuccessMessage('Location updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrors({ submit: error || 'Failed to update location' })
    } finally {
      setSaving(false)
    }
  }

  const requestCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }))
          setSuccessMessage('Location detected! Please fill in address details and save.')
          setTimeout(() => setSuccessMessage(''), 3000)
        },
        (error) => {
          setErrors({ location: 'Unable to detect location. Please enter manually.' })
        }
      )
    } else {
      setErrors({ location: 'Geolocation is not supported by your browser' })
    }
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {(error || errors.submit) && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error || errors.submit}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-600 mb-4">@{user?.username}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-gray-600">Books Listed</span>
                    <span className="font-semibold">{user?.stats?.totalBooksUploaded || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-gray-600">Exchanges</span>
                    <span className="font-semibold">{user?.stats?.totalExchanges || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-b">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-semibold">
                      {user?.stats?.rating ? `${user.stats.rating.toFixed(1)}/5` : 'New'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    {!editMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          disabled={!editMode}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={user?.username}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profileData.phoneNumber}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        rows={4}
                        maxLength={500}
                        placeholder="Tell others about your reading preferences..."
                      />
                      {editMode && (
                        <p className="text-xs text-gray-500 mt-1">
                          {profileData.bio.length}/500 characters
                        </p>
                      )}
                    </div>

                    {editMode && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMode(false)
                            setProfileData({
                              firstName: user?.firstName || '',
                              lastName: user?.lastName || '',
                              bio: user?.bio || '',
                              phoneNumber: user?.phoneNumber || ''
                            })
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Location Settings</CardTitle>
                    <p className="text-sm text-gray-600">
                      Set your location to discover books near you
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {errors.location && (
                      <Alert variant="destructive">
                        <AlertDescription>{errors.location}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Button
                        variant="outline"
                        onClick={requestCurrentLocation}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Use Current Location
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude *</Label>
                        <Input
                          id="latitude"
                          name="latitude"
                          type="number"
                          step="0.000001"
                          value={locationData.latitude}
                          onChange={handleLocationChange}
                          placeholder="28.6139"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude *</Label>
                        <Input
                          id="longitude"
                          name="longitude"
                          type="number"
                          step="0.000001"
                          value={locationData.longitude}
                          onChange={handleLocationChange}
                          placeholder="77.2090"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={locationData.address}
                        onChange={handleLocationChange}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={locationData.city}
                          onChange={handleLocationChange}
                          placeholder="New Delhi"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={locationData.state}
                          onChange={handleLocationChange}
                          placeholder="Delhi"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveLocation}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Location
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Password change feature will be implemented in a future update.
                        For now, if you need to change your password, please contact support.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>Account Status</Label>
                      <div className="mt-2 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          Your account is <strong>Active</strong> and in good standing
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Member Since</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(user?.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile