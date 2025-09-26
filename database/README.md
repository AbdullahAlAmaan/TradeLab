# Database Setup

This directory contains the database schema and migration files for the TradeLab platform.

## Files

- `schema.sql` - Complete database schema with all tables, indexes, and triggers
- `README.md` - This file

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note down your project URL and API keys

### 2. Run Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Execute the script

### 3. Enable Row Level Security (RLS)

Run the following SQL in Supabase to enable RLS policies:

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

-- Create policies for assets
CREATE POLICY "Users can view assets in own portfolios" ON assets
    FOR SELECT USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert assets in own portfolios" ON assets
    FOR INSERT WITH CHECK (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update assets in own portfolios" ON assets
    FOR UPDATE USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete assets in own portfolios" ON assets
    FOR DELETE USING (
        portfolio_id IN (
            SELECT id FROM portfolios WHERE user_id = auth.uid()
        )
    );

-- Create policies for other tables (similar pattern)
-- ... (additional policies for strategies, backtest_results, paper_trades, risk_metrics)
```

### 4. Environment Variables

Add these to your backend `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Tables Overview

- **portfolios**: User portfolios
- **assets**: Assets within portfolios (stocks/crypto)
- **asset_prices**: OHLC price data
- **strategies**: Trading strategies
- **backtest_results**: Backtest results and performance metrics
- **paper_trades**: Paper trading transactions
- **risk_metrics**: Portfolio risk calculations

