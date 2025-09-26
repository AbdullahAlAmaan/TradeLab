import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

// Placeholder components for other pages
const Portfolios = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">📊</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Portfolios</h1>
        <p className="text-gray-600 text-lg">Portfolio management features coming soon...</p>
      </div>
    </div>
  </div>
)

const Backtest = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">📈</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">Backtest Engine</h1>
        <p className="text-gray-600 text-lg">Strategy backtesting features coming soon...</p>
      </div>
    </div>
  </div>
)

const Risk = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">🛡️</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">Risk Analysis</h1>
        <p className="text-gray-600 text-lg">Advanced risk metrics coming soon...</p>
      </div>
    </div>
  </div>
)

const Trading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">💰</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Paper Trading</h1>
        <p className="text-gray-600 text-lg">Paper trading features coming soon...</p>
      </div>
    </div>
  </div>
)

const Settings = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-white">⚙️</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent mb-4">Settings</h1>
        <p className="text-gray-600 text-lg">User settings and preferences coming soon...</p>
      </div>
    </div>
  </div>
)

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <Loading message="Authenticating..." />
  }
  
  return user ? children : <Navigate to="/login" />
}

// Public Route component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <Loading message="Authenticating..." />
  }
  
  return user ? <Navigate to="/" /> : children
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/portfolios" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Portfolios />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/backtest" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Backtest />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/risk" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Risk />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trading" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Trading />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  )
}

export default App