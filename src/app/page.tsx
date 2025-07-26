'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import Dashboard from '@/components/dashboard/Dashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Moodle Integration App
            </h1>
            <p className="text-gray-600">
              Connect to your Moodle learning platform
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return <Dashboard />
}