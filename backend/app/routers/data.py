"""Data ingestion endpoints for fetching market data."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, get_current_user_optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.schemas import DataFetchRequest, AssetPriceCreate, AssetPrice
from app.models import AssetPrice as AssetPriceModel
from datetime import datetime, timedelta
import yfinance as yf
from binance.client import Client as BinanceClient
from app.config import settings
import pandas as pd

router = APIRouter()

# Test endpoint without authentication - MOVED TO TOP FOR DEBUGGING
@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify server is working."""
    print("🔍 DEBUG: Test endpoint called!")
    return {"message": "Data router is working", "status": "ok"}

# Simple optional authentication for testing
def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Get current user if authenticated, otherwise return None."""
    if credentials is None:
        return None
    try:
        from app.auth import verify_jwt_token
        payload = verify_jwt_token(credentials.credentials)
        if payload:
            return {
                "user_id": str(payload.get("sub")),
                "email": payload.get("email"),
                "role": payload.get("role", "authenticated")
            }
    except:
        pass
    return None

# Test endpoint moved to top of file

# Public endpoints without authentication for testing
@router.post("/fetch-public")
async def fetch_market_data_public(request: DataFetchRequest):
    """Fetch market data for a symbol without authentication."""
    try:
        if request.asset_type == "stock":
            return await _fetch_stock_data_public(request)
        elif request.asset_type == "crypto":
            return await _fetch_crypto_data_public(request)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid asset type. Must be 'stock' or 'crypto'"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching market data: {str(e)}"
        )

@router.get("/prices-public/{symbol}")
async def get_price_data_public(symbol: str, asset_type: str, days: int = 30):
    """Get price data for a symbol without authentication."""
    try:
        if asset_type == "stock":
            return await _get_stock_price_data_public(symbol, days)
        elif asset_type == "crypto":
            return await _get_crypto_price_data_public(symbol, days)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid asset type. Must be 'stock' or 'crypto'"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching price data: {str(e)}"
        )

# Initialize Binance client lazily to avoid startup timeouts
binance_client = None

def get_binance_client():
    global binance_client
    if binance_client is None:
        try:
            binance_client = BinanceClient(
                api_key=settings.binance_api_key,
                api_secret=settings.binance_secret_key,
                testnet=False  # Use real Binance API for market data
            )
            print("Binance client initialized successfully")
        except Exception as e:
            print(f"Warning: Could not initialize Binance client: {e}")
            binance_client = None
    return binance_client


@router.post("/fetch")
async def fetch_market_data(
    request: DataFetchRequest,
    # Make authentication optional for testing
    current_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Fetch market data for a symbol and store in database."""
    print(f"🔍 DEBUG: fetch_market_data called with symbol={request.symbol}, asset_type={request.asset_type}")
    print(f"🔍 DEBUG: current_user={current_user}")
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


async def _fetch_stock_data(request: DataFetchRequest, db: Session = None):
    """Fetch stock data using yfinance with improved error handling."""
    try:
        # Calculate start date
        end_date = datetime.now()
        start_date = end_date - timedelta(days=request.days)
        
        print(f"Fetching data for {request.symbol} from {start_date} to {end_date}")
        
        # Fetch data from Yahoo Finance with retry mechanism
        ticker = yf.Ticker(request.symbol)
        
        # Try different methods to get data
        data = None
        try:
            # Method 1: Try with period instead of dates
            data = ticker.history(period="1mo")
            if not data.empty:
                # Filter to requested date range
                data = data[(data.index >= start_date) & (data.index <= end_date)]
        except Exception as e1:
            print(f"Method 1 failed: {e1}")
            try:
                # Method 2: Try with different date format
                data = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
            except Exception as e2:
                print(f"Method 2 failed: {e2}")
                try:
                    # Method 3: Try with just the symbol info
                    info = ticker.info
                    if info and 'regularMarketPrice' in info:
                        # Create a single data point with current price
                        current_price = info['regularMarketPrice']
                        data = pd.DataFrame({
                            'Open': [current_price],
                            'High': [current_price],
                            'Low': [current_price],
                            'Close': [current_price],
                            'Volume': [info.get('volume', 0)]
                        }, index=[datetime.now()])
                    else:
                        raise Exception("No market data available")
                except Exception as e3:
                    print(f"Method 3 failed: {e3}")
                    try:
                        # Method 4: Try with a different approach - get current price
                        current_price = ticker.history(period="1d").iloc[-1]['Close']
                        data = pd.DataFrame({
                            'Open': [current_price],
                            'High': [current_price],
                            'Low': [current_price],
                            'Close': [current_price],
                            'Volume': [1000000]
                        }, index=[datetime.now()])
                    except Exception as e4:
                        print(f"Method 4 failed: {e4}")
                        try:
                            # Method 5: Try with a longer period and filter
                            data = ticker.history(period="3mo")
                            if not data.empty:
                                data = data[(data.index >= start_date) & (data.index <= end_date)]
                        except Exception as e5:
                            print(f"Method 5 failed: {e5}")
                            raise Exception(f"All methods failed. Last error: {e5}")
        
        if data is None or data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for {request.symbol} ({request.asset_type}). Please check the symbol and try again."
            )
        
        print(f"Retrieved {len(data)} data points for {request.symbol}")
        
        # Store data in database if db is provided
        stored_count = 0
        if db is not None:
            for timestamp, row in data.iterrows():
                try:
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
                except Exception as e:
                    print(f"Error storing data point: {e}")
                    continue
            
            db.commit()
        else:
            stored_count = len(data)
        
        return {
            "message": f"Successfully fetched and stored {stored_count} data points for {request.symbol}",
            "symbol": request.symbol,
            "asset_type": request.asset_type,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "data_points": stored_count,
            "data_preview": {
                "first_price": float(data.iloc[0]['Close']),
                "last_price": float(data.iloc[-1]['Close']),
                "price_change": float(data.iloc[-1]['Close'] - data.iloc[0]['Close']),
                "previous_close": float(data.iloc[-2]['Close']) if len(data) > 1 else float(data.iloc[-1]['Close']),
                "change_percent": float((data.iloc[-1]['Close'] - data.iloc[-2]['Close']) / data.iloc[-2]['Close'] * 100) if len(data) > 1 else 0.0,
                "volume": float(data.iloc[-1]['Volume']),
                "high": float(data.iloc[-1]['High']),
                "low": float(data.iloc[-1]['Low']),
                "open": float(data.iloc[-1]['Open']),
                "market_cap": None  # Not available from yfinance directly
            }
        }
    except Exception as e:
        print(f"Error in _fetch_stock_data: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stock data: {str(e)}"
        )


async def _fetch_crypto_data(request: DataFetchRequest, db: Session = None):
    """Fetch crypto data using Binance API with improved error handling."""
    try:
        # Calculate start and end timestamps
        end_time = int(datetime.now().timestamp() * 1000)
        start_time = int((datetime.now() - timedelta(days=request.days)).timestamp() * 1000)
        
        print(f"Fetching crypto data for {request.symbol} from {start_time} to {end_time}")
        
        # Try different symbol formats
        symbols_to_try = [
            request.symbol.upper() + "USDT",
            request.symbol.upper() + "BTC",
            request.symbol.upper()
        ]
        
        klines = None
        for symbol in symbols_to_try:
            try:
                print(f"Trying symbol: {symbol}")
                client = get_binance_client()
                if client is None:
                    raise Exception("Binance client not available")
                    
                klines = client.get_historical_klines(
                    symbol=symbol,
                    interval="1d",
                    start_str=start_time,
                    end_str=end_time
                )
                if klines:
                    print(f"Successfully fetched data for {symbol}")
                    break
            except Exception as e:
                print(f"Failed to fetch data for {symbol}: {e}")
                continue
        
        if not klines:
            raise HTTPException(
                status_code=404,
                detail=f"No crypto data available for {request.symbol}. Please check the symbol and try again."
            )
        
        print(f"Retrieved {len(klines)} data points for {request.symbol}")
        
        # Store data in database if db is provided
        stored_count = 0
        if db is not None:
            for kline in klines:
                try:
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
                except Exception as e:
                    print(f"Error storing crypto data point: {e}")
                    continue
            
            db.commit()
        else:
            stored_count = len(klines)
        
        # Calculate data preview
        last_kline = klines[-1] if klines else None
        second_last_kline = klines[-2] if len(klines) > 1 else last_kline
        
        data_preview = {
            "first_price": float(klines[0][4]) if klines else 0.0,  # Close price
            "last_price": float(last_kline[4]) if last_kline else 0.0,
            "price_change": float(last_kline[4]) - float(klines[0][4]) if klines and last_kline else 0.0,
            "previous_close": float(second_last_kline[4]) if second_last_kline else float(last_kline[4]) if last_kline else 0.0,
            "change_percent": ((float(last_kline[4]) - float(second_last_kline[4])) / float(second_last_kline[4]) * 100) if second_last_kline and float(second_last_kline[4]) > 0 else 0.0,
            "volume": float(last_kline[5]) if last_kline else 0.0,
            "high": float(last_kline[2]) if last_kline else 0.0,
            "low": float(last_kline[3]) if last_kline else 0.0,
            "open": float(last_kline[1]) if last_kline else 0.0,
            "market_cap": None  # Not available from Binance klines
        }
        
        return {
            "message": f"Successfully fetched and stored {stored_count} data points for {request.symbol}",
            "symbol": request.symbol,
            "asset_type": request.asset_type,
            "start_date": datetime.fromtimestamp(start_time / 1000).isoformat(),
            "end_date": datetime.fromtimestamp(end_time / 1000).isoformat(),
            "data_points": stored_count,
            "data_preview": data_preview
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
    # Make authentication optional for testing
    current_user: Optional[dict] = Depends(get_optional_user),
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


# Public helper functions without database dependency
async def _fetch_stock_data_public(request: DataFetchRequest):
    """Fetch stock data without database storage."""
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stock data: {str(e)}"
        )

async def _fetch_crypto_data_public(request: DataFetchRequest):
    """Fetch crypto data without database storage."""
    try:
        # Use yfinance for crypto data too
        ticker = yf.Ticker(f"{request.symbol}-USD")
        hist = ticker.history(period=f"{request.days}d")
        
        if hist.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No data found for crypto symbol {request.symbol}"
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching crypto data: {str(e)}"
        )

async def _get_stock_price_data_public(symbol: str, days: int):
    """Get stock price data without database."""
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stock price data: {str(e)}"
        )

async def _get_crypto_price_data_public(symbol: str, days: int):
    """Get crypto price data without database."""
    try:
        ticker = yf.Ticker(f"{symbol}-USD")
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching crypto price data: {str(e)}"
        )
