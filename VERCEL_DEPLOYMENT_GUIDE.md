# Vercel Deployment Guide for TradeLab

This guide will help you deploy TradeLab to Vercel with Ollama integration, ensuring users connect to their own local Ollama instances.

## 🚀 Quick Deployment Steps

### 1. Frontend Deployment (Vercel)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your TradeLab repository
   - Set the **Root Directory** to `frontend`
   - Click "Deploy"

3. **Configure Environment Variables:**
   In Vercel dashboard, go to your project → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   VITE_OLLAMA_HOST=http://localhost:11434
   VITE_OLLAMA_MODEL=wizardlm2:latest
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Backend Deployment (Vercel)

1. **Create a separate Vercel project for the backend:**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import the same repository
   - Set the **Root Directory** to `backend`
   - Click "Deploy"

2. **Configure Backend Environment Variables:**
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

3. **Update Frontend API URL:**
   - Copy your backend Vercel URL
   - Update the `VITE_API_URL` environment variable in your frontend project

## 🔧 How Ollama Integration Works

### User Experience:
1. **User visits your deployed app** on Vercel
2. **User installs Ollama locally** on their machine
3. **User runs Ollama** (e.g., `ollama serve`)
4. **User opens the chatbot** in your app
5. **App connects to user's local Ollama** (localhost:11434)
6. **User gets AI responses** powered by their own models

### Technical Flow:
```
User's Browser (Vercel App) → User's Local Ollama → AI Response
                ↓
         Your Backend (Vercel) → Portfolio Data → Enhanced Prompt
```

## 📋 Prerequisites for Users

### What Users Need:
1. **Ollama installed** on their local machine
2. **A model downloaded** (e.g., `ollama pull wizardlm2`)
3. **Ollama running** (usually starts automatically)

### What Users DON'T Need:
- ❌ Your API keys
- ❌ Your models
- ❌ Your server resources
- ❌ Any special configuration

## 🛠️ Local Development Setup

1. **Clone and install:**
   ```bash
   git clone your-repo
   cd TradeLab/frontend
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env.local
   ```

3. **Update .env.local:**
   ```
   VITE_API_URL=http://localhost:8000
   VITE_OLLAMA_HOST=http://localhost:11434
   VITE_OLLAMA_MODEL=wizardlm2:latest
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## 🔒 Security & Privacy Benefits

### Why This Architecture is Secure:
- ✅ **No API keys exposed** - Users use their own Ollama
- ✅ **No data sent to external AI** - Everything runs locally
- ✅ **No model costs** - Users run their own models
- ✅ **Complete privacy** - Portfolio data stays on user's machine
- ✅ **No rate limits** - Users control their own resources

### What Data Flows Where:
- **Portfolio data**: Your backend → User's browser → User's Ollama
- **AI responses**: User's Ollama → User's browser → Your app
- **No external AI calls** from your servers

## 🚨 Important Notes

### CORS Configuration:
The app is configured to allow connections to `localhost:11434` from any domain. This is safe because:
- Users explicitly choose to connect to their local Ollama
- No sensitive data is exposed
- It's a local connection only

### Browser Security:
Modern browsers may block localhost connections from HTTPS sites. Users may need to:
1. Use HTTP version for local development
2. Or configure their browser to allow localhost connections
3. Or use a local tunnel service

### Fallback Behavior:
If Ollama is not available, the app shows helpful error messages and installation instructions.

## 📱 User Instructions

Include this in your app's documentation:

### For Users:
1. **Install Ollama**: Visit [ollama.ai](https://ollama.ai) and download
2. **Download a model**: Run `ollama pull wizardlm2` in terminal
3. **Start Ollama**: It usually starts automatically
4. **Open the chatbot**: Click the AI icon in the app
5. **Configure if needed**: Use the settings panel to adjust host/model

### Troubleshooting:
- **"Ollama not detected"**: Make sure Ollama is running
- **Connection failed**: Check if Ollama is on port 11434
- **Model not found**: Run `ollama pull model-name`

## 🎯 Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Vercel
- [ ] Environment variables configured
- [ ] API URL updated in frontend
- [ ] Test local Ollama connection
- [ ] Test portfolio data fetching
- [ ] Test AI responses
- [ ] Document user setup instructions

## 🔄 Updates & Maintenance

### To update the app:
1. Push changes to GitHub
2. Vercel automatically redeploys
3. Users get updates automatically

### To update Ollama models:
- Users manage their own models
- No server-side updates needed
- Users can switch models anytime

This architecture gives you a scalable, cost-effective, and privacy-focused AI trading assistant that users can customize with their own models!
