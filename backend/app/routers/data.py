"""Data ingestion endpoints for fetching market data."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.schemas import DataFetchRequest, AssetPriceCreate, AssetPrice
from app.models import AssetPrice as AssetPriceModel
from datetime import datetime, timedelta
import yfinance as yf
from binance.client import Client as BinanceClient
from app.config import settings
import pandas as pd

router = APIRouter()

# Initialize Binance client
binance_client = BinanceClient(
    api_key=settings.binance_api_key,
    api_secret=settings.binance_secret_key,
    testnet=True
)


@router.post("/fetch")
async def fetch_market_data(
    request: DataFetchRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch market data for a symbol and store in database."""
    try:
        if request.asset_type == "stock":
            return await _fetch_stock_data(request, db)
        elif request.asset_type == "crypto":
            return await _fetch_crypto_data(request, db)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid asset type. Must be 'stock' or 'crypto'"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data: {str(e)}"
        )


async def _fetch_stock_data(request: DataFetchRequest, db: Session):
    """Fetch stock data using yfinance."""
    try:
        # Calculate start date
        end_date = datetime.now()
        start_date = end_date - timedelta(days=request.days)
        
        # Fetch data from Yahoo Finance
        ticker = yf.Ticker(request.symbol)
        data = ticker.history(start=start_date, end=end_date)
        
        if data.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No data found for symbol {request.symbol}"
            )
        
        # Store data in database
        stored_count = 0
        for timestamp, row in data.iterrows():
            # Check if data already exists
            existing = db.query(AssetPriceModel).filter(
                AssetPriceModel.symbol == request.symbol,
                AssetPriceModel.asset_type == request.asset_type,
                AssetPriceModel.timestamp == timestamp
            ).first()
            
            if not existing:
                price_data = AssetPriceModel(
                    symbol=request.symbol,
                    asset_type=request.asset_type,
                    timestamp=timestamp,
                    open=float(row['Open']),
                    high=float(row['High']),
                    low=float(row['Low']),
                    close=float(row['Close']),
                    volume=int(row['Volume']),
                    created_at=datetime.utcnow()
                )
                db.add(price_data)
                stored_count += 1
        
        db.commit()
        
        return {
            "message": f"Successfully fetched and stored {stored_count} data points for {request.symbol}",
            "symbol": request.symbol,
            "asset_type": request.asset_type,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "stored_count": stored_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stock data: {str(e)}"
        )


async def _fetch_crypto_data(request: DataFetchRequest, db: Session):
    """Fetch crypto data using Binance API."""
    try:
        # Calculate start and end timestamps
        end_time = int(datetime.now().timestamp() * 1000)
        start_time = int((datetime.now() - timedelta(days=request.days)).timestamp() * 1000)
        
        # Fetch data from Binance
        klines = binance_client.get_historical_klines(
            symbol=request.symbol.upper() + "USDT",  # Add USDT pair
            interval="1d",
            start_str=start_time,
            end_str=end_time
        )
        
        if not klines:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No data found for symbol {request.symbol}"
            )
        
        # Store data in database
        stored_count = 0
        for kline in klines:
            timestamp = datetime.fromtimestamp(kline[0] / 1000)
            
            # Check if data already exists
            existing = db.query(AssetPriceModel).filter(
                AssetPriceModel.symbol == request.symbol,
                AssetPriceModel.asset_type == request.asset_type,
                AssetPriceModel.timestamp == timestamp
            ).first()
            
            if not existing:
                price_data = AssetPriceModel(
                    symbol=request.symbol,
                    asset_type=request.asset_type,
                    timestamp=timestamp,
                    open=float(kline[1]),
                    high=float(kline[2]),
                    low=float(kline[3]),
                    close=float(kline[4]),
                    volume=int(float(kline[5])),
                    created_at=datetime.utcnow()
                )
                db.add(price_data)
                stored_count += 1
        
        db.commit()
        
        return {
            "message": f"Successfully fetched and stored {stored_count} data points for {request.symbol}",
            "symbol": request.symbol,
            "asset_type": request.asset_type,
            "start_date": datetime.fromtimestamp(start_time / 1000).isoformat(),
            "end_date": datetime.fromtimestamp(end_time / 1000).isoformat(),
            "stored_count": stored_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching crypto data: {str(e)}"
        )


@router.get("/prices/{symbol}")
async def get_price_data(
    symbol: str,
    asset_type: str,
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get stored price data for a symbol."""
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Query database
    prices = db.query(AssetPriceModel).filter(
        AssetPriceModel.symbol == symbol,
        AssetPriceModel.asset_type == asset_type,
        AssetPriceModel.timestamp >= start_date,
        AssetPriceModel.timestamp <= end_date
    ).order_by(AssetPriceModel.timestamp).all()
    
    if not prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No price data found for {symbol}"
        )
    
    return {
        "symbol": symbol,
        "asset_type": asset_type,
        "data_points": len(prices),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "prices": [
            {
                "timestamp": price.timestamp.isoformat(),
                "open": float(price.open),
                "high": float(price.high),
                "low": float(price.low),
                "close": float(price.close),
                "volume": price.volume
            }
            for price in prices
        ]
    }
