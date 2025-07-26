import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function LoadingSpinner({ size = 'medium', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className={clsx('animate-spin rounded-full border-2 border-gray-300 border-t-primary-600', sizeClasses[size], className)}>
      <span className="sr-only">Loading...</span>
    </div>
  )
}