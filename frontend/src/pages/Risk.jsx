import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { riskAPI, portfolioAPI } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const Risk = () => {
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [riskMetrics, setRiskMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPortfolios()
  }, [])

  const loadPortfolios = async () => {
    try {
      const response = await portfolioAPI.getPortfolios()
      setPortfolios(response.data || [])
      if (response.data && response.data.length > 0) {
        setSelectedPortfolio(response.data[0])
        calculateRiskMetrics(response.data[0].id)
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
    }
  }

  const calculateRiskMetrics = async (portfolioId) => {
    setLoading(true)
    setError(null)
    try {
      console.log('Calculating risk metrics for portfolio:', portfolioId)
      const response = await riskAPI.calculateRisk({ portfolio_id: portfolioId })
      console.log('Risk metrics response:', response.data)
      setRiskMetrics(response.data)
    } catch (error) {
      console.error('Error calculating risk metrics:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to calculate risk metrics. Please ensure you have assets in your portfolio and price data is available.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }


  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const getRiskLevel = (value, type) => {
    // Convert string to number if needed
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    if (isNaN(numValue)) return { level: 'N/A', color: 'gray' }
    
    if (type === 'var' || type === 'cvar' || type === 'max_drawdown') {
      if (numValue < 0.05) return { level: 'Low', color: 'green' }
      if (numValue < 0.15) return { level: 'Medium', color: 'yellow' }
      return { level: 'High', color: 'red' }
    }
    if (type === 'sharpe' || type === 'sortino') {
      if (numValue > 1.5) return { level: 'Excellent', color: 'green' }
      if (numValue > 1.0) return { level: 'Good', color: 'blue' }
      if (numValue > 0.5) return { level: 'Fair', color: 'yellow' }
      return { level: 'Poor', color: 'red' }
    }
    return { level: 'N/A', color: 'gray' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Risk Analysis
                </h1>
                <p className="text-gray-600">Analyze portfolio risk and performance metrics</p>
              </div>
            </div>
            {portfolios.length > 0 && (
              <select
                value={selectedPortfolio?.id || ''}
                onChange={(e) => {
                  const portfolio = portfolios.find(p => p.id === parseInt(e.target.value))
                  setSelectedPortfolio(portfolio)
                  if (portfolio) calculateRiskMetrics(portfolio.id)
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                {portfolios.map(portfolio => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 border border-gray-200/50 shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculating Risk Metrics</h3>
            <p className="text-gray-600">This may take a few moments...</p>
          </div>
        ) : !selectedPortfolio ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 border border-gray-200/50 shadow-xl text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Portfolio Selected</h3>
            <p className="text-gray-600 mb-6">Select a portfolio to analyze its risk metrics</p>
            <button
              onClick={() => window.location.href = '/portfolios'}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-300"
            >
              Go to Portfolios
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Risk Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    riskMetrics ? `bg-${getRiskLevel(riskMetrics.var_95, 'var').color}-100 text-${getRiskLevel(riskMetrics.var_95, 'var').color}-800` : 'bg-gray-100 text-gray-800'
                  }`}>
                    {riskMetrics ? getRiskLevel(riskMetrics.var_95, 'var').level : 'N/A'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {riskMetrics ? formatPercent(riskMetrics.var_95) : '--'}
                </div>
                <div className="text-sm text-gray-600">Value at Risk (95%)</div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    riskMetrics ? `bg-${getRiskLevel(riskMetrics.cvar_95, 'cvar').color}-100 text-${getRiskLevel(riskMetrics.cvar_95, 'cvar').color}-800` : 'bg-gray-100 text-gray-800'
                  }`}>
                    {riskMetrics ? getRiskLevel(riskMetrics.cvar_95, 'cvar').level : 'N/A'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {riskMetrics ? formatPercent(riskMetrics.cvar_95) : '--'}
                </div>
                <div className="text-sm text-gray-600">Conditional VaR (95%)</div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    riskMetrics ? `bg-${getRiskLevel(riskMetrics.sharpe_ratio, 'sharpe').color}-100 text-${getRiskLevel(riskMetrics.sharpe_ratio, 'sharpe').color}-800` : 'bg-gray-100 text-gray-800'
                  }`}>
                    {riskMetrics ? getRiskLevel(riskMetrics.sharpe_ratio, 'sharpe').level : 'N/A'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {riskMetrics ? (typeof riskMetrics.sharpe_ratio === 'number' ? riskMetrics.sharpe_ratio.toFixed(2) : parseFloat(riskMetrics.sharpe_ratio || 0).toFixed(2)) : '--'}
                </div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    riskMetrics ? `bg-${getRiskLevel(riskMetrics.max_drawdown, 'max_drawdown').color}-100 text-${getRiskLevel(riskMetrics.max_drawdown, 'max_drawdown').color}-800` : 'bg-gray-100 text-gray-800'
                  }`}>
                    {riskMetrics ? getRiskLevel(riskMetrics.max_drawdown, 'max_drawdown').level : 'N/A'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {riskMetrics ? formatPercent(riskMetrics.max_drawdown) : '--'}
                </div>
                <div className="text-sm text-gray-600">Max Drawdown</div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sortino Ratio</span>
                    <span className="font-semibold text-gray-900">
                      {riskMetrics ? (typeof riskMetrics.sortino_ratio === 'number' ? riskMetrics.sortino_ratio.toFixed(2) : parseFloat(riskMetrics.sortino_ratio || 0).toFixed(2)) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Beta</span>
                    <span className="font-semibold text-gray-900">
                      {riskMetrics ? (typeof riskMetrics.beta === 'number' ? riskMetrics.beta.toFixed(2) : parseFloat(riskMetrics.beta || 0).toFixed(2)) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Volatility</span>
                    <span className="font-semibold text-gray-900">
                      {riskMetrics ? formatPercent(riskMetrics.volatility) : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {riskMetrics ? getRiskLevel(riskMetrics.var_95, 'var').level : 'N/A'}
                    </div>
                    <div className="text-gray-600">Overall Risk Level</div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        riskMetrics ? `bg-${getRiskLevel(riskMetrics.var_95, 'var').color}-500` : 'bg-gray-400'
                      }`}
                      style={{ 
                        width: riskMetrics ? `${Math.min(riskMetrics.var_95 * 1000, 100)}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    Based on Value at Risk analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Monte Carlo Simulation */}
            {riskMetrics?.monte_carlo_simulations && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  Monte Carlo Simulation (1000 paths)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskMetrics.monte_carlo_simulations[0]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Portfolio Value']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-gray-600 text-center">
                  Sample of 1000 possible portfolio value paths over 1 year
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Calculating risk metrics...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Risk
