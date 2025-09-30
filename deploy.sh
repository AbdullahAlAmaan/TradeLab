#!/bin/bash

# TradeLab Vercel Deployment Script
echo "🚀 TradeLab Vercel Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the TradeLab root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Code is committed to Git"
echo "2. ✅ Environment variables are ready"
echo "3. ✅ Backend is tested locally"
echo "4. ✅ Frontend builds successfully"

read -p "Have you completed the checklist above? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the checklist first"
    exit 1
fi

echo ""
echo "🔧 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "🔧 Building backend..."
cd backend
# Test if backend can start
python -c "from app.main import app; print('✅ Backend imports successfully')"
if [ $? -ne 0 ]; then
    echo "❌ Backend has import errors"
    exit 1
fi
cd ..

echo ""
echo "📦 Creating deployment package..."
# Create a temporary directory for deployment
mkdir -p deploy-package
cp -r frontend/* deploy-package/
cp vercel.json deploy-package/

echo ""
echo "🎯 Deployment instructions:"
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub"
echo "3. Click 'New Project'"
echo "4. Import your TradeLab repository"
echo "5. Set Root Directory to 'frontend'"
echo "6. Add environment variables:"
echo "   - VITE_API_URL=https://your-backend-url.vercel.app"
echo "   - VITE_OLLAMA_HOST=http://localhost:11434"
echo "   - VITE_OLLAMA_MODEL=wizardlm2:latest"
echo "   - VITE_SUPABASE_URL=your_supabase_url"
echo "   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo "7. Click 'Deploy'"

echo ""
echo "🔄 For backend deployment:"
echo "1. Create another Vercel project"
echo "2. Set Root Directory to 'backend'"
echo "3. Add backend environment variables"
echo "4. Deploy"

echo ""
echo "✅ Deployment script completed!"
echo "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
