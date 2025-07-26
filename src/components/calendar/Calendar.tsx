'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from 'lucide-react'

interface CalendarEvent {
  id: number
  name: string
  description: string
  timestart: number
  timeduration: number
  courseid: number
  coursename: string
  eventtype: string
  location?: string
  url?: string
}

interface CalendarProps {
  courseId?: number | null
}

export default function Calendar({ courseId }: CalendarProps) {
  const { moodleAPI } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const {
    data: events,
    isLoading,
    error,
  } = useQuery(
    ['calendar-events', courseId, currentDate.getMonth(), currentDate.getFullYear()],
    () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return moodleAPI!.getCalendarEvents(
        startOfMonth.getTime() / 1000,
        endOfMonth.getTime() / 1000,
        courseId || undefined
      )
    },
    {
      enabled: !!moodleAPI,
      staleTime: 5 * 60 * 1000,
    }
  )

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []
    
    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i)
      days.push({ date: day, isCurrentMonth: false })
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i)
      days.push({ date: day, isCurrentMonth: true })
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i)
      days.push({ date: day, isCurrentMonth: false })
    }
    
    return days
  }

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    if (!events) return []
    
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    return events.filter(event => {
      const eventDate = new Date(event.timestart * 1000)
      return eventDate >= dayStart && eventDate <= dayEnd
    })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'assignment':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'quiz':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'lesson':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'forum':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const today = new Date()
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as 'month' | 'week' | 'day')}
              className="input-field w-auto"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Event
            </Button>
          </div>
        </div>

        {courseId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Showing events for Course ID: {courseId}
            </p>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center">
              <span className="text-sm font-medium text-gray-700">{day}</span>
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((dayInfo, index) => {
            const dayEvents = getEventsForDay(dayInfo.date)
            const isCurrentDay = isToday(dayInfo.date)
            
            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-[120px] ${
                  !dayInfo.isCurrentMonth ? 'text-gray-400' : ''
                } ${isCurrentDay ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay ? 'text-blue-600' : dayInfo.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {dayInfo.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded border ${getEventTypeColor(event.eventtype)} cursor-pointer hover:shadow-sm`}
                      title={`${event.name} - ${formatTime(event.timestart)}`}
                    >
                      <div className="font-medium truncate">{event.name}</div>
                      <div className="text-xs opacity-75">{formatTime(event.timestart)}</div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events
              .filter(event => event.timestart * 1000 >= Date.now())
              .sort((a, b) => a.timestart - b.timestart)
              .slice(0, 5)
              .map(event => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-md ${getEventTypeColor(event.eventtype)}`}>
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{event.name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDate(event.timestart)} at {formatTime(event.timestart)}</span>
                      </div>
                      {event.coursename && (
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{event.coursename}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {event.description.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.eventtype)}`}>
                    {event.eventtype}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming events found.</p>
          </div>
        )}
      </div>
    </div>
  )
}