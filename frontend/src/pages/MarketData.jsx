import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  BarChart3,
  DollarSign,
  Activity,
  Globe,
  Zap
} from 'lucide-react'
import { dataAPI } from '../lib/api'

const MarketData = () => {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [priceData, setPriceData] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSymbols, setFilteredSymbols] = useState([])

  // Popular symbols for quick access
  const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'NKE', 'DIS', 'WMT', 'JPM', 'V', 'MA']
  const popularCrypto = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'LTC', 'BCH', 'XRP', 'DOGE', 'SHIB', 'ATOM', 'FTM', 'ALGO', 'VET', 'ICP', 'FIL']
  
  // All symbols for search suggestions
  const allSymbols = {
    stock: popularStocks,
    crypto: popularCrypto
  }

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentMarketSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const searchAsset = async () => {
    if (!searchSymbol.trim()) return
    
    setLoading(true)
    setError(null)
    setShowSuggestions(false)
    setFilteredSymbols([])
    
    try {
      const response = await dataAPI.fetchData({
        symbol: searchSymbol.toUpperCase(),
        asset_type: assetType,
        days: 30
      })
      
      if (response.data && response.data.data_preview) {
        const assetData = {
          symbol: searchSymbol.toUpperCase(),
          asset_type: assetType,
          data: response.data.data_preview,
          timestamp: new Date().toISOString()
        }
        
        setSearchResults([assetData])
        setSelectedAsset(assetData)
        setPriceData(response.data)
        
        // Add to recent searches
        const newRecent = [assetData, ...recentSearches.filter(item => 
          !(item.symbol === assetData.symbol && item.asset_type === assetData.asset_type)
        )].slice(0, 10)
        setRecentSearches(newRecent)
        localStorage.setItem('recentMarketSearches', JSON.stringify(newRecent))
      } else {
        setError('No data found for this symbol')
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
      setError('Failed to fetch market data')
    } finally {
      setLoading(false)
    }
  }

  const quickSearch = (symbol, type) => {
    setSearchSymbol(symbol)
    setAssetType(type)
    setSearchResults([])
    setSelectedAsset(null)
    setPriceData(null)
    setShowSuggestions(false)
  }

  const handleSymbolChange = (value) => {
    setSearchSymbol(value.toUpperCase())
    
    if (value.length > 0) {
      // Filter symbols based on current asset type and search input
      const symbols = allSymbols[assetType] || []
      const filtered = symbols.filter(symbol => 
        symbol.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSymbols(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setFilteredSymbols([])
    }
  }

  const handleAssetTypeChange = (type) => {
    setAssetType(type)
    setSearchSymbol('')
    setShowSuggestions(false)
    setFilteredSymbols([])
    setSearchResults([])
    setSelectedAsset(null)
    setPriceData(null)
  }

  const selectSuggestion = (symbol) => {
    setSearchSymbol(symbol)
    setShowSuggestions(false)
    setFilteredSymbols([])
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price)
  }

  const formatChange = (change, percent) => {
    const isPositive = change >= 0
    return (
      <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{formatPrice(change)} ({isPositive ? '+' : ''}{percent.toFixed(2)}%)
      </span>
    )
  }

  const getAssetIcon = (assetType) => {
    switch (assetType) {
      case 'crypto': return <Zap className="h-5 w-5 text-yellow-500" />
      case 'stock': return <BarChart3 className="h-5 w-5 text-blue-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Data</h1>
          <p className="text-gray-600">Real-time market data and price information</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchAsset()}
                  onFocus={() => searchSymbol.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`e.g., ${assetType === 'stock' ? 'AAPL, MSFT, TSLA' : 'BTC, ETH, ADA'}`}
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && filteredSymbols.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredSymbols.slice(0, 10).map((symbol, index) => (
                      <div
                        key={index}
                        onClick={() => selectSuggestion(symbol)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium text-gray-900">{symbol}</span>
                        <span className="text-xs text-gray-500 capitalize">{assetType}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => handleAssetTypeChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={searchAsset}
                disabled={loading || !searchSymbol.trim()}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Popular {assetType === 'stock' ? 'Stocks' : 'Cryptocurrencies'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(assetType === 'stock' ? popularStocks : popularCrypto).map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => quickSearch(symbol, assetType)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assetType === 'stock' 
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Show both types when no specific type is selected */}
            {!assetType && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Stocks</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularStocks.slice(0, 10).map(symbol => (
                      <button
                        key={symbol}
                        onClick={() => quickSearch(symbol, 'stock')}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Crypto</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularCrypto.slice(0, 10).map(symbol => (
                      <button
                        key={symbol}
                        onClick={() => quickSearch(symbol, 'crypto')}
                        className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Asset Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getAssetIcon(selectedAsset?.asset_type)}
                    <div className="ml-3">
                      <h3 className="text-xl font-bold text-gray-900">{selectedAsset?.symbol}</h3>
                      <p className="text-sm text-gray-600 capitalize">{selectedAsset?.asset_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(selectedAsset?.data?.last_price || 0)}
                    </div>
                    {formatChange(
                      (selectedAsset?.data?.last_price || 0) - (selectedAsset?.data?.previous_close || 0),
                      selectedAsset?.data?.change_percent || 0
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Close</span>
                    <span className="font-medium">{formatPrice(selectedAsset?.data?.previous_close || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume</span>
                    <span className="font-medium">
                      {selectedAsset?.data?.volume ? 
                        new Intl.NumberFormat().format(selectedAsset.data.volume) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Cap</span>
                    <span className="font-medium">
                      {selectedAsset?.data?.market_cap ? 
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          notation: 'compact'
                        }).format(selectedAsset.data.market_cap) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium text-sm">
                      {selectedAsset?.timestamp ? 
                        new Date(selectedAsset.timestamp).toLocaleTimeString() : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart Placeholder */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Chart</h3>
                <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-400">Historical data available: {priceData?.data_points?.length || 0} points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !searchResults.length && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSearches.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSearchSymbol(item.symbol)
                    setAssetType(item.asset_type)
                    setSearchResults([item])
                    setSelectedAsset(item)
                  }}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getAssetIcon(item.asset_type)}
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{item.symbol}</div>
                        <div className="text-sm text-gray-600 capitalize">{item.asset_type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.data?.last_price || 0)}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!searchResults.length && !recentSearches.length && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Explore Market Data</h3>
            <p className="text-gray-600 mb-6">Search for stocks or cryptocurrencies to view real-time market data</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => quickSearch('AAPL', 'stock')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Try AAPL
              </button>
              <button
                onClick={() => quickSearch('BTC', 'crypto')}
                className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition-colors"
              >
                Try BTC
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketData
