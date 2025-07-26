'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createMoodleAPI, MoodleAPI, MoodleUser, MoodleConfig } from '@/lib/moodleAPI'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: MoodleUser | null
  moodleAPI: MoodleAPI | null
  loading: boolean
  login: (config: MoodleConfig) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MoodleUser | null>(null)
  const [moodleAPI, setMoodleAPI] = useState<MoodleAPI | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const savedConfig = Cookies.get('moodle_config')
      if (savedConfig) {
        const config: MoodleConfig = JSON.parse(savedConfig)
        const api = createMoodleAPI(config)
        
        // Validate the saved token
        const isValid = await api.validateToken()
        if (isValid) {
          const userInfo = await api.getUserInfo()
          setUser(userInfo)
          setMoodleAPI(api)
        } else {
          // Token is invalid, clear saved data
          Cookies.remove('moodle_config')
          toast.error('Session expired. Please login again.')
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      Cookies.remove('moodle_config')
    } finally {
      setLoading(false)
    }
  }

  const login = async (config: MoodleConfig): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Validate Moodle URL format
      if (!config.baseUrl.startsWith('http')) {
        config.baseUrl = 'https://' + config.baseUrl
      }
      
      // Remove trailing slash
      config.baseUrl = config.baseUrl.replace(/\/$/, '')
      
      const api = createMoodleAPI(config)
      
      // Test the connection and get user info
      const userInfo = await api.getUserInfo()
      
      // Save configuration and user data
      setUser(userInfo)
      setMoodleAPI(api)
      
      // Save to cookies (expires in 7 days)
      Cookies.set('moodle_config', JSON.stringify(config), { expires: 7 })
      
      toast.success(`Welcome, ${userInfo.fullname}!`)
      return true
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Failed to connect to Moodle'
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your Moodle URL.'
        } else if (error.message.includes('token')) {
          errorMessage = 'Invalid token. Please check your API token.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setMoodleAPI(null)
    Cookies.remove('moodle_config')
    toast.success('Logged out successfully')
  }

  const value: AuthContextType = {
    user,
    moodleAPI,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!moodleAPI,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext