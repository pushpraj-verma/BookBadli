import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary