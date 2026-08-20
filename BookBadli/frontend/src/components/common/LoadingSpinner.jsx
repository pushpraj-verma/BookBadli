import React from 'react'
import { cn } from '@/lib/utils'

const LoadingSpinner = ({ 
  size = 'default', 
  className,
  text = '',
  fullScreen = false,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size],
          className
        )}
        {...props}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner