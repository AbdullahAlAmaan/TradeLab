# TradeLab Setup Guide

This guide will help you set up the TradeLab trading platform on your local machine.

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git
- Supabase account
- Alpaca account (for paper trading)
- Binance account (for testnet)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TradeLab
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema from `database/schema.sql`
3. Note down your project URL and API keys

### 3. Set Up Environment Variables

#### Backend Environment

Create `backend/.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
BINANCE_API_KEY=your_binance_testnet_api_key
BINANCE_SECRET_KEY=your_binance_testnet_secret_key
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend Environment

Create `frontend/.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Install Dependencies

#### Backend

```bash
cd backend
pip install -r requirements.txt
```

#### Frontend

```bash
cd frontend
npm install
```

### 5. Run the Application

#### Option 1: Using Docker Compose (Recommended)

```bash
# From the root directory
docker-compose up --build
```

#### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python main.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Keys Setup

### Alpaca (Paper Trading)

1. Go to [Alpaca](https://alpaca.markets/)
2. Create an account
3. Go to Paper Trading section
4. Generate API keys
5. Use the paper trading URL: `https://paper-api.alpaca.markets`

### Binance (Testnet)

1. Go to [Binance Testnet](https://testnet.binance.vision/)
2. Create an account
3. Generate API keys for testnet
4. Use the testnet URL: `https://testnet.binance.vision`

## Database Setup

### Enable Row Level Security (RLS)

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Create similar policies for other tables...
```

## Development

### Backend Development

The backend uses FastAPI with the following structure:

```
backend/
├── app/
│   ├── routers/          # API route handlers
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py          # Authentication utilities
│   ├── config.py        # Configuration
│   └── database.py      # Database connection
├── main.py              # Application entry point
└── requirements.txt     # Python dependencies
```

### Frontend Development

The frontend uses React with Vite and Tailwind CSS:

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── lib/           # Utilities and API client
│   └── App.jsx        # Main application component
├── public/            # Static assets
└── package.json       # Node dependencies
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the frontend URL is in the `CORS_ORIGINS` environment variable
2. **Database Connection**: Verify your Supabase credentials are correct
3. **API Key Issues**: Ensure all API keys are valid and have the correct permissions
4. **Port Conflicts**: Make sure ports 3000 and 8000 are available

### Logs

- Backend logs: Check the terminal where you ran the backend
- Frontend logs: Check the browser console
- Database logs: Check Supabase dashboard

## Next Steps

1. Create your first portfolio
2. Add some assets to track
3. Run a backtest
4. Set up paper trading
5. Explore risk analysis features

## Support

If you encounter any issues, please check:

1. All environment variables are set correctly
2. All services are running
3. Database schema is properly set up
4. API keys have correct permissions

For more detailed information, check the individual component documentation in the `docs/` directory.
