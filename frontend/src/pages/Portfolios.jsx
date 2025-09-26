import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  PieChart,
  Activity
} from 'lucide-react'
import { portfolioAPI, assetAPI } from '../lib/api'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const Portfolios = () => {
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  const [newPortfolio, setNewPortfolio] = useState({ name: '', description: '' })
  const [newAsset, setNewAsset] = useState({ symbol: '', asset_type: 'stock', quantity: 0, purchase_price: 0 })

  useEffect(() => {
    loadPortfolios()
  }, [])

  useEffect(() => {
    if (selectedPortfolio) {
      loadAssets(selectedPortfolio.id)
    }
  }, [selectedPortfolio])

  useEffect(() => {
    if (assets.length > 0) {
      calculatePortfolioValue()
    } else {
      setPortfolioValue(0)
      setPortfolioChange(0)
    }
  }, [assets])

  const loadPortfolios = async () => {
    try {
      const response = await portfolioAPI.getPortfolios()
      setPortfolios(response.data || [])
      if (response.data && response.data.length > 0) {
        setSelectedPortfolio(response.data[0])
        loadAssets(response.data[0].id)
        // Calculate values for all portfolios
        calculateAllPortfolioValues(response.data)
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAllPortfolioValues = async (portfolios) => {
    const values = {}
    
    for (const portfolio of portfolios) {
      try {
        // Get assets for this portfolio
        const assetsResponse = await assetAPI.getAssets(portfolio.id)
        const portfolioAssets = assetsResponse.data || []
        
        if (portfolioAssets.length > 0) {
          let totalValue = 0
          let totalChange = 0
          
          for (const asset of portfolioAssets) {
            try {
              const response = await dataAPI.fetchData({
                symbol: asset.symbol,
                asset_type: asset.asset_type,
                days: 1
              })
              
              if (response.data && response.data.data_preview) {
                const currentPrice = response.data.data_preview.last_price
                const previousPrice = response.data.data_preview.previous_close || currentPrice
                const change = currentPrice - previousPrice
                
                totalValue += currentPrice
                totalChange += change
              }
            } catch (error) {
              console.error(`Error fetching data for ${asset.symbol}:`, error)
            }
          }
          
          values[portfolio.id] = { value: totalValue, change: totalChange }
        } else {
          values[portfolio.id] = { value: 0, change: 0 }
        }
      } catch (error) {
        console.error(`Error calculating value for portfolio ${portfolio.id}:`, error)
        values[portfolio.id] = { value: 0, change: 0 }
      }
    }
    
    setPortfolioValues(values)
  }

  const loadAssets = async (portfolioId) => {
    try {
      const response = await assetAPI.getAssets(portfolioId)
      setAssets(response.data || [])
    } catch (error) {
      console.error('Error loading assets:', error)
    }
  }

  const handleCreatePortfolio = async (e) => {
    e.preventDefault()
    try {
      await portfolioAPI.createPortfolio(newPortfolio)
      setNewPortfolio({ name: '', description: '' })
      setShowCreateModal(false)
      loadPortfolios()
    } catch (error) {
      console.error('Error creating portfolio:', error)
    }
  }

  const handleAddAsset = async (e) => {
    e.preventDefault()
    if (!selectedPortfolio) return
    
    try {
      console.log('Creating asset with data:', {
        symbol: newAsset.symbol,
        asset_type: newAsset.asset_type,
        name: newAsset.symbol,
        exchange: newAsset.asset_type === 'stock' ? 'NASDAQ' : 'BINANCE',
        portfolio_id: selectedPortfolio.id
      })
      
      const response = await assetAPI.createAsset({
        symbol: newAsset.symbol,
        asset_type: newAsset.asset_type,
        name: newAsset.symbol, // Use symbol as name for now
        exchange: newAsset.asset_type === 'stock' ? 'NASDAQ' : 'BINANCE',
        portfolio_id: selectedPortfolio.id
      })
      
      console.log('Asset created successfully:', response.data)
      setNewAsset({ symbol: '', asset_type: 'stock', quantity: 0, purchase_price: 0 })
      setShowAddAssetModal(false)
      loadAssets(selectedPortfolio.id)
    } catch (error) {
      console.error('Error adding asset:', error)
      console.error('Error response:', error.response?.data)
    }
  }

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return
    }
    
    try {
      await portfolioAPI.deletePortfolio(portfolioId)
      await loadPortfolios()
      
      // If we deleted the selected portfolio, select the first available one
      if (selectedPortfolio && selectedPortfolio.id === portfolioId) {
        const remainingPortfolios = portfolios.filter(p => p.id !== portfolioId)
        if (remainingPortfolios.length > 0) {
          setSelectedPortfolio(remainingPortfolios[0])
        } else {
          setSelectedPortfolio(null)
          setAssets([])
          setPortfolioValue(0)
          setPortfolioChange(0)
        }
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioChange, setPortfolioChange] = useState(0)
  const [portfolioValues, setPortfolioValues] = useState({})

  const calculatePortfolioValue = async () => {
    // Calculate real portfolio value by fetching current prices
    if (!selectedPortfolio || assets.length === 0) {
      setPortfolioValue(0)
      setPortfolioChange(0)
      return
    }
    
    try {
      let totalValue = 0
      let totalChange = 0
      
      for (const asset of assets) {
        // Fetch current price for each asset
        const response = await dataAPI.fetchData({
          symbol: asset.symbol,
          asset_type: asset.asset_type,
          days: 1
        })
        
        if (response.data && response.data.data_preview) {
          const currentPrice = response.data.data_preview.last_price
          const previousPrice = response.data.data_preview.previous_close || currentPrice
          const change = currentPrice - previousPrice
          
          // For now, assume 1 unit of each asset (in real app, you'd track quantities)
          totalValue += currentPrice
          totalChange += change
        }
      }
      
      setPortfolioValue(totalValue)
      setPortfolioChange(totalChange)
      
      // Update portfolio values for all portfolios
      setPortfolioValues(prev => ({
        ...prev,
        [selectedPortfolio.id]: { value: totalValue, change: totalChange }
      }))
    } catch (error) {
      console.error('Error calculating portfolio value:', error)
      setPortfolioValue(0)
      setPortfolioChange(0)
    }
  }


  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Portfolios
                </h1>
                <p className="text-gray-600">Manage your investment portfolios</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Portfolio
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio List */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Portfolios</h2>
              <div className="space-y-3">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      selectedPortfolio?.id === portfolio.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => {
                          setSelectedPortfolio(portfolio)
                          loadAssets(portfolio.id)
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <h3 className="font-semibold">{portfolio.name}</h3>
                        <p className={`text-sm ${selectedPortfolio?.id === portfolio.id ? 'text-blue-100' : 'text-gray-600'}`}>
                          {portfolio.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${selectedPortfolio?.id === portfolio.id ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(portfolioValues[portfolio.id]?.value || 0)}
                          </div>
                          <div className={`text-xs ${selectedPortfolio?.id === portfolio.id ? 'text-blue-100' : 'text-green-600'}`}>
                            +{formatCurrency(portfolioValues[portfolio.id]?.change || 0)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePortfolio(portfolio.id)
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            selectedPortfolio?.id === portfolio.id 
                              ? 'hover:bg-red-500/20 text-red-200 hover:text-red-100' 
                              : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                          }`}
                          title="Delete portfolio"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Details */}
          <div className="lg:col-span-2">
            {selectedPortfolio ? (
              <div className="space-y-6">
                {/* Portfolio Overview */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedPortfolio.name}</h2>
                      <p className="text-gray-600">{selectedPortfolio.description}</p>
                    </div>
                    <button
                      onClick={() => setShowAddAssetModal(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-300 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Asset
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-sm text-blue-600 font-medium">Total Value</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatCurrency(portfolioValue)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-sm text-green-600 font-medium">Total Gain</div>
                      <div className="text-2xl font-bold text-green-700">
                        +{formatCurrency(portfolioChange)}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="text-sm text-purple-600 font-medium">Assets</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {assets.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assets List */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets</h3>
                  {assets.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PieChart className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No assets in this portfolio yet</p>
                      <button
                        onClick={() => setShowAddAssetModal(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add your first asset
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assets.map((asset, index) => (
                        <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                              <span className="text-white font-bold text-sm">
                                {asset.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{asset.symbol}</h4>
                              <p className="text-sm text-gray-600 capitalize">{asset.asset_type}</p>
                              <p className="text-xs text-gray-500">{asset.exchange}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {asset.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              Added {new Date(asset.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 border border-gray-200/50 shadow-xl text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Portfolio Selected</h3>
                <p className="text-gray-600 mb-6">Select a portfolio to view its details and assets</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Create Your First Portfolio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Portfolio Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Portfolio</h3>
              <form onSubmit={handleCreatePortfolio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Name</label>
                  <input
                    type="text"
                    value={newPortfolio.name}
                    onChange={(e) => setNewPortfolio({...newPortfolio, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newPortfolio.description}
                    onChange={(e) => setNewPortfolio({...newPortfolio, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  >
                    Create Portfolio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Asset Modal */}
        {showAddAssetModal && selectedPortfolio && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Asset to {selectedPortfolio.name}</h3>
              <form onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., AAPL, BTC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
                  <select
                    value={newAsset.asset_type}
                    onChange={(e) => setNewAsset({...newAsset, asset_type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="stock">Stock</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={newAsset.quantity}
                      onChange={(e) => setNewAsset({...newAsset, quantity: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.0001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                    <input
                      type="number"
                      value={newAsset.purchase_price}
                      onChange={(e) => setNewAsset({...newAsset, purchase_price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAssetModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-300"
                  >
                    Add Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Portfolios
