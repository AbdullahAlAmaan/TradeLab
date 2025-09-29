# TradeLab Deployment Guide

## Overview

TradeLab is now a comprehensive AI-powered quantitative trading platform with the following features:

### ✅ **Core Features Implemented**

1. **🔐 Enhanced Authentication System**
   - Secure JWT verification with proper error handling
   - Improved user session management
   - Fixed portfolio persistence across login sessions

2. **📊 Real-time Market Data**
   - Live stock prices via Yahoo Finance
   - Real-time cryptocurrency data via Binance WebSocket
   - Enhanced market data viewer with search and filtering

3. **🤖 AI-Powered Assistant**
   - Financial term explainer
   - Portfolio and backtest analysis
   - Trading strategy generator
   - Natural language to SQL converter
   - Context-aware recommendations

4. **📈 Advanced Risk Analytics**
   - Value at Risk (VaR) and Conditional VaR (CVaR)
   - Sharpe and Sortino ratios
   - Monte Carlo simulations
   - Correlation analysis
   - Stress testing scenarios
   - Sector concentration analysis

5. **⚡ Real-time Features**
   - WebSocket support for live price updates
   - Real-time portfolio updates
   - Live trading feed

6. **🧪 Enhanced Backtesting**
   - Multiple strategy templates
   - Comprehensive performance metrics
   - Risk-adjusted returns analysis

7. **💼 Improved Paper Trading**
   - Real-time position tracking
   - P&L calculations
   - Multi-broker support (Alpaca, Binance)

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory:

```bash
# Environment
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret_for_verification
SUPABASE_DB_PASSWORD=your_database_password

# Database Configuration (optional - overrides Supabase auto-construction)
# DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30

# Trading API Keys
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
BINANCE_BASE_URL=https://testnet.binance.vision

# OpenAI Configuration (for AI assistant)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Security Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# WebSocket Configuration
WEBSOCKET_HEARTBEAT_INTERVAL=30
WEBSOCKET_TIMEOUT=300

# Data Configuration
MAX_DATA_POINTS_PER_REQUEST=1000
DEFAULT_DATA_DAYS=30
CACHE_TTL_SECONDS=300

# Risk Configuration
MAX_PORTFOLIO_VALUE=1000000.0
MAX_POSITION_SIZE_PERCENT=0.2
DEFAULT_RISK_FREE_RATE=0.02
```

## Database Setup

### Option 1: Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Get your project URL and keys
3. Run the schema from `database/schema.sql` in the Supabase SQL editor
4. Update your `.env` file with Supabase credentials

### Option 2: Local PostgreSQL

1. Install PostgreSQL
2. Create database:
   ```bash
   createdb tradelab
   ```
3. Run schema:
   ```bash
   psql tradelab < database/schema.sql
   ```
4. Set `DATABASE_URL` in your `.env` file

## Installation & Deployment

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Production Deployment

#### Backend (Render/Railway)

1. **Render Deployment:**
   ```bash
   # Build Command
   pip install -r requirements.txt
   
   # Start Command
   python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. **Railway Deployment:**
   ```bash
   # Railway will auto-detect Python and use requirements.txt
   # Ensure Procfile contains:
   web: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

#### Frontend (Vercel/Netlify)

1. **Vercel Deployment:**
   ```bash
   # Build Command
   npm run build
   
   # Output Directory
   dist
   ```

2. **Netlify Deployment:**
   ```bash
   # Build Command
   npm run build
   
   # Publish Directory
   dist
   ```

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/tradelab
    depends_on:
      - db
    volumes:
      - ./backend/.env:/app/.env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: tradelab
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

## API Configuration

### Required API Keys

1. **OpenAI API Key** (Required for AI Assistant)
   - Sign up at https://platform.openai.com
   - Create API key
   - Add to `OPENAI_API_KEY` environment variable

2. **Alpaca API Key** (Optional - for stock trading)
   - Sign up at https://alpaca.markets
   - Get paper trading API keys
   - Add to `ALPACA_API_KEY` and `ALPACA_SECRET_KEY`

3. **Binance API Key** (Optional - for crypto trading)
   - Sign up at https://binance.com
   - Enable API access
   - Add to `BINANCE_API_KEY` and `BINANCE_SECRET_KEY`

## Feature Testing

### AI Assistant Testing
```bash
# Test AI chat endpoint
curl -X POST "http://localhost:8000/api/v1/ai/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain Sharpe ratio", "context_type": "explainer"}'
```

### WebSocket Testing
```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'YOUR_JWT_TOKEN'
  }));
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbol: 'AAPL',
    asset_type: 'stock'
  }));
};
```

### Risk Analytics Testing
```bash
# Test risk metrics calculation
curl -X POST "http://localhost:8000/api/v1/risk/calculate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"portfolio_id": "YOUR_PORTFOLIO_ID"}'
```

## Performance Optimization

### Backend Optimizations
- Database connection pooling configured
- Async endpoints for better concurrency
- Proper error handling and logging
- Input validation and sanitization

### Frontend Optimizations
- Component lazy loading
- Efficient state management
- Real-time updates via WebSocket
- Responsive design for mobile

## Security Considerations

### Production Security Checklist
- [ ] Change default secret keys
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Use environment variables for secrets
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

### Authentication Security
- JWT token validation with proper expiration
- Secure password hashing
- Session management
- Role-based access control

## Monitoring & Logging

### Application Monitoring
```python
# Add to your monitoring setup
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Health Check Endpoints
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed system status
- `GET /api/v1/debug/database` - Database connection info

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check JWT secret configuration
   - Verify Supabase credentials
   - Ensure token format is correct

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Confirm database is running

3. **API Rate Limits**
   - Check API key quotas
   - Implement exponential backoff
   - Use caching where appropriate

4. **WebSocket Connection Failures**
   - Check CORS configuration
   - Verify WebSocket support in deployment
   - Test connection timeout settings

### Debug Tools
- `python debug_auth.py` - Test authentication flow
- Database debug endpoint: `/api/v1/debug/database`
- WebSocket status: `/api/v1/ws/status`

## Scaling Considerations

### Database Scaling
- Set up read replicas for heavy read workloads
- Implement database connection pooling
- Consider partitioning for large datasets

### Application Scaling
- Use horizontal scaling with load balancers
- Implement caching (Redis)
- Set up CDN for static assets

### Real-time Features Scaling
- Use Redis for WebSocket session management
- Implement message queues for high-throughput updates
- Consider event-driven architecture

## Support & Maintenance

### Regular Maintenance Tasks
- Monitor database performance
- Update dependencies regularly
- Check API rate limits and quotas
- Review and rotate API keys
- Monitor error rates and performance metrics

### Backup Strategy
- Daily database backups
- Environment variable backups
- Code repository backups
- API key management system
