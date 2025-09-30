import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Settings, 
  User, 
  Bot,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  Brain,
  Wifi,
  WifiOff
} from 'lucide-react'

const OllamaChatbot = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "🎯 **Welcome to your Enhanced Portfolio AI Assistant!**\n\nI'm powered by **WizardLM2** running locally on your machine for complete privacy. Here's what I can do:\n\n📊 **Smart Portfolio Analysis** - I automatically detect when you ask about your investments and pull real-time data\n🔍 **Trading Strategy Insights** - Analyze your backtests and trading performance\n📈 **Market Intelligence** - Get personalized advice based on your actual holdings\n💡 **Financial Education** - Explain complex concepts in simple terms\n\n**Try asking:**\n• \"Analyze my portfolio diversification\"\n• \"How is my portfolio performing?\"\n• \"What's my biggest risk exposure?\"\n• \"Should I rebalance my holdings?\"\n\n*✨ I automatically include your portfolio data when relevant - no need for special commands!*",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ollamaSettings, setOllamaSettings] = useState({
    host: import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434',
    model: import.meta.env.VITE_OLLAMA_MODEL || 'wizardlm2:latest'
  })
  const [connectionStatus, setConnectionStatus] = useState('unknown') // unknown, connected, disconnected
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ollama-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setOllamaSettings(parsed)
      } catch (error) {
        console.error('Failed to parse saved Ollama settings:', error)
      }
    }
    
    // Test connection on mount
    testOllamaConnection()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const saveSettings = (newSettings) => {
    setOllamaSettings(newSettings)
    localStorage.setItem('ollama-settings', JSON.stringify(newSettings))
    testOllamaConnection(newSettings)
  }

  const testOllamaConnection = async (settings = ollamaSettings) => {
    try {
      const response = await fetch(`${settings.host}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        setConnectionStatus('connected')
        return true
      } else {
        setConnectionStatus('disconnected')
        return false
      }
    } catch (error) {
      console.error('Ollama connection test failed:', error)
      setConnectionStatus('disconnected')
      return false
    }
  }

  const fetchSmartContext = async (userQuery, includeAllContext = false) => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        console.warn('No auth token available for smart context fetch')
        return { enhanced_prompt: userQuery, context_used: false }
      }

      const apiUrl = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${apiUrl}/api/v1/ai/smart-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_query: userQuery,
          include_all_context: includeAllContext
        }),
        signal: AbortSignal.timeout(10000) // Longer timeout for comprehensive data
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Smart context enhanced query with:', data.context_types_used)
        return {
          enhanced_prompt: data.enhanced_prompt,
          context_used: data.context_types_used.length > 0,
          context_types: data.context_types_used,
          suggestions: data.suggestions
        }
      } else {
        console.error('Failed to fetch smart context:', response.status)
        return { enhanced_prompt: userQuery, context_used: false }
      }
    } catch (error) {
      console.error('Error fetching smart context:', error)
      return { enhanced_prompt: userQuery, context_used: false }
    }
  }

  // Legacy function for backward compatibility
  const fetchContextData = async (contextType) => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        console.warn('No auth token available for context fetch')
        return null
      }

      const apiUrl = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${apiUrl}/api/v1/ai/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          context_type: contextType
        }),
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        console.error('Failed to fetch context data:', response.status)
        return null
      }
    } catch (error) {
      console.error('Error fetching context data:', error)
      return null
    }
  }

  const sendMessage = async (forceFullContext = false) => {
    if (!inputMessage.trim() || isLoading) return

    // Test connection first
    const isConnected = await testOllamaConnection()
    if (!isConnected) {
      const errorMessage = {
        id: Date.now(),
        type: 'system',
        content: "⚠️ Ollama not detected. Please install and run Ollama to use the chatbot.\n\nTo get started:\n1. Install Ollama from https://ollama.ai\n2. Run 'ollama pull wizardlm2' to download WizardLM2\n3. Make sure Ollama is running on " + ollamaSettings.host,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    // Add user message first
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const originalMessage = inputMessage
    setInputMessage('')
    setIsLoading(true)

    // Add loading message with context detection
    const loadingMessageId = Date.now() + 1
    setMessages(prev => [...prev, { 
      id: loadingMessageId, 
      type: 'assistant', 
      content: '🧠 Analyzing your question and gathering relevant portfolio data...', 
      timestamp: new Date() 
    }])

    try {
      // Use smart context to enhance the prompt
      const contextResult = await fetchSmartContext(originalMessage, forceFullContext)
      
      // Update loading message to show what context was used
      if (contextResult.context_used) {
        const contextInfo = `📊 Found relevant data: ${contextResult.context_types.join(', ')}\n\n💭 Processing with WizardLM2...`
        setMessages(prev =>
          prev.map(msg =>
            msg.id === loadingMessageId ? { ...msg, content: contextInfo } : msg
          )
        )
      } else {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === loadingMessageId ? { ...msg, content: '💭 Processing with WizardLM2...' } : msg
          )
        )
      }

      // Small delay to show the context loading
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Replace loading message with actual streaming response
      const assistantMessageId = Date.now() + 2
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId))
      setMessages(prev => [...prev, { 
        id: assistantMessageId, 
        type: 'assistant', 
        content: '', 
        timestamp: new Date(),
        contextUsed: contextResult.context_used,
        contextTypes: contextResult.context_types || [],
        isStreaming: true
      }])

      // Stream response from Ollama with enhanced prompt
      abortControllerRef.current = new AbortController()
      const response = await fetch(`${ollamaSettings.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaSettings.model,
          prompt: contextResult.enhanced_prompt,
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 2048
          }
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.trim() === '') continue
          try {
            const data = JSON.parse(line)
            if (data.response) {
              fullContent += data.response
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                )
              )
            }
            if (data.done && contextResult.suggestions && contextResult.suggestions.length > 0) {
              // Mark streaming as complete and add suggested follow-up questions
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ))
              
              setTimeout(() => {
                const suggestionMessage = {
                  id: Date.now() + 3,
                  type: 'system',
                  content: `💡 **Follow-up suggestions:**\n${contextResult.suggestions.slice(0, 3).map(s => `• ${s}`).join('\n')}\n\n*Tip: I automatically analyze your portfolio data when relevant. Try asking about specific assets or performance metrics!*`,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, suggestionMessage])
              }, 1000)
            }
          } catch (parseError) {
            console.error('Error parsing JSON from stream:', parseError, 'Line:', line)
          }
        }
      }

      // Ensure streaming is marked as complete if not already
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ))

    } catch (error) {
      // Remove loading message on error
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId))
      
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error('Error with enhanced RAG system:', error)
        
        // Add error message
        const errorMessage = {
          id: Date.now() + 4,
          type: 'assistant',
          content: `I encountered an error while processing your question. Let me try to answer without additional context.\n\nError: ${error.message}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        
        // Fallback: try simple prompt without context
        try {
          const fallbackResponse = await fetch(`${ollamaSettings.host}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: ollamaSettings.model,
              prompt: `You are a helpful financial advisor. User question: ${originalMessage}`,
              stream: false
            })
          })
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            const fallbackMessage = {
              id: Date.now() + 5,
              type: 'assistant',
              content: fallbackData.response,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, fallbackMessage])
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const cancelMessage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else if (e.key === 'Enter' && e.shiftKey && e.ctrlKey) {
      e.preventDefault()
      sendMessage(true) // Force full context with Ctrl+Shift+Enter
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return `Connected to ${ollamaSettings.model}`
      case 'disconnected':
        return 'Ollama not running'
      default:
        return 'Checking connection...'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 z-50"
      >
        <Brain className="h-6 w-6" />
      </button>
    )
  }

  if (showSettings) {
    return (
      <SettingsPanel
        settings={ollamaSettings}
        onSave={saveSettings}
        onClose={() => setShowSettings(false)}
        connectionStatus={connectionStatus}
        onTestConnection={() => testOllamaConnection()}
      />
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Local AI Assistant</h3>
            <div className="flex items-center space-x-1 text-xs opacity-90">
              {getConnectionStatusIcon()}
              <span>{getConnectionStatusText()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={onToggle}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : message.type === 'system'
                  ? 'bg-orange-500 text-white'
                  : message.contextUsed
                  ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : message.type === 'system' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : message.contextUsed ? (
                  <Zap className="h-4 w-4" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
              </div>
              <div className={`rounded-2xl p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-orange-50 text-orange-800 border border-orange-200'
                  : message.contextUsed
                  ? 'bg-gradient-to-r from-green-50 to-blue-50 text-gray-800 border border-green-200'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {/* Context indicator */}
                {message.contextUsed && message.contextTypes && (
                  <div className="mb-2 flex items-center text-xs">
                    <Zap className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-green-700 font-medium">
                      📊 Enhanced with: {message.contextTypes.join(', ')} data
                    </span>
                  </div>
                )}
                
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.isStreaming && (
                  <div className="mt-2 flex items-center text-xs opacity-75">
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    Generating...
                  </div>
                )}
                
                <div className="mt-1 text-xs opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 rounded-b-2xl">
        {/* Smart Context Info */}
        <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-xs text-blue-700">
            <Zap className="w-3 h-3 mr-1" />
            <span className="font-medium">Smart RAG Active:</span>
            <span className="ml-1">I automatically analyze your portfolio data when relevant</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your portfolio, trading, or finance... (Shift+Enter for new line, Ctrl+Shift+Enter for full context)"
              className="w-full resize-none border border-gray-300 rounded-xl px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              rows="2"
              disabled={isLoading}
            />
            
            {/* Force Full Context Button */}
            <button
              onClick={() => sendMessage(true)}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-12 bottom-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg p-1.5 transition-colors"
              title="Force Full Context - Include all portfolio, backtest, trading, and market data"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            
            <div className="absolute bottom-2 right-2">
              <Zap className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-2 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
            {isLoading && (
              <button
                onClick={cancelMessage}
                className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Panel Component
const SettingsPanel = ({ settings, onSave, onClose, connectionStatus, onTestConnection }) => {
  const [localSettings, setLocalSettings] = useState(settings)
  const [availableModels, setAvailableModels] = useState([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const popularModels = [
    'wizardlm2:latest',
    'llama3',
    'llama3:8b',
    'llama3:70b',
    'mistral',
    'mistral:7b',
    'codellama',
    'phi3',
    'gemma',
    'qwen2',
    'llama2'
  ]

  useEffect(() => {
    fetchAvailableModels()
  }, [localSettings.host])

  const fetchAvailableModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch(`${localSettings.host}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to fetch available models:', error)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h3 className="font-semibold">Ollama Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {connectionStatus === 'connected' ? 'Connected to Ollama' : 'Ollama not detected'}
            </span>
          </div>
          <button
            onClick={onTestConnection}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Test Connection
          </button>
        </div>

        {/* Host Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ollama Host
          </label>
          <input
            type="text"
            value={localSettings.host}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, host: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="http://localhost:11434"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: http://localhost:11434
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          
          {/* Available Models */}
          {availableModels.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Available models on your system:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableModels.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => setLocalSettings(prev => ({ ...prev, model: model.name }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      localSettings.model === model.name
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-500">
                      Size: {Math.round(model.size / 1024 / 1024 / 1024 * 10) / 10}GB
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Model Input */}
            <input
              type="text"
              value={localSettings.model}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="wizardlm2:latest"
            />
          
          {/* Popular Models */}
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Popular models:</p>
            <div className="flex flex-wrap gap-2">
              {popularModels.map((model) => (
                <button
                  key={model}
                  onClick={() => setLocalSettings(prev => ({ ...prev, model }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    localSettings.model === model
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Installation Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Need help getting started?</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Install Ollama from <span className="font-mono">https://ollama.ai</span></li>
            <li>Run <span className="font-mono bg-blue-100 px-1 rounded">ollama pull llama3</span> to download a model</li>
            <li>Make sure Ollama is running (it starts automatically on most systems)</li>
            <li>Test the connection above</li>
          </ol>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default OllamaChatbot
