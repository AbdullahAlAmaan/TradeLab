import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import DashboardTest from './pages/DashboardTest'
import DashboardDebug from './pages/DashboardDebug'
import Portfolios from './pages/Portfolios'
import Backtest from './pages/Backtest'
import Risk from './pages/Risk'
import Trading from './pages/Trading'
import Settings from './pages/Settings'
import MarketData from './pages/MarketData'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <Loading message="Checking authentication..." />
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login')
    return <Navigate to="/login" />
  }
  
  console.log('ProtectedRoute: User authenticated:', user.email)
  return children
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
        <ThemeProvider>
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
                path="/market-data" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MarketData />
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
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App