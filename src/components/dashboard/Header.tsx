'use client'

import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { LogOut, User, Bell } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 animate-fade-in">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white" tabIndex={0} aria-label="App Title">
              Moodle Integration App
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <button aria-label="Toggle dark mode" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              {/* Icon for dark mode toggle, implement logic as needed */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m8.485-8.485l-.707.707M4.222 4.222l-.707.707m16.97 10.606l-.707-.707M4.222 19.778l-.707-.707M21 12h-1M4 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button aria-label="Notifications" className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              {/* Notification icon */}
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className="flex items-center space-x-2">
              {user?.profileimageurl ? (
                <Image
                  src={user.profileimageurl}
                  alt={user.fullname}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-primary-500"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullname}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={logout}
              icon={<LogOut className="w-4 h-4" />}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}