'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function ConnectorCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get parameters from URL
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')

    if (success === 'true') {
      setStatus('success')
      setMessage(`Successfully connected to ${provider || 'your account'}!`)
      
      // Close the popup window after a delay
      setTimeout(() => {
        window.close()
      }, 2000)
    } else if (error) {
      setStatus('error')
      setMessage(`Connection failed: ${error}`)
      
      // Close the popup window after a delay
      setTimeout(() => {
        window.close()
      }, 3000)
    } else {
      setStatus('error')
      setMessage('Invalid callback parameters')
      
      setTimeout(() => {
        window.close()
      }, 3000)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Connection...
            </h1>
            <p className="text-gray-600">
              Please wait while we complete your connection.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Successful!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
