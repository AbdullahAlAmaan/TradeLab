import React, { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react'
import CandlestickChart from './CandlestickChart'
import AdvancedChart from './AdvancedChart'
import { dataAPI } from '../lib/api'

const ChartDemo = () => {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [symbol, setSymbol] = useState('AAPL')
  const [assetType, setAssetType] = useState('stock')

  const demoSymbols = [
    { symbol: 'AAPL', type: 'stock', name: 'Apple Inc.' },
    { symbol: 'TSLA', type: 'stock', name: 'Tesla Inc.' },
    { symbol: 'BTC', type: 'crypto', name: 'Bitcoin' },
    { symbol: 'ETH', type: 'crypto', name: 'Ethereum' }
  ]

  const fetchChartData = async (selectedSymbol, selectedType) => {
    setLoading(true)
    try {
      const response = await dataAPI.getPriceData(selectedSymbol, selectedType, 30)
      if (response.data && response.data.prices) {
        setChartData(response.data.prices)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Generate mock data for demo
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const mockData = []
    const basePrice = symbol === 'BTC' ? 50000 : 150
    const volatility = symbol === 'BTC' ? 0.05 : 0.02
    
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      
      const open = basePrice + (Math.random() - 0.5) * basePrice * volatility
      const close = open + (Math.random() - 0.5) * basePrice * volatility
      const high = Math.max(open, close) + Math.random() * basePrice * volatility * 0.5
      const low = Math.min(open, close) - Math.random() * basePrice * volatility * 0.5
      const volume = Math.floor(Math.random() * 10000000) + 1000000
      
      mockData.push({
        timestamp: date.toISOString(),
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume
      })
    }
    
    setChartData(mockData)
  }

  useEffect(() => {
    fetchChartData(symbol, assetType)
  }, [symbol, assetType])

  const handleSymbolChange = (newSymbol, newType) => {
    setSymbol(newSymbol)
    setAssetType(newType)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chart Visualization Demo</h2>
              <p className="text-sm text-gray-600">Professional candlestick charts with TradingView Lightweight Charts</p>
            </div>
          </div>
          
          <button
            onClick={() => fetchChartData(symbol, assetType)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Symbol Selector */}
        <div className="flex flex-wrap gap-2">
          {demoSymbols.map((item) => (
            <button
              key={`${item.symbol}-${item.type}`}
              onClick={() => handleSymbolChange(item.symbol, item.type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                symbol === item.symbol && assetType === item.type
                  ? 'bg-blue-500 text-white'
                  : item.type === 'crypto'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.symbol} - {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <CandlestickChart
          data={chartData}
          symbol={symbol}
          height={400}
          loading={loading}
          onRefresh={() => fetchChartData(symbol, assetType)}
        />
        
        <AdvancedChart
          data={chartData}
          symbol={symbol}
          height={500}
          loading={loading}
          onRefresh={() => fetchChartData(symbol, assetType)}
        />
      </div>

      {/* Features Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Chart Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Candlestick Chart</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Professional OHLC visualization</li>
              <li>• Real-time price updates</li>
              <li>• Interactive crosshair</li>
              <li>• Volume overlay</li>
              <li>• Price change indicators</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Advanced Chart</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Multiple timeframes</li>
              <li>• Simple Moving Average (SMA)</li>
              <li>• Volume histogram</li>
              <li>• Technical indicators</li>
              <li>• Customizable settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartDemo
