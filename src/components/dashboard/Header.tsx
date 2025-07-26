'use client'

import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { LogOut, User } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Moodle Integration App
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user?.profileimageurl ? (
                <Image
                  src={user.profileimageurl}
                  alt={user.fullname}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.fullname}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="small"
              onClick={logout}
              icon={<LogOut className="w-4 h-4" />}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}