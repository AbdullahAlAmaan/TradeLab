import React, { useState } from 'react'
import { 
  Play, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'
import { backtestAPI } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const Backtest = () => {
  const [formData, setFormData] = useState({
    symbol: 'AAPL',
    asset_type: 'stock',
    start_date: '',
    end_date: '',
    short_window: 10,
    long_window: 30,
    initial_capital: 10000
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [componentError, setComponentError] = useState(null)

  // Error boundary for component
  if (componentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{componentError}</p>
          <button
            onClick={() => setComponentError(null)}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Set default dates
  React.useEffect(() => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 3) // 3 months ago
      
      setFormData(prev => ({
        ...prev,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }))
    } catch (err) {
      console.error('Error setting default dates:', err)
      setComponentError('Failed to initialize form')
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('window') || name === 'initial_capital' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      console.log('Starting backtest with data:', formData)
      
      const backtestData = {
        symbol: formData.symbol,
        asset_type: formData.asset_type,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        short_window: formData.short_window,
        long_window: formData.long_window,
        initial_capital: formData.initial_capital
      }
      
      console.log('Sending backtest request:', backtestData)
      const response = await backtestAPI.runBacktest(backtestData)
      console.log('Backtest response:', response.data)
      setResults(response.data)
    } catch (err) {
      console.error('Backtest error:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to run backtest')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`
  }

  console.log('Backtest component rendering, formData:', formData, 'loading:', loading, 'error:', error, 'results:', results)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Backtest Engine
              </h1>
              <p className="text-gray-600">Test your trading strategies with historical data</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Backtest Form */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Strategy Parameters
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., AAPL, TSLA, BTC"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type
                  </label>
                  <select
                    name="asset_type"
                    value={formData.asset_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="stock">Stock</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Capital
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="initial_capital"
                      value={formData.initial_capital}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1000"
                      step="1000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short MA Window
                  </label>
                  <input
                    type="number"
                    name="short_window"
                    value={formData.short_window}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="1"
                    max="50"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Long MA Window
                  </label>
                  <input
                    type="number"
                    name="long_window"
                    value={formData.long_window}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="2"
                    max="200"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Run Backtest
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Backtest Results
            </h2>
            
            {!results ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Run a backtest to see results here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-sm text-green-600 font-medium">Total Return</div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatPercent(parseFloat(results.total_return))}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-sm text-blue-600 font-medium">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {results.sharpe_ratio ? parseFloat(results.sharpe_ratio).toFixed(2) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="text-sm text-red-600 font-medium">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-700">
                      {formatPercent(parseFloat(results.max_drawdown || 0))}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="text-sm text-purple-600 font-medium">Final Value</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(parseFloat(results.final_capital))}
                    </div>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                {results.equity_curve && results.equity_curve.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity Curve</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={results.equity_curve}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              try {
                                return new Date(value).toLocaleDateString()
                              } catch (e) {
                                return value
                              }
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              try {
                                return formatCurrency(value)
                              } catch (e) {
                                return value
                              }
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => {
                              try {
                                return [formatCurrency(value), 'Portfolio Value']
                              } catch (e) {
                                return [value, 'Portfolio Value']
                              }
                            }}
                            labelFormatter={(label) => {
                              try {
                                return new Date(label).toLocaleDateString()
                              } catch (e) {
                                return label
                              }
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="equity" 
                            stroke="#10b981" 
                            fill="#10b981" 
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Trade Summary */}
                {results.trades && results.trades.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Summary</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{results.trades.length}</div>
                          <div className="text-sm text-gray-600">Total Trades</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {results.trades.filter(t => t.pnl > 0).length}
                          </div>
                          <div className="text-sm text-gray-600">Winning Trades</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {results.trades.filter(t => t.pnl < 0).length}
                          </div>
                          <div className="text-sm text-gray-600">Losing Trades</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Backtest
