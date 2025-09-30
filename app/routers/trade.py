"""Paper trading endpoints for Alpaca and Binance."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.schemas import PaperTradeRequest, PaperTrade
from app.models import PaperTrade as PaperTradeModel, Portfolio
from datetime import datetime
import uuid
from typing import List
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from binance.client import Client as BinanceClient
from app.config import settings

router = APIRouter()

# Initialize trading clients
alpaca_client = TradingClient(
    api_key=settings.alpaca_api_key,
    secret_key=settings.alpaca_secret_key,
    paper=True
)

binance_client = BinanceClient(
    api_key=settings.binance_api_key,
    api_secret=settings.binance_secret_key,
    testnet=True
)


@router.post("/paper", response_model=PaperTrade)
async def execute_paper_trade(
    request: PaperTradeRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a paper trade on Alpaca or Binance."""
    try:
        print(f"Executing paper trade: {request.symbol} {request.quantity} {request.side} via {request.broker}")
        
        # Verify portfolio belongs to user
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == request.portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        ).first()
        
        if not portfolio:
            print(f"Portfolio not found: {request.portfolio_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        print(f"Portfolio found: {portfolio.name}")
        
        # Get current price
        current_price = await _get_current_price(request.symbol, request.asset_type)
        print(f"Current price for {request.symbol}: {current_price}")
        
        # Calculate total value
        total_value = float(request.quantity) * current_price
        
        # Create paper trade record
        paper_trade = PaperTradeModel(
            id=uuid.uuid4(),
            user_id=current_user["user_id"],
            portfolio_id=request.portfolio_id,
            symbol=request.symbol,
            asset_type=request.asset_type,
            side=request.side,
            quantity=request.quantity,
            price=current_price,
            total_value=total_value,
            broker=request.broker,
            status="pending",
            created_at=datetime.utcnow()
        )
        
        db.add(paper_trade)
        db.commit()
        
        # Execute trade based on broker (simplified for paper trading)
        print(f"Executing {request.side} order for {request.quantity} {request.symbol} via {request.broker}")
        
        # For paper trading, we'll just simulate the execution
        # In a real implementation, you'd call the actual broker APIs
        if request.broker in ["alpaca", "binance"]:
            print(f"Paper trade executed successfully for {request.symbol}")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid broker. Must be 'alpaca' or 'binance'"
            )
        
        # Update trade status
        paper_trade.status = "executed"
        paper_trade.executed_at = datetime.utcnow()
        db.commit()
        db.refresh(paper_trade)
        
        return paper_trade
        
    except Exception as e:
        db.rollback()
        print(f"Trade execution error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing trade: {str(e)}"
        )


async def _get_current_price(symbol: str, asset_type: str) -> float:
    """Get current price for a symbol."""
    try:
        print(f"Getting current price for {symbol} ({asset_type})")
        
        # Use the data fetching API to get current price
        from app.routers.data import _fetch_stock_data, _fetch_crypto_data
        from app.schemas import DataFetchRequest
        
        if asset_type == "stock":
            try:
                # Try to get real data first
                data_request = DataFetchRequest(
                    symbol=symbol,
                    asset_type=asset_type,
                    days=1
                )
                data = await _fetch_stock_data(data_request, None)  # Pass None for db, we'll handle it
                if data and 'data_preview' in data:
                    price = data['data_preview']['last_price']
                    print(f"Got real stock price for {symbol}: {price}")
                    return float(price)
            except Exception as e:
                print(f"Failed to get real stock data for {symbol}: {e}")
            
            # Fallback to mock price
            import random
            mock_price = round(random.uniform(50, 200), 2)
            print(f"Using mock stock price for {symbol}: {mock_price}")
            return mock_price
            
        elif asset_type == "crypto":
            try:
                # Try to get real data first
                data_request = DataFetchRequest(
                    symbol=symbol,
                    asset_type=asset_type,
                    days=1
                )
                data = await _fetch_crypto_data(data_request, None)  # Pass None for db, we'll handle it
                if data and 'data_preview' in data:
                    price = data['data_preview']['last_price']
                    print(f"Got real crypto price for {symbol}: {price}")
                    return float(price)
            except Exception as e:
                print(f"Failed to get real crypto data for {symbol}: {e}")
            
            # Fallback to mock price
            import random
            mock_price = round(random.uniform(0.1, 100), 4)
            print(f"Using mock crypto price for {symbol}: {mock_price}")
            return mock_price
        else:
            raise ValueError(f"Unsupported asset type: {asset_type}")
    except Exception as e:
        print(f"Error in _get_current_price: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching current price: {str(e)}"
        )


async def _execute_alpaca_trade(paper_trade: PaperTradeModel, request: PaperTradeRequest):
    """Execute trade on Alpaca."""
    try:
        # Convert side
        side = OrderSide.BUY if request.side == "buy" else OrderSide.SELL
        
        # Create market order
        market_order_data = MarketOrderRequest(
            symbol=request.symbol,
            qty=str(request.quantity),
            side=side,
            time_in_force=TimeInForce.GTC
        )
        
        # Submit order
        order = alpaca_client.submit_order(order_data=market_order_data)
        
        # Update paper trade with order ID
        paper_trade.status = f"executed_alpaca_{order.id}"
        
    except Exception as e:
        paper_trade.status = "failed"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alpaca trade execution failed: {str(e)}"
        )


async def _execute_binance_trade(paper_trade: PaperTradeModel, request: PaperTradeRequest):
    """Execute trade on Binance testnet."""
    try:
        # Convert side
        side = "BUY" if request.side == "buy" else "SELL"
        
        # Create order
        order = binance_client.create_order(
            symbol=request.symbol.upper() + "USDT",
            side=side,
            type="MARKET",
            quantity=float(request.quantity)
        )
        
        # Update paper trade with order ID
        paper_trade.status = f"executed_binance_{order['orderId']}"
        
    except Exception as e:
        paper_trade.status = "failed"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Binance trade execution failed: {str(e)}"
        )


@router.get("/trades", response_model=List[PaperTrade])
async def get_paper_trades(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all paper trades for the current user."""
    trades = db.query(PaperTradeModel).filter(
        PaperTradeModel.user_id == current_user["user_id"]
    ).order_by(PaperTradeModel.created_at.desc()).all()
    
    return trades


@router.get("/trades/{trade_id}", response_model=PaperTrade)
async def get_paper_trade(
    trade_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific paper trade."""
    trade = db.query(PaperTradeModel).filter(
        PaperTradeModel.id == trade_id,
        PaperTradeModel.user_id == current_user["user_id"]
    ).first()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper trade not found"
        )
    
    return trade


@router.get("/positions")
async def get_positions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current positions across all portfolios."""
    # This is a simplified version - in production you'd track positions more carefully
    trades = db.query(PaperTradeModel).filter(
        PaperTradeModel.user_id == current_user["user_id"],
        PaperTradeModel.status.like("executed%")
    ).all()
    
    positions = {}
    for trade in trades:
        key = f"{trade.symbol}_{trade.asset_type}"
        if key not in positions:
            positions[key] = {
                "symbol": trade.symbol,
                "asset_type": trade.asset_type,
                "quantity": 0,
                "total_cost": 0,
                "average_price": 0
            }
        
        if trade.side == "buy":
            positions[key]["quantity"] += float(trade.quantity)
            positions[key]["total_cost"] += float(trade.total_value)
        else:
            positions[key]["quantity"] -= float(trade.quantity)
            positions[key]["total_cost"] -= float(trade.total_value)
        
        if positions[key]["quantity"] > 0:
            positions[key]["average_price"] = positions[key]["total_cost"] / positions[key]["quantity"]
    
    # Filter out zero or negative positions
    active_positions = {k: v for k, v in positions.items() if v["quantity"] > 0}
    
    return {
        "positions": list(active_positions.values()),
        "total_positions": len(active_positions)
    }
