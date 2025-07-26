'use client'

import { clsx } from 'clsx'
import { 
  BookOpen, 
  Search, 
  Upload, 
  BarChart3, 
  Calendar, 
  MessageSquare, 
  FileQuestion, 
  User, 
  Bell,
  Home
} from 'lucide-react'
import { DashboardView } from './Dashboard'

interface SidebarProps {
  currentView: DashboardView
  onViewChange: (view: DashboardView) => void
  selectedCourseId: number | null
}

export default function Sidebar({ currentView, onViewChange, selectedCourseId }: SidebarProps) {
  const menuItems = [
    {
      id: 'courses' as DashboardView,
      label: 'Courses',
      icon: BookOpen,
      description: 'Browse your enrolled courses'
    },
    {
      id: 'assignments' as DashboardView,
      label: 'Assignments',
      icon: Upload,
      description: 'Upload submissions'
    },
    {
      id: 'grades' as DashboardView,
      label: 'Grades',
      icon: BarChart3,
      description: 'View your academic performance'
    },
    {
      id: 'quizzes' as DashboardView,
      label: 'Quizzes',
      icon: FileQuestion,
      description: 'Take assessments and tests'
    },
    {
      id: 'forums' as DashboardView,
      label: 'Forums',
      icon: MessageSquare,
      description: 'Join course discussions'
    },
    {
      id: 'calendar' as DashboardView,
      label: 'Calendar',
      icon: Calendar,
      description: 'Manage your schedule'
    },
    {
      id: 'search' as DashboardView,
      label: 'Search',
      icon: Search,
      description: 'Find learning materials'
    }
  ]

  const userMenuItems = [
    {
      id: 'notifications' as DashboardView,
      label: 'Notifications',
      icon: Bell,
      description: 'View updates and alerts'
    },
    {
      id: 'profile' as DashboardView,
      label: 'Profile',
      icon: User,
      description: 'Manage your account'
    }
  ]

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Main Navigation */}
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Learning
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={clsx(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={clsx('w-5 h-5', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* User Section */}
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Account
          </div>
          <nav className="space-y-2">
            {userMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={clsx(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={clsx('w-5 h-5', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
        
        {selectedCourseId && (
          <div className="pt-6 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Selected Course
            </div>
            <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
              <div className="text-sm font-medium text-gray-900">
                Course ID: {selectedCourseId}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => onViewChange('search')}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Search materials
                </button>
                <span className="text-xs text-gray-400">•</span>
                <button
                  onClick={() => onViewChange('assignments')}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View assignments
                </button>
                <span className="text-xs text-gray-400">•</span>
                <button
                  onClick={() => onViewChange('forums')}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Join discussions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}