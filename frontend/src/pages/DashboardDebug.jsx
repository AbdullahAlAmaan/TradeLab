import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const DashboardDebug = () => {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState('Loading...')

  useEffect(() => {
    console.log('DashboardDebug: User state:', user)
    console.log('DashboardDebug: User ID:', user?.id)
    console.log('DashboardDebug: User email:', user?.email)
    
    setDebugInfo(`
      User: ${user ? 'Logged in' : 'Not logged in'}
      User ID: ${user?.id || 'N/A'}
      User Email: ${user?.email || 'N/A'}
      Timestamp: ${new Date().toISOString()}
    `)
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">Dashboard Debug</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
            {debugInfo}
          </pre>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
          <p className="text-gray-600">Check the browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardDebug
