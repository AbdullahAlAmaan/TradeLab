# 🚀 Vercel Deployment Fix Guide

## ✅ **Fixed Issues**

### **1. Distutils Error Fix**
- Updated `requirements.txt` with `setuptools>=65.0.0`
- Specified Python 3.11 in `runtime.txt`
- Updated Supabase to version 2.9.1 for compatibility

### **2. Vercel Configuration**
- Created `backend/vercel.json` for proper deployment
- Added `backend/runtime.txt` to specify Python version
- Updated `main.py` for Vercel compatibility

## 🚀 **Deployment Steps**

### **Backend Deployment**
1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment issues"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set **Root Directory** to `backend`
   - Add environment variables (see below)

### **Frontend Deployment**
1. **Deploy frontend separately**
   - Set **Root Directory** to `frontend`
   - Add environment variables (see below)

## 🔧 **Environment Variables**

### **Backend (Vercel)**
```
DATABASE_URL=postgresql://postgres.csqdprybspteeejcmycr:[YOUR-PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://csqdprybspteeejcmycr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=bHIpbKnXEICSOycxf6RP2BQrOopQa8NgnhHGoAgLjfsfKqQZcRyWopr9QNMC/rlhoVGK3nhPwHHcTYtQKJqbQg==
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
BINANCE_API_KEY=your_binance_key
BINANCE_SECRET_KEY=your_binance_secret
```

### **Frontend (Vercel)**
```
VITE_API_URL=https://your-backend-url.vercel.app
VITE_OLLAMA_HOST=http://localhost:11434
VITE_OLLAMA_MODEL=wizardlm2:latest
```

## 🎯 **Key Changes Made**

1. **requirements.txt**: Added `setuptools>=65.0.0` and updated Supabase version
2. **runtime.txt**: Specified Python 3.11
3. **vercel.json**: Created Vercel configuration for backend
4. **main.py**: Added Vercel compatibility

## ✅ **Testing**

After deployment:
1. Check backend health: `https://your-backend.vercel.app/api/v1/health`
2. Test frontend: `https://your-frontend.vercel.app`
3. Verify Ollama integration works locally

## 🔍 **Troubleshooting**

If you still get distutils errors:
1. Check Python version is 3.11
2. Verify `setuptools>=65.0.0` is installed
3. Clear Vercel build cache
4. Redeploy

The app should now deploy successfully on Vercel! 🎉
