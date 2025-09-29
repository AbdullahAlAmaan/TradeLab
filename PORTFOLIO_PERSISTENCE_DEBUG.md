# Portfolio Persistence Debug Guide

## Issue
When you sign out and sign back in, your previous portfolios are not showing up.

## Root Causes
This issue can be caused by several factors:

1. **Database Connection Issues**: The app might not be connecting to the right database
2. **User ID Mismatch**: The user ID from JWT token might not match what's stored in the database
3. **Authentication Issues**: JWT token verification might be failing
4. **Database Schema Issues**: Tables might not be created or data might not be persisting

## Debug Steps

### Step 1: Check Backend Logs
1. Start the backend: `cd backend && python -m uvicorn app.main:app --reload`
2. Look for DEBUG messages in the console when you:
   - Sign in
   - Create a portfolio
   - Sign out and sign back in
   - Try to view portfolios

### Step 2: Test Database Connection
1. Visit: `http://localhost:8000/api/v1/debug/database`
2. Check if the database is connected and what data exists

### Step 3: Test Authentication
1. Visit: `http://localhost:8000/api/v1/auth/me` (with proper authentication)
2. Check if the user ID is consistent

### Step 4: Check Frontend Network Tab
1. Open browser dev tools
2. Go to Network tab
3. Sign in and create a portfolio
4. Check the API calls and responses
5. Look for any 401/403 errors

## Common Fixes

### Fix 1: Database Connection
If the database connection is failing:

1. **For Supabase**: Make sure your `.env` file has the correct Supabase credentials
2. **For Local Development**: Set up a local PostgreSQL database

```bash
# Create local database
createdb tradelab

# Run the schema
psql tradelab < database/schema.sql
```

### Fix 2: User ID Consistency
If user IDs don't match:

1. Check the JWT token payload in browser dev tools
2. Compare the `sub` field with what's stored in the database
3. Ensure the user ID is being converted to string consistently

### Fix 3: Authentication Issues
If JWT verification is failing:

1. Check if your Supabase configuration is correct
2. Verify the JWT secret key
3. For development, the app will fall back to less strict verification

### Fix 4: Database Schema
If tables don't exist:

1. Run the schema: `psql tradelab < database/schema.sql`
2. Check if the tables were created: `\dt` in psql

## Testing the Fix

1. **Create a portfolio** while logged in
2. **Sign out** completely
3. **Sign back in** with the same account
4. **Check if the portfolio appears**

## Debug Endpoints Added

- `GET /api/v1/debug/database` - Shows database contents and connection info
- `GET /api/v1/health/detailed` - Shows detailed health status
- Enhanced logging in portfolio endpoints

## Expected Debug Output

When working correctly, you should see:

```
DEBUG: JWT payload: {'sub': 'user-uuid', 'email': 'user@example.com', ...}
DEBUG: Extracted user_id: user-uuid
DEBUG: Creating portfolio for user_id: user-uuid
DEBUG: Created portfolio portfolio-uuid for user user-uuid
DEBUG: Getting portfolios for user_id: user-uuid
DEBUG: Found 1 portfolios for current user
```

## If Still Not Working

1. Check the browser's localStorage for the auth token
2. Verify the token is being sent in API requests
3. Check if the database is actually persisting data
4. Try creating a new account and see if the issue persists

## Quick Test Script

Run `python debug_auth.py` to test basic connectivity and authentication flow.
