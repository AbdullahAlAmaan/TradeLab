import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://tradelab-production.up.railway.app'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase.auth.token')
  console.log('API Request - Token available:', !!token)
  if (token) {
    // Check if token is expired before sending
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        console.log('API Request - Token expired, removing from localStorage')
        localStorage.removeItem('supabase.auth.token')
        return config
      }
    } catch (error) {
      console.error('API Request - Error checking token:', error)
      localStorage.removeItem('supabase.auth.token')
      return config
    }
    
    config.headers.Authorization = `Bearer ${token}`
    console.log('API Request - Authorization header set')
  } else {
    console.log('API Request - No token found in localStorage')
  }
  return config
})

// Handle auth errors in responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('API Response - 401 Unauthorized, clearing token')
      localStorage.removeItem('supabase.auth.token')
      // Optionally redirect to login page
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  getCurrentUser: () => api.get('/auth/me'),
  verifyToken: () => api.post('/auth/verify'),
}

export const portfolioAPI = {
  getPortfolios: () => api.get('/assets/portfolios'),
  createPortfolio: (data) => api.post('/assets/portfolios', data),
  updatePortfolio: (id, data) => api.put(`/assets/portfolios/${id}`, data),
  deletePortfolio: (id) => api.delete(`/assets/portfolios/${id}`),
  getPortfolio: (id) => api.get(`/assets/portfolios/${id}`),
}

export const assetAPI = {
  getAssets: (portfolioId) => api.get(`/assets/portfolios/${portfolioId}/assets`),
  createAsset: (data) => api.post('/assets/assets', data),
  updateAsset: (id, data) => api.put(`/assets/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/assets/assets/${id}`),
}

export const dataAPI = {
  fetchData: (data) => api.post('/data/fetch', data),
  getPriceData: (symbol, assetType, days = 30) => 
    api.get(`/data/prices/${symbol}?asset_type=${assetType}&days=${days}`),
}

export const backtestAPI = {
  runBacktest: (data) => api.post('/backtest/run', data),
  getResults: () => api.get('/backtest/results'),
  getResult: (id) => api.get(`/backtest/results/${id}`),
}

export const riskAPI = {
  calculateRisk: (data) => api.post('/risk/calculate', data),
  getRiskMetrics: (portfolioId) => api.get(`/risk/metrics/${portfolioId}`),
}

export const tradeAPI = {
  placeOrder: (data) => api.post('/trade/paper', data),
  getOrders: () => api.get('/trade/trades'),
  getOrder: (id) => api.get(`/trade/trades/${id}`),
  getPositions: () => api.get('/trade/positions'),
}

export default api
