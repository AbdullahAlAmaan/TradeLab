import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Home, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Wallet, 
  Settings, 
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react'
import { useState } from 'react'

const Layout = ({ children }) => {
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Portfolios', href: '/portfolios', icon: BarChart3 },
    { name: 'Market Data', href: '/market-data', icon: Globe },
    { name: 'Backtest', href: '/backtest', icon: TrendingUp },
    { name: 'Risk Analysis', href: '/risk', icon: Shield },
    { name: 'Paper Trading', href: '/trading', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className={`min-h-screen ${theme.mode === 'dark' 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
      : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col backdrop-blur-lg border-r ${
          theme.mode === 'dark' 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/50'
        }`}>
          <div className="flex h-16 items-center justify-between px-4 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <h1 className="text-xl font-bold text-white">TradeLab</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                  {item.name}
                </a>
              )
            })}
          </nav>
          <div className="border-t p-4 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Premium User</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex flex-col flex-grow backdrop-blur-lg border-r shadow-xl ${
          theme.mode === 'dark' 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/50'
        }`}>
          <div className="flex h-16 items-center px-4 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <h1 className="text-xl font-bold text-white">TradeLab</h1>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : theme.mode === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                  {item.name}
                </a>
              )
            })}
          </nav>
          <div className="border-t p-4 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Premium User</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-start px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex h-16 items-center justify-between px-4 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TradeLab</h1>
          </div>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
