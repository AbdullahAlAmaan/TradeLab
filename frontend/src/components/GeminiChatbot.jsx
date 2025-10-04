import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Settings, 
  User, 
  Bot,
  Sparkles
} from 'lucide-react'

const GeminiChatbot = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm your AI portfolio assistant powered by Google Gemini. I can help you analyze your investments, trading strategies, and provide market insights.\n\n**What I can help with:**\n• Portfolio analysis and optimization\n• Risk assessment and diversification\n• Market trends and trading strategies\n• Investment research and recommendations",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('unknown')
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Test Gemini connection on mount
  useEffect(() => {
    testGeminiConnection()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const testGeminiConnection = async () => {
    try {
      setConnectionStatus('testing')
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://tradelab-production.up.railway.app'
      const response = await fetch(`${API_BASE_URL}/api/v1/gemini/health`)
      const data = await response.json()
      
      if (data.status === 'healthy') {
        setConnectionStatus('connected')
        console.log('✅ Gemini API connected:', data.model)
      } else {
        setConnectionStatus('error')
        console.error('❌ Gemini API error:', data.error)
      }
    } catch (error) {
      setConnectionStatus('error')
      console.error('❌ Failed to connect to Gemini API:', error)
    }
  }

  const provideBasicPortfolioAnalysis = async (userMessage) => {
    // Provide basic analysis when Gemini is not available
    const basicResponses = {
      'portfolio': "I can see you're asking about your portfolio. While I can't access Gemini AI right now, here are some general portfolio tips:\n\n• Diversify across different asset classes\n• Regularly rebalance your holdings\n• Consider your risk tolerance\n• Monitor performance vs benchmarks\n\nTo get AI-powered analysis, please ensure the Gemini API key is configured.",
      'risk': "Risk management is crucial for successful investing:\n\n• Never risk more than you can afford to lose\n• Use stop-loss orders for protection\n• Diversify to reduce concentration risk\n• Regularly review and adjust your strategy\n\nFor detailed risk analysis, I'd need access to Gemini AI.",
      'trading': "Here are some trading fundamentals:\n\n• Have a clear strategy and stick to it\n• Manage your emotions and avoid FOMO\n• Use proper position sizing\n• Keep detailed records of your trades\n• Continuously learn and adapt\n\nFor personalized trading insights, Gemini AI would be helpful.",
      'default': "I'd love to help with your financial questions! While I can't access Gemini AI right now, here are some general principles:\n\n• Always do your own research\n• Never invest more than you can afford to lose\n• Consider your time horizon and risk tolerance\n• Stay informed about market conditions\n\nTo get AI-powered insights, please ensure the Gemini API is properly configured."
    }

    const message = userMessage.toLowerCase()
    let response = basicResponses.default
    
    if (message.includes('portfolio')) response = basicResponses.portfolio
    else if (message.includes('risk')) response = basicResponses.risk
    else if (message.includes('trading') || message.includes('trade')) response = basicResponses.trading

    return response
  }

  const fetchSmartContext = async () => {
    try {
      // Fetch portfolio data for context
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://tradelab-production.up.railway.app'
      const portfolioResponse = await fetch(`${API_BASE_URL}/api/v1/assets/portfolios`)
      if (portfolioResponse.ok) {
        const portfolios = await portfolioResponse.json()
        return { portfolios }
      }
    } catch (error) {
      console.log('Could not fetch portfolio context:', error)
    }
    return {}
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Try Gemini API first
      if (connectionStatus === 'connected') {
        const context = await fetchSmartContext()
        
        const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://tradelab-production.up.railway.app'
        const response = await fetch(`${API_BASE_URL}/api/v1/gemini/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: inputMessage,
            context: context,
            stream: false
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: data.response,
            timestamp: new Date()
          }
          
          setMessages(prev => [...prev, assistantMessage])
          return
        }
      }

      // Fallback to basic analysis
      const basicResponse = await provideBasicPortfolioAnalysis(inputMessage)
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: basicResponse,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or check if the Gemini API is properly configured.",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'testing': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Gemini AI Connected'
      case 'testing': return 'Testing Connection...'
      case 'error': return 'Gemini AI Unavailable'
      default: return 'Unknown Status'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 z-50"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    )
  }

  if (showSettings) {
    return (
      <SettingsPanel
        onClose={() => setShowSettings(false)}
        connectionStatus={connectionStatus}
        onTestConnection={() => testGeminiConnection()}
      />
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor().replace('text-', 'bg-')}`}></div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onToggle}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className={`text-xs ${getConnectionStatusColor()}`}>
          {getConnectionStatusText()}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-3 w-3" />
                ) : (
                  <Bot className="h-3 w-3" />
                )}
              </div>
              <div className={`rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center">
                <Bot className="h-3 w-3" />
              </div>
              <div className="rounded-lg p-3 bg-gray-100 text-gray-800">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 rounded-b-2xl">
        <div className="flex space-x-2">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your portfolio or trading..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Settings Panel Component
const SettingsPanel = ({ onClose, connectionStatus, onTestConnection }) => {
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <h3 className="font-semibold">AI Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Gemini AI Configuration</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Status
              </label>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'testing' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'testing' ? 'Testing...' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Information
              </label>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Powered by Google Gemini AI</p>
                <p>• Free tier: 15 requests/minute</p>
                <p>• Configured via environment variables</p>
              </div>
            </div>

            <button
              onClick={onTestConnection}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>✅ Portfolio analysis and optimization</p>
            <p>✅ Risk assessment and diversification</p>
            <p>✅ Market trends and trading strategies</p>
            <p>✅ Investment research and recommendations</p>
            <p>✅ Real-time market data integration</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Setup Instructions</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. Get a free Gemini API key from Google AI Studio</p>
            <p>2. Add GEMINI_API_KEY to your environment variables</p>
            <p>3. Deploy your backend with the API key</p>
            <p>4. The AI assistant will automatically connect</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close Settings
        </button>
      </div>
    </div>
  )
}

export default GeminiChatbot
