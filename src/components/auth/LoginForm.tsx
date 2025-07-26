'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { MoodleConfig } from '@/lib/moodleAPI'
import { Eye, EyeOff, HelpCircle, Play } from 'lucide-react'

interface LoginFormData {
  baseUrl: string
  token: string
}

export default function LoginForm() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    
    const config: MoodleConfig = {
      baseUrl: data.baseUrl.trim(),
      token: data.token.trim(),
    }

    const success = await login(config)
    
    if (!success) {
      setError('token', {
        type: 'manual',
        message: 'Failed to authenticate. Please check your credentials.',
      })
    }
    
    setLoading(false)
  }

  const startDemo = async () => {
    setLoading(true)
    
    const demoConfig: MoodleConfig = {
      baseUrl: 'https://demo.moodle.localhost',
      token: 'demo_token_12345678901234567890',
      demoMode: true,
    }

    const success = await login(demoConfig)
    
    if (!success) {
      setError('token', {
        type: 'manual',
        message: 'Demo mode failed to start.',
      })
    }
    
    setLoading(false)
  }

  return (
    <div className="card">
      {/* Demo Mode Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">🎭 Try Demo Mode</h3>
            <p className="text-sm text-blue-600 mt-1">
              Test all features without needing a Moodle instance
            </p>
          </div>
          <Button
            type="button"
            onClick={startDemo}
            loading={loading}
            variant="secondary"
            size="small"
            icon={<Play className="w-4 h-4" />}
          >
            Start Demo
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Moodle URL
          </label>
          <input
            {...register('baseUrl', {
              required: 'Moodle URL is required',
              pattern: {
                value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                message: 'Please enter a valid URL',
              },
            })}
            type="url"
            id="baseUrl"
            placeholder="https://your-moodle-site.com"
            className="input-field"
          />
          {errors.baseUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.baseUrl.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              API Token
            </label>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-primary-600 hover:text-primary-700"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <input
              {...register('token', {
                required: 'API Token is required',
                minLength: {
                  value: 32,
                  message: 'Token must be at least 32 characters',
                },
              })}
              type={showToken ? 'text' : 'password'}
              id="token"
              placeholder="Your Moodle web service token"
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showToken ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {errors.token && (
            <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
          )}
        </div>

        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">How to get your API Token:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Log in to your Moodle site</li>
              <li>Go to User menu → Preferences → User account → Security keys</li>
              <li>Create a new web service token or copy an existing one</li>
              <li>Paste the token here</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              Note: Your administrator must enable web services and grant you the appropriate permissions.
            </p>
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="large"
        >
          Connect to Moodle
        </Button>
      </form>
    </div>
  )
}