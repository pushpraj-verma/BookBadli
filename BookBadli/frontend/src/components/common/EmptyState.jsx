import React from 'react'
import { Button } from '@/components/ui/button'

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionText,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {Icon && (
        <div className="mb-4 p-3 bg-gray-100 text-gray-400 rounded-full">
          <Icon className="h-8 w-8" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && actionText && (
        <Button onClick={action}>
          {actionText}
        </Button>
      )}
    </div>
  )
}

export default EmptyState