import React, { useState } from 'react'
import { Search, BarChart3, RefreshCw } from 'lucide-react'
import CandlestickChart from '../components/CandlestickChart'
import AdvancedChart from '../components/AdvancedChart'
import { dataAPI } from '../lib/api'

const ChartDemo = () => {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [selectedChart, setSelectedChart] = useState('candlestick')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const chartTypes = [
    { id: 'candlestick', name: 'Professional', description: 'Real-time TradingView charts' },
    { id: 'advanced', name: 'Advanced', description: 'Technical indicators & analysis' }
  ]

  // Generate demo data for when API is unavailable
  const generateDemoData = (symbol, days = 30) => {
    const mock = []
    const basePrice = symbol === 'BTC' ? 50000 : symbol === 'ETH' ? 3000 : 150
    const volatility = symbol.includes('BTC') || symbol.includes('ETH') ? 0.05 : 0.02
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      
      const open = basePrice + (Math.random() - 0.5) * basePrice * volatility
      const close = open + (Math.random() - 0.5) * basePrice * volatility
      const high = Math.max(open, close) + Math.random() * basePrice * volatility * 0.5
      const low = Math.min(open, close) - Math.random() * basePrice * volatility * 0.5
      const volume = Math.floor(Math.random() * 10000000) + 1000000
      
      mock.push({
        timestamp: date.toISOString(),
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume
      })
    }
    
    return mock
  }

  // Fetch real data from API with fallback
  const fetchChartData = async (symbol) => {
    if (!symbol.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await dataAPI.fetchData({
        symbol: symbol.toUpperCase(),
        asset_type: 'stock',
        days: 30
      })
      
      if (response.data && response.data.data_preview) {
        // Fetch historical data for chart
        const historicalResponse = await dataAPI.getPriceData(symbol.toUpperCase(), 'stock', 30)
        if (historicalResponse.data && historicalResponse.data.prices) {
          setChartData(historicalResponse.data.prices)
        } else {
          // Fallback to demo data
          setChartData(generateDemoData(symbol.toUpperCase()))
          setError('Using demo data - API unavailable')
        }
      } else {
        // Fallback to demo data
        setChartData(generateDemoData(symbol.toUpperCase()))
        setError('Using demo data - API unavailable')
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
      // Fallback to demo data
      setChartData(generateDemoData(symbol.toUpperCase()))
      setError('Using demo data - API unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchSymbol.trim()) {
      fetchChartData(searchSymbol.trim())
    }
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      symbol: searchSymbol.toUpperCase(),
      height: 600,
      loading: loading,
      onRefresh: () => fetchChartData(searchSymbol)
    }

    switch (selectedChart) {
      case 'candlestick':
        return <CandlestickChart {...commonProps} />
      case 'advanced':
        return <AdvancedChart {...commonProps} />
      default:
        return <CandlestickChart {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chart Visualization
          </h1>
          <p className="text-gray-600">
            Search for any symbol to view professional charts
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value)}
                    placeholder="Enter symbol (e.g., AAPL, MSFT, BTC)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
              </form>
            </div>

            {/* Chart Type Selection */}
            <div className="flex gap-2">
              {chartTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedChart(type.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedChart === type.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchChartData(searchSymbol)}
              disabled={loading || !searchSymbol.trim()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Info Message */}
        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-blue-600 text-sm">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Chart Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {searchSymbol.trim() ? (
            <div>
              {/* Chart Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {searchSymbol.toUpperCase()} - {chartTypes.find(t => t.id === selectedChart)?.name} Chart
                    </h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    {chartData.length > 0 ? `${chartData.length} data points` : 'No data'}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-6">
                {renderChart()}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Search for a symbol to view charts
              </h3>
              <p className="text-gray-500">
                Enter any stock symbol or cryptocurrency ticker to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartDemo