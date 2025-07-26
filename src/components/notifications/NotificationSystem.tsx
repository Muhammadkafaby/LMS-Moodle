'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Mail, 
  MessageSquare, 
  Calendar, 
  AlertTriangle,
  Info,
  CheckCircle,
  Filter,
  Archive,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Notification {
  id: number
  useridfrom: number
  useridto: number
  subject: string
  fullmessage: string
  fullmessageformat: number
  fullmessagehtml: string
  smallmessage: string
  notification: number
  contexturl: string
  contexturlname: string
  timecreated: number
  timeread: number
  component: string
  eventtype: string
  customdata: string
  read: boolean
  deleted: boolean
}

interface NotificationSystemProps {
  embedded?: boolean
}

export default function NotificationSystem({ embedded = false }: NotificationSystemProps) {
  const { moodleAPI, user } = useAuth()
  const queryClient = useQueryClient()
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery<Notification[]>(
    ['notifications', user?.id, filter],
    () => moodleAPI!.getNotifications(user!.id, filter),
    {
      enabled: !!moodleAPI && !!user,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refresh every minute
    }
  )

  const markAsReadMutation = useMutation(
    async (notificationId: number) => {
      return moodleAPI!.markNotificationAsRead(notificationId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications'])
      },
      onError: () => {
        toast.error('Failed to mark notification as read')
      },
    }
  )

  const markAllAsReadMutation = useMutation(
    async () => {
      return moodleAPI!.markAllNotificationsAsRead(user!.id)
    },
    {
      onSuccess: () => {
        toast.success('All notifications marked as read')
        queryClient.invalidateQueries(['notifications'])
      },
      onError: () => {
        toast.error('Failed to mark all notifications as read')
      },
    }
  )

  const deleteNotificationMutation = useMutation(
    async (notificationId: number) => {
      return moodleAPI!.deleteNotification(notificationId)
    },
    {
      onSuccess: () => {
        toast.success('Notification deleted')
        queryClient.invalidateQueries(['notifications'])
      },
      onError: () => {
        toast.error('Failed to delete notification')
      },
    }
  )

  const getNotificationIcon = (eventType: string, component: string) => {
    switch (eventType) {
      case 'assign':
        return <Calendar className="w-5 h-5 text-blue-500" />
      case 'forum':
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case 'quiz':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'grade':
        return <CheckCircle className="w-5 h-5 text-purple-500" />
      case 'message':
        return <Mail className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'assign':
        return 'bg-blue-100 text-blue-800'
      case 'forum':
        return 'bg-green-100 text-green-800'
      case 'quiz':
        return 'bg-orange-100 text-orange-800'
      case 'grade':
        return 'bg-purple-100 text-purple-800'
      case 'message':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - (timestamp * 1000)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const filteredNotifications = notifications?.filter(notification => {
    if (selectedType !== 'all' && notification.eventtype !== selectedType) {
      return false
    }
    return true
  }) || []

  const unreadCount = notifications?.filter(n => !n.read).length || 0
  const notificationTypes = Array.from(new Set(notifications?.map(n => n.eventtype) || []))

  if (embedded) {
    // Embedded version for header dropdown
    return (
      <div className="w-80">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <LoadingSpinner />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.eventtype, notification.component)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.subject}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.smallmessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timecreated)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <BellOff className="w-8 h-8 mx-auto mb-2" />
              <p>No notifications</p>
            </div>
          )}
        </div>
        
        {filteredNotifications.length > 5 && (
          <div className="p-4 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full">
              View All Notifications
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Full page version
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsReadMutation.mutate()}
                loading={markAllAsReadMutation.isLoading}
                variant="outline"
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field w-auto"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Types</option>
              {notificationTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <div className="card">
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load notifications.</p>
          </div>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`card hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.eventtype, notification.component)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {notification.subject}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.eventtype)}`}>
                          {notification.eventtype}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTime(notification.timecreated)}
                        </span>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          loading={markAsReadMutation.isLoading}
                          variant="outline"
                          size="sm"
                          icon={<Check className="w-3 h-3" />}
                        >
                          Mark Read
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        loading={deleteNotificationMutation.isLoading}
                        variant="outline"
                        size="sm"
                        icon={<Trash2 className="w-3 h-3" />}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-gray-700">
                      {notification.smallmessage}
                    </p>
                    
                    {notification.contexturlname && notification.contexturl && (
                      <a
                        href={notification.contexturl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <span>{notification.contexturlname}</span>
                        <Info className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You don't have any unread notifications."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}