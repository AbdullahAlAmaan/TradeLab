import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, dataAPI } from '../lib/api'

const IntegrationTest = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results = {}

    try {
      // Test 1: Backend Health Check
      const healthResponse = await fetch('http://localhost:8000/api/v1/health')
      results.health = healthResponse.ok ? '✅ PASS' : '❌ FAIL'

      // Test 2: Supabase Auth Status
      results.auth = user ? '✅ LOGGED IN' : '❌ NOT LOGGED IN'

      // Test 3: API Authentication (if logged in)
      if (user) {
        try {
          await authAPI.getCurrentUser()
          results.apiAuth = '✅ PASS'
        } catch (error) {
          results.apiAuth = '❌ FAIL - ' + error.message
        }
      } else {
        results.apiAuth = '⏭️ SKIP - Not logged in'
      }

      // Test 4: Data Fetch (if logged in)
      if (user) {
        try {
          await dataAPI.fetchData({ symbol: 'AAPL', asset_type: 'stock', days: 1 })
          results.dataFetch = '✅ PASS'
        } catch (error) {
          results.dataFetch = '❌ FAIL - ' + error.message
        }
      } else {
        results.dataFetch = '⏭️ SKIP - Not logged in'
      }

    } catch (error) {
      results.error = '❌ ERROR - ' + error.message
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 Integration Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Backend Health:</span>
          <span className="text-sm font-mono">{testResults.health || '⏳ Not tested'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Authentication:</span>
          <span className="text-sm font-mono">{testResults.auth || '⏳ Not tested'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">API Auth:</span>
          <span className="text-sm font-mono">{testResults.apiAuth || '⏳ Not tested'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Data Fetch:</span>
          <span className="text-sm font-mono">{testResults.dataFetch || '⏳ Not tested'}</span>
        </div>
        
        {testResults.error && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700">Error:</span>
            <span className="text-sm font-mono text-red-600">{testResults.error}</span>
          </div>
        )}
      </div>

      <button
        onClick={runTests}
        disabled={loading}
        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
      >
        {loading ? '🔄 Running Tests...' : '🧪 Run Integration Tests'}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
        <p><strong>Backend:</strong> http://localhost:8000</p>
        <p><strong>Frontend:</strong> http://localhost:5173</p>
      </div>
    </div>
  )
}

export default IntegrationTest
