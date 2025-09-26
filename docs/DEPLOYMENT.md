# TradeLab Deployment Guide

This guide covers deploying the TradeLab platform to production using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub repository with your code
- Vercel account
- Render account
- Supabase project (already set up)
- Alpaca and Binance API keys

## Frontend Deployment (Vercel)

### 1. Connect to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your TradeLab repository
5. Select the `frontend` folder as the root directory

### 2. Configure Environment Variables

In Vercel dashboard, go to your project settings and add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

### 3. Build Settings

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4. Deploy

Click "Deploy" and Vercel will automatically build and deploy your frontend.

## Backend Deployment (Render)

### 1. Connect to Render

1. Go to [Render](https://render.com)
2. Sign in with your GitHub account
3. Click "New" → "Web Service"
4. Connect your TradeLab repository

### 2. Configure Service

- **Name**: tradelab-backend
- **Root Directory**: `backend`
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Environment Variables

Add these environment variables in Render:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
BINANCE_API_KEY=your_binance_testnet_api_key
BINANCE_SECRET_KEY=your_binance_testnet_secret_key
DEBUG=False
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

### 4. Deploy

Click "Create Web Service" and Render will build and deploy your backend.

## Database Setup (Supabase)

### 1. Production Database

Your Supabase project is already set up. Make sure:

1. All tables are created (run `database/schema.sql`)
2. RLS policies are enabled
3. Auth is configured
4. API keys are secure

### 2. Update CORS Settings

In Supabase dashboard:
1. Go to Authentication → Settings
2. Add your production frontend URL to "Site URL"
3. Add your frontend URL to "Redirect URLs"

## Domain Configuration

### 1. Custom Domain (Optional)

#### Frontend (Vercel)
1. Go to your project settings
2. Add your custom domain
3. Configure DNS records as instructed

#### Backend (Render)
1. Go to your service settings
2. Add custom domain
3. Configure DNS records

### 2. Update Environment Variables

After setting up custom domains, update:

- Frontend: `VITE_API_BASE_URL` to your custom backend domain
- Backend: `CORS_ORIGINS` to include your custom frontend domain

## SSL and Security

### 1. SSL Certificates

Both Vercel and Render provide free SSL certificates automatically.

### 2. Security Headers

The frontend nginx configuration includes security headers. For additional security:

1. Enable HTTPS redirects
2. Set up CSP headers
3. Configure rate limiting on the backend

## Monitoring and Logs

### 1. Vercel Analytics

Enable Vercel Analytics for frontend monitoring:
1. Go to project settings
2. Enable Analytics
3. View performance metrics

### 2. Render Logs

Monitor backend logs in Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Monitor real-time logs

### 3. Supabase Monitoring

Monitor database performance in Supabase dashboard:
1. Go to your project
2. Check "Database" tab for performance metrics
3. Monitor API usage

## Scaling Considerations

### 1. Backend Scaling

- Render free tier has limitations
- Consider upgrading for production use
- Monitor resource usage

### 2. Database Scaling

- Supabase free tier has limits
- Monitor usage and upgrade if needed
- Consider read replicas for heavy usage

### 3. CDN

- Vercel provides global CDN automatically
- Static assets are cached globally
- Consider additional CDN for heavy media

## Backup and Recovery

### 1. Database Backups

Supabase provides automatic backups:
1. Go to project settings
2. Check backup settings
3. Set up additional backups if needed

### 2. Code Backups

- Code is backed up in GitHub
- Keep multiple branches for different environments
- Tag releases for easy rollback

## Performance Optimization

### 1. Frontend Optimization

- Enable Vercel's automatic optimizations
- Use code splitting
- Optimize images and assets
- Enable compression

### 2. Backend Optimization

- Use connection pooling
- Implement caching
- Optimize database queries
- Monitor response times

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS_ORIGINS environment variable
2. **Database Connection**: Verify Supabase credentials
3. **API Key Issues**: Ensure all keys are valid
4. **Build Failures**: Check build logs for errors

### Debugging

1. Check application logs
2. Monitor network requests
3. Verify environment variables
4. Test API endpoints directly

## Maintenance

### 1. Regular Updates

- Keep dependencies updated
- Monitor security advisories
- Update API keys regularly
- Test deployments in staging

### 2. Monitoring

- Set up alerts for errors
- Monitor performance metrics
- Track user activity
- Monitor resource usage

## Cost Optimization

### 1. Free Tier Limits

- Vercel: 100GB bandwidth, 100 serverless functions
- Render: 750 hours/month, 512MB RAM
- Supabase: 500MB database, 2GB bandwidth

### 2. Optimization Tips

- Use efficient queries
- Implement caching
- Optimize images
- Monitor usage patterns

## Support

For deployment issues:

1. Check service documentation
2. Review logs and error messages
3. Test locally first
4. Contact support if needed

Remember to keep your API keys secure and never commit them to version control!
