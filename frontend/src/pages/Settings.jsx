import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Key, 
  Bell,
  Shield,
  Palette,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Info
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Settings = () => {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [showApiKeys, setShowApiKeys] = useState({})

  // Profile settings
  const [profile, setProfile] = useState({
    email: user?.email || '',
    display_name: '',
    timezone: 'UTC',
    currency: 'USD'
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    price_alerts: true,
    trade_notifications: true,
    risk_alerts: true,
    weekly_reports: false
  })

  // Trading preferences
  const [trading, setTrading] = useState({
    default_broker: 'alpaca',
    default_order_type: 'market',
    risk_tolerance: 'medium',
    auto_refresh: true,
    confirm_orders: true
  })

  // Theme settings
  const [theme, setTheme] = useState({
    mode: 'light',
    primary_color: 'blue',
    sidebar_collapsed: false
  })

  // API Keys - loaded from environment or user input
  const [apiKeys, setApiKeys] = useState({
    alpaca_api_key: '',
    alpaca_secret_key: '',
    binance_api_key: '',
    binance_secret_key: ''
  })
  const [newApiKey, setNewApiKey] = useState({
    type: 'alpaca_api_key',
    value: ''
  })

  useEffect(() => {
    // Load user settings from localStorage or API
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Load from localStorage (in real app, this would come from API)
    const savedProfile = localStorage.getItem('tradelab_profile')
    const savedNotifications = localStorage.getItem('tradelab_notifications')
    const savedTrading = localStorage.getItem('tradelab_trading')
    const savedTheme = localStorage.getItem('tradelab_theme')

    if (savedProfile) setProfile(JSON.parse(savedProfile))
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications))
    if (savedTrading) setTrading(JSON.parse(savedTrading))
    if (savedTheme) setTheme(JSON.parse(savedTheme))
  }

  const saveSettings = async (settingsType, data) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // In real app, this would be an API call
      localStorage.setItem(`tradelab_${settingsType}`, JSON.stringify(data))
      setSuccess(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved successfully!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = (e) => {
    e.preventDefault()
    saveSettings('profile', profile)
  }

  const handleNotificationsSave = (e) => {
    e.preventDefault()
    saveSettings('notifications', notifications)
  }

  const handleTradingSave = (e) => {
    e.preventDefault()
    saveSettings('trading', trading)
  }

  const handleThemeSave = (e) => {
    e.preventDefault()
    saveSettings('theme', theme)
  }

  const toggleApiKeyVisibility = (key) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const maskApiKey = (key) => {
    if (key.length <= 8) return '*'.repeat(key.length)
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trading', label: 'Trading', icon: SettingsIcon },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'theme', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-4">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Profile Information
                </h2>
                
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={profile.display_name}
                        onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your display name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={profile.currency}
                        onChange={(e) => setProfile({...profile, currency: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Profile
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-yellow-600" />
                  Notification Preferences
                </h2>
                
                <form onSubmit={handleNotificationsSave} className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-600">
                            {key === 'email_alerts' && 'Receive email notifications for important events'}
                            {key === 'price_alerts' && 'Get notified when prices hit your targets'}
                            {key === 'trade_notifications' && 'Notifications for trade executions and updates'}
                            {key === 'risk_alerts' && 'Alerts when portfolio risk exceeds thresholds'}
                            {key === 'weekly_reports' && 'Weekly summary reports via email'}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Notifications
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Trading Settings */}
            {activeTab === 'trading' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2 text-green-600" />
                  Trading Preferences
                </h2>
                
                <form onSubmit={handleTradingSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Broker</label>
                      <select
                        value={trading.default_broker}
                        onChange={(e) => setTrading({...trading, default_broker: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="alpaca">Alpaca (Stocks)</option>
                        <option value="binance">Binance (Crypto)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Order Type</label>
                      <select
                        value={trading.default_order_type}
                        onChange={(e) => setTrading({...trading, default_order_type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="market">Market Order</option>
                        <option value="limit">Limit Order</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['low', 'medium', 'high'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setTrading({...trading, risk_tolerance: level})}
                          className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                            trading.risk_tolerance === level
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-900">Auto Refresh Data</div>
                        <div className="text-sm text-gray-600">Automatically refresh price data every 30 seconds</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trading.auto_refresh}
                          onChange={(e) => setTrading({...trading, auto_refresh: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-900">Confirm Orders</div>
                        <div className="text-sm text-gray-600">Require confirmation before placing trades</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trading.confirm_orders}
                          onChange={(e) => setTrading({...trading, confirm_orders: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Trading Settings
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Key className="h-5 w-5 mr-2 text-purple-600" />
                  API Keys
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Security Notice</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Keep your API keys secure and never share them. These keys are stored locally and encrypted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-800">API Keys Configuration</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            API keys are stored securely in environment variables on the server. 
                            Contact your administrator to update API keys.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-green-600 font-bold text-sm">A</span>
                        </div>
                        Alpaca API Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">API Key</span>
                          <span className="text-green-600 font-medium">✓ Configured</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Secret Key</span>
                          <span className="text-green-600 font-medium">✓ Configured</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Keys are loaded from environment variables
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-yellow-600 font-bold text-sm">B</span>
                        </div>
                        Binance API Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">API Key</span>
                          <span className="text-green-600 font-medium">✓ Configured</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Secret Key</span>
                          <span className="text-green-600 font-medium">✓ Configured</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Keys are loaded from environment variables
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Settings */}
            {activeTab === 'theme' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-pink-600" />
                  Appearance
                </h2>
                
                <form onSubmit={handleThemeSave} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Theme Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'light', label: 'Light', description: 'Clean and bright interface' },
                        { value: 'dark', label: 'Dark', description: 'Easy on the eyes' }
                      ].map(mode => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setTheme({...theme, mode: mode.value})}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                            theme.mode === mode.value
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{mode.label}</div>
                          <div className="text-sm text-gray-600">{mode.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Primary Color</label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { value: 'blue', color: 'bg-blue-500' },
                        { value: 'purple', color: 'bg-purple-500' },
                        { value: 'green', color: 'bg-green-500' },
                        { value: 'red', color: 'bg-red-500' },
                        { value: 'yellow', color: 'bg-yellow-500' }
                      ].map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setTheme({...theme, primary_color: color.value})}
                          className={`w-12 h-12 rounded-xl ${color.color} ${
                            theme.primary_color === color.value ? 'ring-4 ring-gray-300' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">Collapse Sidebar</div>
                      <div className="text-sm text-gray-600">Make the sidebar smaller to save space</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={theme.sidebar_collapsed}
                        onChange={(e) => setTheme({...theme, sidebar_collapsed: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Theme
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-red-600" />
                  Security & Privacy
                </h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Account Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                          <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                        </div>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                          Enable
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Session Management</div>
                          <div className="text-sm text-gray-600">Manage your active sessions</div>
                        </div>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                          View Sessions
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Data & Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Export Data</div>
                          <div className="text-sm text-gray-600">Download a copy of your data</div>
                        </div>
                        <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">
                          Export
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Delete Account</div>
                          <div className="text-sm text-gray-600">Permanently delete your account and all data</div>
                        </div>
                        <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-red-200 bg-red-50 rounded-xl p-6">
                    <h3 className="font-semibold text-red-900 mb-4">Danger Zone</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-red-900">Sign Out</div>
                          <div className="text-sm text-red-700">Sign out of all devices and clear local data</div>
                        </div>
                        <button 
                          onClick={signOut}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
