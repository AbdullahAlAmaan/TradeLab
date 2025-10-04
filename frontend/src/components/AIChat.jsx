import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  User, 
  Bot,
  Lightbulb,
  BarChart3
} from 'lucide-react'
import axios from 'axios'

const AIChat = ({ isOpen, onToggle, portfolioId = null, backtestId = null }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm your AI trading assistant. I can help you understand financial concepts, analyze your portfolios and backtests, generate trading strategies, and answer questions about your data. How can I help you today?",
      suggestions: [
        "Explain Sharpe ratio",
        "Analyze my portfolio risk",
        "Generate a trading strategy",
        "What are my recent backtests?"
      ]
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatMode, setChatMode] = useState('general') // general, explainer, portfolio_analyst
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('supabase.auth.token')
      
      const response = await axios.post('/api/v1/ai/chat', {
        message: inputMessage,
        context_type: chatMode,
        context_id: portfolioId || backtestId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions || [],
        context_used: response.data.context_used
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        suggestions: ["Try rephrasing your question", "Check the help documentation"]
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

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion)
  }

  const explainTerm = async (term) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('supabase.auth.token')
      
      const response = await axios.post(`/api/v1/ai/chat/explain/${encodeURIComponent(term)}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const assistantMessage = {
        id: Date.now(),
        type: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions || []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Explanation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const modeIcons = {
    general: MessageCircle,
    explainer: Lightbulb,
    portfolio_analyst: BarChart3
  }

  const ModeIcon = modeIcons[chatMode]

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Trading Assistant</h3>
            <p className="text-xs opacity-90">Always ready to help</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-white/80 hover:text-white transition-colors"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'general', icon: MessageCircle, label: 'Chat' },
            { id: 'explainer', icon: Lightbulb, label: 'Explain' },
            { id: 'portfolio_analyst', icon: BarChart3, label: 'Portfolio' }
          ].map(mode => {
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                onClick={() => setChatMode(mode.id)}
                className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all duration-200 ${
                  chatMode === mode.id
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="ml-1 text-xs font-medium hidden sm:inline">{mode.label}</span>
              </button>
            )
          })}
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
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              }`}>
                {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs opacity-75 font-medium">Suggestions:</p>
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 rounded-2xl p-3">
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

      {/* Quick Actions */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => explainTerm('Sharpe Ratio')}
            className="flex-1 text-xs bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Explain Sharpe Ratio
          </button>
          <button
            onClick={() => handleSuggestionClick('Show me portfolio risk metrics')}
            className="flex-1 text-xs bg-purple-50 text-purple-600 py-2 px-3 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Portfolio Analysis
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 rounded-b-2xl">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about ${chatMode === 'general' ? 'anything' : chatMode.replace('_', ' ')}...`}
              className="w-full resize-none border border-gray-300 rounded-xl px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows="2"
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2">
              <ModeIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChat
