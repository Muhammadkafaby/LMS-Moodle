'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Globe, 
  Camera, 
  Edit3, 
  Save, 
  X,
  Shield,
  Key,
  Bell,
  Download,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: number
  username: string
  firstname: string
  lastname: string
  fullname: string
  email: string
  description: string
  descriptionformat: number
  city: string
  country: string
  timezone: string
  firstaccess: number
  lastaccess: number
  lastlogin: number
  currentlogin: number
  lang: string
  theme: string
  mailformat: number
  maildigest: number
  maildisplay: number
  autosubscribe: boolean
  trackforums: boolean
  completed: boolean
  suspended: boolean
  confirmed: boolean
  profileimageurl: string
  profileimageurlsmall: string
  customfields: CustomField[]
  preferences: UserPreference[]
}

interface CustomField {
  type: string
  value: string
  name: string
  shortname: string
}

interface UserPreference {
  name: string
  value: string
}

export default function UserProfile() {
  const { user, moodleAPI } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'privacy'>('profile')
  const [editData, setEditData] = useState<Partial<UserProfile>>({})

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>(
    ['user-profile', user?.id],
    () => moodleAPI!.getUserProfile(user!.id),
    {
      enabled: !!moodleAPI && !!user,
      staleTime: 5 * 60 * 1000,
    }
  )

  const updateProfileMutation = useMutation(
    async (updates: Partial<UserProfile>) => {
      return moodleAPI!.updateUserProfile(user!.id, updates)
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        setEditData({})
        queryClient.invalidateQueries(['user-profile'])
      },
      onError: () => {
        toast.error('Failed to update profile')
      },
    }
  )

  const uploadProfileImageMutation = useMutation(
    async (file: File) => {
      return moodleAPI!.uploadProfileImage(user!.id, file)
    },
    {
      onSuccess: () => {
        toast.success('Profile image updated successfully!')
        queryClient.invalidateQueries(['user-profile'])
      },
      onError: () => {
        toast.error('Failed to upload profile image')
      },
    }
  )

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadProfileImageMutation.mutate(file)
    }
  }

  const handleSave = () => {
    updateProfileMutation.mutate(editData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatLastAccess = (timestamp: number) => {
    const now = Date.now()
    const diff = now - (timestamp * 1000)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
              {profile.profileimageurl ? (
                <img 
                  src={profile.profileimageurl} 
                  alt={profile.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                  {profile.firstname.charAt(0)}{profile.lastname.charAt(0)}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.fullname}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Last active: {formatLastAccess(profile.lastaccess)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    icon={<Edit3 className="w-4 h-4" />}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      icon={<X className="w-4 h-4" />}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      loading={updateProfileMutation.isLoading}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4 mt-4">
              {profile.confirmed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
              {!profile.suspended && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
              {profile.completed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Profile Complete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'preferences', label: 'Preferences', icon: Bell },
            { id: 'privacy', label: 'Privacy', icon: Key },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.firstname || profile.firstname}
                      onChange={(e) => setEditData(prev => ({ ...prev, firstname: e.target.value }))}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.firstname}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.lastname || profile.lastname}
                      onChange={(e) => setEditData(prev => ({ ...prev, lastname: e.target.value }))}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.lastname}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profile.email}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.description || profile.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profile.description || 'No description provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Contact</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.city || profile.city}
                      onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                      className="input-field"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.city || 'Not specified'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.country || profile.country}
                      onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                      className="input-field"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.country || 'Not specified'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                {isEditing ? (
                  <select
                    value={editData.timezone || profile.timezone}
                    onChange={(e) => setEditData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="input-field"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.timezone}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                {isEditing ? (
                  <select
                    value={editData.lang || profile.lang}
                    onChange={(e) => setEditData(prev => ({ ...prev, lang: e.target.value }))}
                    className="input-field"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                  </select>
                ) : (
                  <span className="text-gray-900">{profile.lang}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Account Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member since</span>
                <span className="text-sm text-gray-900">
                  {formatDate(profile.firstaccess)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last login</span>
                <span className="text-sm text-gray-900">
                  {formatDate(profile.lastlogin)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current login</span>
                <span className="text-sm text-gray-900">
                  {formatDate(profile.currentlogin)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email format</span>
                <span className="text-sm text-gray-900">
                  {profile.mailformat === 1 ? 'HTML' : 'Plain text'}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {profile.customfields && profile.customfields.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              
              <div className="space-y-3">
                {profile.customfields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{field.name}</span>
                    <span className="text-sm text-gray-900">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Password and security settings are managed by your Moodle administrator. 
                Contact your system administrator to make changes.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" disabled>
                  Contact Admin
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Password Change</h4>
                  <p className="text-sm text-gray-600">Change your account password</p>
                </div>
                <Button variant="outline" disabled>
                  Contact Admin
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Login History</h4>
                  <p className="text-sm text-gray-600">View your recent login activity</p>
                </div>
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive email notifications for course activities</p>
                </div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Forum Auto-subscribe</h4>
                  <p className="text-sm text-gray-600">Automatically subscribe to forum discussions</p>
                </div>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    defaultChecked={profile.autosubscribe}
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Forum Tracking</h4>
                  <p className="text-sm text-gray-600">Track read/unread status in forums</p>
                </div>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    defaultChecked={profile.trackforums}
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Digest</h4>
                  <p className="text-sm text-gray-600">Receive daily digest of forum posts</p>
                </div>
                <select className="input-field w-auto">
                  <option value="0">No digest</option>
                  <option value="1">Complete posts</option>
                  <option value="2">Subjects only</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Display</h4>
                  <p className="text-sm text-gray-600">Control who can see your email address</p>
                </div>
                <select 
                  className="input-field w-auto"
                  defaultValue={profile.maildisplay}
                >
                  <option value="0">Hide email from everyone</option>
                  <option value="1">Allow course members to see email</option>
                  <option value="2">Allow everyone to see email</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                  <p className="text-sm text-gray-600">Control who can view your profile</p>
                </div>
                <select className="input-field w-auto">
                  <option value="public">Public</option>
                  <option value="course">Course members only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Data Export</h4>
                  <p className="text-sm text-gray-600">Download your personal data</p>
                </div>
                <Button 
                  variant="outline" 
                  icon={<Download className="w-4 h-4" />}
                >
                  Request Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}