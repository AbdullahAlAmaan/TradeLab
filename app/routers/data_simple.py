"""Simple data router for testing."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DataFetchRequest
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd

router = APIRouter()

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify server is working."""
    print("🔍 DEBUG: Test endpoint called!")
    return {"message": "Data router is working", "status": "ok"}

@router.post("/fetch")
async def fetch_market_data(request: DataFetchRequest, db: Session = Depends(get_db)):
    """Fetch market data for a symbol."""
    print(f"🔍 DEBUG: fetch_market_data called with symbol={request.symbol}, asset_type={request.asset_type}")
    
    try:
        if request.asset_type == "stock":
            # Use yfinance to get stock data
            ticker = yf.Ticker(request.symbol)
            hist = ticker.history(period=f"{request.days}d")
            
            if hist.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No data found for symbol {request.symbol}"
                )
            
            # Convert to our format
            prices = []
            for timestamp, row in hist.iterrows():
                prices.append({
                    "timestamp": timestamp.isoformat(),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0
                })
            
            return {
                "symbol": request.symbol,
                "asset_type": request.asset_type,
                "data_preview": {
                    "last_price": float(hist['Close'].iloc[-1]),
                    "open_price": float(hist['Open'].iloc[-1]),
                    "high_price": float(hist['High'].iloc[-1]),
                    "low_price": float(hist['Low'].iloc[-1]),
                    "volume": int(hist['Volume'].iloc[-1]) if not pd.isna(hist['Volume'].iloc[-1]) else 0,
                    "change": float(hist['Close'].iloc[-1] - hist['Open'].iloc[-1]),
                    "change_percent": float((hist['Close'].iloc[-1] - hist['Open'].iloc[-1]) / hist['Open'].iloc[-1] * 100)
                },
                "prices": prices
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only stock asset type supported in simple router"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching market data: {str(e)}"
        )

@router.get("/prices/{symbol}")
async def get_price_data(symbol: str, asset_type: str, days: int = 30, db: Session = Depends(get_db)):
    """Get price data for a symbol."""
    print(f"🔍 DEBUG: get_price_data called with symbol={symbol}, asset_type={asset_type}, days={days}")
    
    try:
        if asset_type == "stock":
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=f"{days}d")
            
            if hist.empty:
                return {"prices": []}
            
            prices = []
            for timestamp, row in hist.iterrows():
                prices.append({
                    "timestamp": timestamp.isoformat(),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0
                })
            
            return {"prices": prices}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only stock asset type supported in simple router"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching price data: {str(e)}"
        )
