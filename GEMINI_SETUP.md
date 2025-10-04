# 🤖 Gemini AI Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Get Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the API key (starts with `AIza...`)

### 2. Add to Railway Environment
1. Go to your Railway project dashboard
2. Click on "Variables" tab
3. Add these environment variables:
   ```
   GEMINI_API_KEY=AIza...your_actual_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
4. Deploy your changes

### 3. Test the Integration
1. Visit your deployed app
2. Click the AI assistant button (sparkles icon)
3. Ask: "Analyze my portfolio"
4. You should get AI-powered responses!

## 💰 Pricing (FREE!)

**Gemini 1.5 Flash (Recommended)**
- ✅ **FREE**: 15 requests per minute
- ✅ **FREE**: 1 million tokens per day
- ✅ **FREE**: No credit card required
- ✅ Perfect for portfolio analysis

**Gemini 1.5 Pro** (Optional upgrade)
- 💳 Paid: For heavy usage
- 🚀 More capable for complex tasks
- 📊 Higher rate limits

## 🔧 Features

Your AI assistant can now:
- 📈 Analyze portfolio performance
- ⚖️ Assess risk and diversification  
- 📊 Provide market insights
- 💡 Suggest trading strategies
- 🔍 Research investments
- 📋 Generate reports

## 🛠️ Troubleshooting

**"Gemini AI Unavailable"**
- Check if `GEMINI_API_KEY` is set in Railway
- Verify the API key is valid
- Check Railway deployment logs

**"API Key not configured"**
- Make sure you added `GEMINI_API_KEY` to Railway variables
- Redeploy after adding the environment variable

**Rate limit errors**
- You're hitting the free tier limits (15 requests/minute)
- Wait a minute or upgrade to Pro for higher limits

## 🎯 Why Gemini?

✅ **No localhost issues** - Works from any deployed environment
✅ **Free tier** - Generous limits for personal use  
✅ **Simple setup** - Just add API key
✅ **No CORS problems** - Standard API calls
✅ **Google reliability** - Enterprise-grade infrastructure
✅ **Fast responses** - Optimized for real-time chat

## 🔄 Migration from Ollama

The old Ollama integration has been replaced with Gemini:
- ❌ OllamaChatbot.jsx → ✅ GeminiChatbot.jsx
- ❌ llm_proxy router → ✅ gemini router
- ❌ Localhost dependency → ✅ Cloud API
- ❌ CORS issues → ✅ Standard HTTP

Your users will get a much better experience with Gemini!
