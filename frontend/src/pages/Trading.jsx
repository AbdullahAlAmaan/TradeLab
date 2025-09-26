import React, { useState, useEffect } from 'react'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { tradeAPI, dataAPI } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Trading = () => {
  const [activeTab, setActiveTab] = useState('trade')
  const [orderForm, setOrderForm] = useState({
    symbol: 'AAPL',
    asset_type: 'stock',
    side: 'buy',
    quantity: 1,
    order_type: 'market',
    price: 0,
    broker: 'alpaca'
  })
  const [positions, setPositions] = useState([])
  const [orders, setOrders] = useState([])
  const [priceData, setPriceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [currentPrice, setCurrentPrice] = useState(null)

  useEffect(() => {
    loadPositions()
    loadOrders()
    fetchCurrentPrice()
  }, [])

  const loadPositions = async () => {
    try {
      const response = await tradeAPI.getPositions()
      setPositions(response.data || [])
    } catch (error) {
      console.error('Error loading positions:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await tradeAPI.getOrders()
      setOrders(response.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const fetchCurrentPrice = async () => {
    try {
      const response = await dataAPI.fetchData({
        symbol: orderForm.symbol,
        asset_type: orderForm.asset_type,
        days: 1
      })
      if (response.data && response.data.data_preview) {
        setCurrentPrice(response.data.data_preview.last_price)
        setOrderForm(prev => ({ ...prev, price: response.data.data_preview.last_price }))
      }
    } catch (error) {
      console.error('Error fetching current price:', error)
    }
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // For now, we need a portfolio_id. Let's create a default one or get the first one
      const portfoliosResponse = await portfolioAPI.getPortfolios()
      const portfolioId = portfoliosResponse.data && portfoliosResponse.data.length > 0 
        ? portfoliosResponse.data[0].id 
        : null

      if (!portfolioId) {
        setError('Please create a portfolio first')
        return
      }

      const orderData = {
        portfolio_id: portfolioId,
        symbol: orderForm.symbol,
        asset_type: orderForm.asset_type,
        side: orderForm.side,
        quantity: orderForm.quantity,
        broker: orderForm.broker
      }
      
      const response = await tradeAPI.placeOrder(orderData)
      setSuccess('Order placed successfully!')
      setOrderForm({
        symbol: 'AAPL',
        asset_type: 'stock',
        side: 'buy',
        quantity: 1,
        order_type: 'market',
        price: 0,
        broker: 'alpaca'
      })
      
      // Refresh data
      loadPositions()
      loadOrders()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleSymbolChange = (symbol) => {
    setOrderForm(prev => ({ ...prev, symbol: symbol.toUpperCase() }))
    fetchCurrentPrice()
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

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'filled': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'filled': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const calculateTotalValue = () => {
    if (!positions.positions) return 0
    return positions.positions.reduce((total, position) => {
      return total + (position.quantity * position.average_price)
    }, 0)
  }

  const calculateTotalPnL = async () => {
    if (!positions.positions) return 0
    
    try {
      let totalPnL = 0
      for (const position of positions.positions) {
        // Fetch current price for each position
        const response = await dataAPI.fetchData({
          symbol: position.symbol,
          asset_type: position.asset_type,
          days: 1
        })
        
        if (response.data && response.data.data_preview) {
          const currentPrice = response.data.data_preview.last_price
          const pnl = (currentPrice - position.average_price) * position.quantity
          totalPnL += pnl
        }
      }
      return totalPnL
    } catch (error) {
      console.error('Error calculating P&L:', error)
      return 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Paper Trading
                </h1>
                <p className="text-gray-600">Practice trading with virtual money</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  loadPositions()
                  loadOrders()
                  fetchCurrentPrice()
                }}
                className="bg-white/80 backdrop-blur-lg px-4 py-2 rounded-xl border border-gray-200/50 hover:bg-white transition-colors flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/80 backdrop-blur-lg rounded-xl p-1 border border-gray-200/50">
            {[
              { id: 'trade', label: 'Place Order', icon: TrendingUp },
              { id: 'positions', label: 'Positions', icon: BarChart3 },
              { id: 'orders', label: 'Order History', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Value</div>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(calculateTotalValue())}
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total P&L</div>
              {calculateTotalPnL() >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className={`text-2xl font-bold ${calculateTotalPnL() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(calculateTotalPnL())}
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Positions</div>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {positions.length}
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Open Orders</div>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                Place Order
              </h2>
              
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                    <input
                      type="text"
                      value={orderForm.symbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., AAPL, TSLA, BTC"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
                    <select
                      value={orderForm.asset_type}
                      onChange={(e) => setOrderForm({...orderForm, asset_type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Side</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setOrderForm({...orderForm, side: 'buy'})}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                          orderForm.side === 'buy'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderForm({...orderForm, side: 'sell'})}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                          orderForm.side === 'sell'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Broker</label>
                    <select
                      value={orderForm.broker}
                      onChange={(e) => setOrderForm({...orderForm, broker: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="alpaca">Alpaca (Stocks)</option>
                      <option value="binance">Binance (Crypto)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({...orderForm, quantity: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0.0001"
                      step="0.0001"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <select
                      value={orderForm.order_type}
                      onChange={(e) => setOrderForm({...orderForm, order_type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="market">Market</option>
                      <option value="limit">Limit</option>
                    </select>
                  </div>
                </div>

                {orderForm.order_type === 'limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limit Price</label>
                    <input
                      type="number"
                      value={orderForm.price}
                      onChange={(e) => setOrderForm({...orderForm, price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {currentPrice && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600">Current Price</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(currentPrice)}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Place Order
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

              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {success}
                </div>
              )}
            </div>

            {/* Price Chart */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Price Chart
              </h2>
              <div className="h-64">
                {priceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Price']}
                        labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Select a symbol to view price chart</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Current Positions
            </h2>
            
            {!positions.positions || positions.positions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No positions yet</p>
                <p className="text-gray-400 text-sm">Place your first order to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Symbol</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Current Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">P&L</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.positions.map((position, index) => {
                      const currentPrice = position.average_price * 1.05 // Mock 5% gain
                      const pnl = (currentPrice - position.average_price) * position.quantity
                      const pnlPercent = ((currentPrice - position.average_price) / position.average_price) * 100
                      
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{position.symbol}</td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{position.asset_type}</td>
                          <td className="py-3 px-4 text-gray-900">{position.quantity}</td>
                          <td className="py-3 px-4 text-gray-900">{formatCurrency(position.average_price)}</td>
                          <td className="py-3 px-4 text-gray-900">{formatCurrency(currentPrice)}</td>
                          <td className={`py-3 px-4 font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            {formatCurrency(position.quantity * currentPrice)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Order History
            </h2>
            
            {!orders || orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No orders yet</p>
                <p className="text-gray-400 text-sm">Place your first order to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        order.side === 'buy' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {order.side === 'buy' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{order.symbol}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {order.side} {order.quantity} shares @ {formatCurrency(order.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Trading
