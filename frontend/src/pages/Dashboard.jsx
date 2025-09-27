import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Shield,
  Zap
} from 'lucide-react'
import { portfolioAPI, backtestAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import IntegrationTest from '../components/IntegrationTest'

const Dashboard = () => {
  const { user } = useAuth()
  const [portfolios, setPortfolios] = useState([])
  const [recentBacktests, setRecentBacktests] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      console.log('User not authenticated, skipping data load')
      setLoading(false)
      return
    }

    try {
      console.log('Loading dashboard data for user:', user.email)
      const [portfoliosRes, backtestsRes] = await Promise.all([
        portfolioAPI.getPortfolios(),
        backtestAPI.getResults()
      ])
      
      console.log('Portfolios response:', portfoliosRes)
      console.log('Backtests response:', backtestsRes)
      
      setPortfolios(portfoliosRes.data || [])
      setRecentBacktests((backtestsRes.data || []).slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty arrays on error to prevent blank page
      setPortfolios([])
      setRecentBacktests([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // Reset state when user changes
    if (user?.id) {
      setLoading(true)
    }
    loadDashboardData()
  }, [user?.id]) // Only depend on user.id, not loadDashboardData

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%'
    }
    return `${(value * 100).toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Fallback in case of any rendering issues
  console.log('Dashboard rendering with portfolios:', portfolios.length, 'backtests:', recentBacktests.length)

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to TradeLab
          </h1>
          <p className="text-gray-600 mb-8 text-lg">Please log in to access your dashboard</p>
          <a
            href="/login"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center"
          >
            <Activity className="h-5 w-5 mr-2" />
            Login to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to TradeLab
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Your comprehensive trading platform for backtesting, risk analysis, and paper trading</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">System Status</p>
                  <p className="text-lg font-semibold text-green-600">All Systems Go</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Portfolios</p>
              <p className="text-3xl font-bold text-gray-900">{portfolios.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span>Active portfolios</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Best Return</p>
              <p className="text-3xl font-bold text-gray-900">
                {recentBacktests.length > 0 && recentBacktests.every(bt => bt.total_return !== undefined)
                  ? formatPercentage(Math.max(...recentBacktests.map(bt => bt.total_return || 0)))
                  : '0.00%'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Target className="h-4 w-4 text-green-500 mr-1" />
            <span>Top performance</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Backtests</p>
              <p className="text-3xl font-bold text-gray-900">{recentBacktests.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Zap className="h-4 w-4 text-purple-500 mr-1" />
            <span>Strategy tests</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Sharpe Ratio</p>
              <p className="text-3xl font-bold text-gray-900">
                {recentBacktests.length > 0 
                  ? (recentBacktests.reduce((sum, bt) => sum + (typeof bt.sharpe_ratio === 'number' ? bt.sharpe_ratio : 0), 0) / recentBacktests.length).toFixed(2)
                  : '0.00'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Activity className="h-4 w-4 text-orange-500 mr-1" />
            <span>Risk-adjusted returns</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Portfolios */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Portfolios</h2>
              <p className="text-gray-500 text-sm">Manage your investment portfolios</p>
            </div>
            <a
              href="/portfolios"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl flex items-center hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </a>
          </div>
          
          {portfolios.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No portfolios yet</h3>
              <p className="text-gray-500 mb-6">Start building your investment strategy by creating your first portfolio</p>
              <a
                href="/portfolios"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create your first portfolio
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolios.slice(0, 5).map((portfolio) => (
                <div key={portfolio.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{portfolio.name}</h3>
                      <p className="text-sm text-gray-500">{portfolio.description || 'No description'}</p>
                    </div>
                  </div>
                  <a
                    href={`/portfolios/${portfolio.id}`}
                    className="text-gray-400 hover:text-blue-600 transition-colors group-hover:scale-110 transform duration-300"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Backtests */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Backtests</h2>
              <p className="text-gray-500 text-sm">Test your trading strategies</p>
            </div>
            <a
              href="/backtest"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl flex items-center hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Run Backtest
            </a>
          </div>
          
          {recentBacktests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No backtests yet</h3>
              <p className="text-gray-500 mb-6">Test your trading strategies with historical data to optimize performance</p>
              <a
                href="/backtest"
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Run your first backtest
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBacktests.map((backtest) => (
                <div key={backtest.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      backtest.total_return >= 0 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}>
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{backtest.symbol}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(backtest.start_date).toLocaleDateString()} - {new Date(backtest.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${backtest.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(backtest.total_return || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Sharpe: {typeof backtest.sharpe_ratio === 'number' ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Get started with these essential features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/portfolios"
            className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Manage Portfolios</h3>
            <p className="text-gray-500 text-sm">Create and manage your investment portfolios with real-time tracking</p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Get started <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          <a
            href="/backtest"
            className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Run Backtest</h3>
            <p className="text-gray-500 text-sm">Test your trading strategies with historical data and optimize performance</p>
            <div className="mt-4 flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
              Start testing <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          <a
            href="/trading"
            className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Paper Trading</h3>
            <p className="text-gray-500 text-sm">Practice trading with paper money and real market conditions</p>
            <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700">
              Start trading <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </div>

      {/* Integration Test Section */}
      <div className="mt-8">
        <IntegrationTest />
      </div>
    </div>
  )
}

export default Dashboard
