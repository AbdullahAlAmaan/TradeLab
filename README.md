# TradeLab - Trading Platform MVP

A comprehensive trading platform with backtesting, risk analysis, and paper trading capabilities.

## 🎯 Features

- **Authentication**: Supabase Auth integration
- **Asset Management**: Track stocks and crypto assets
- **Backtesting**: Moving average crossover strategy with Backtrader
- **Risk Analysis**: VaR, CVaR, Sharpe ratio, Monte Carlo simulation
- **Paper Trading**: Alpaca (stocks) + Binance Testnet (crypto)
- **Real-time Dashboard**: React frontend with charts and metrics

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: FastAPI + SQLAlchemy + Backtrader
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel (frontend) + Render (backend)

## 📁 Project Structure

```
TradeLab/
├── frontend/          # React application
├── backend/           # FastAPI application
├── database/          # Supabase migrations and schemas
├── docs/             # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account
- Alpaca account (for paper trading)
- Binance account (for testnet)

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
BINANCE_API_KEY=your_binance_testnet_api_key
BINANCE_SECRET_KEY=your_binance_testnet_secret_key
```

**Frontend (.env)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

## 📅 Development Roadmap

- [x] Week 1: Project Setup ✅
- [x] Week 2: Data Ingestion ✅
- [x] Week 3: Backtest Engine ✅
- [x] Week 4: Risk Metrics ✅
- [x] Week 5: Paper Trading ✅
- [x] Week 6: Frontend Integration + Deployment ✅

## 🚀 Quick Start

1. **Set up Supabase**: Create project and run `database/schema.sql`
2. **Configure Environment**: Copy `env.example` files and add your API keys
3. **Install Dependencies**: 
   ```bash
   # Backend
   cd backend && pip install -r requirements.txt
   
   # Frontend  
   cd frontend && npm install
   ```
4. **Run the Application**:
   ```bash
   # Backend
   cd backend && python main.py
   
   # Frontend
   cd frontend && npm run dev
   ```
5. **Access**: Frontend at http://localhost:3000, API at http://localhost:8000

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Database Schema](database/schema.sql) - Complete database structure

