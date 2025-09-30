# 🚀 TradeLab Deployment Guide

## Quick Start

### 1. Deploy Frontend to Vercel
```bash
# 1. Push your code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to vercel.com and deploy
# - Import your GitHub repo
# - Set Root Directory to "frontend"
# - Add environment variables (see below)
```

### 2. Deploy Backend to Vercel
```bash
# 1. Create another Vercel project
# - Import the same GitHub repo
# - Set Root Directory to "backend"
# - Add backend environment variables
```

## 🔧 Environment Variables

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend-url.vercel.app
VITE_OLLAMA_HOST=http://localhost:11434
VITE_OLLAMA_MODEL=wizardlm2:latest
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Vercel)
```
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
BINANCE_API_KEY=your_binance_key
BINANCE_SECRET_KEY=your_binance_secret
```

## 🎯 How It Works

### For Users:
1. **Visit your deployed app** on Vercel
2. **Install Ollama locally** (ollama.ai)
3. **Download a model** (`ollama pull wizardlm2`)
4. **Open the chatbot** - it connects to their local Ollama
5. **Get AI responses** powered by their own models

### Benefits:
- ✅ **No API costs** - Users run their own models
- ✅ **Complete privacy** - Data stays on user's machine
- ✅ **No rate limits** - Users control their resources
- ✅ **Customizable** - Users can use any Ollama model

## 🛠️ Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## 📱 User Instructions

Include this in your app:

### Getting Started with AI Chatbot:
1. **Install Ollama**: Visit [ollama.ai](https://ollama.ai)
2. **Download a model**: Run `ollama pull wizardlm2` in terminal
3. **Start Ollama**: It usually starts automatically
4. **Open chatbot**: Click the AI icon in the app
5. **Configure if needed**: Use settings to adjust host/model

### Troubleshooting:
- **"Ollama not detected"**: Make sure Ollama is running
- **Connection failed**: Check if Ollama is on port 11434
- **Model not found**: Run `ollama pull model-name`

## 🔒 Security & Privacy

- **No external AI calls** from your servers
- **Users' portfolio data** stays on their machine
- **No API keys exposed** - users use their own Ollama
- **Complete privacy** - everything runs locally

## 📋 Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Vercel
- [ ] Environment variables configured
- [ ] API URL updated in frontend
- [ ] Test local Ollama connection
- [ ] Test portfolio data fetching
- [ ] Test AI responses
- [ ] Document user setup instructions

## 🎉 You're Ready!

Your TradeLab app is now deployed with:
- **Portfolio management**
- **Risk analysis**
- **Backtesting**
- **Paper trading**
- **AI chatbot** (powered by users' local Ollama)

Users get a complete trading platform with their own private AI assistant!
