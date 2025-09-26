"""Backtesting endpoints using Backtrader."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.schemas import BacktestRequest, BacktestResult
from app.models import BacktestResult as BacktestResultModel, AssetPrice
from datetime import datetime
import backtrader as bt
import pandas as pd
import numpy as np
from typing import List, Dict, Any
import uuid

router = APIRouter()


class MovingAverageCrossoverStrategy(bt.Strategy):
    """Moving Average Crossover Strategy for Backtrader."""
    
    params = (
        ('short_window', 10),
        ('long_window', 30),
    )
    
    def __init__(self):
        self.short_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.short_window
        )
        self.long_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.long_window
        )
        self.crossover = bt.indicators.CrossOver(self.short_ma, self.long_ma)
        self.trades = []
        self.equity_curve = []
    
    def next(self):
        """Called for each bar."""
        # Record equity curve
        self.equity_curve.append({
            'date': self.data.datetime.date(0).isoformat(),
            'equity': self.broker.getvalue()
        })
        
        if not self.position:
            if self.crossover > 0:  # Short MA crosses above Long MA
                self.buy()
        else:
            if self.crossover < 0:  # Short MA crosses below Long MA
                self.sell()
    
    def notify_order(self, order):
        """Called when order status changes."""
        if order.status in [order.Completed]:
            if order.isbuy():
                self.trades.append({
                    'date': self.data.datetime.date(0).isoformat(),
                    'type': 'buy',
                    'price': order.executed.price,
                    'size': order.executed.size,
                    'value': order.executed.price * order.executed.size
                })
            else:
                self.trades.append({
                    'date': self.data.datetime.date(0).isoformat(),
                    'type': 'sell',
                    'price': order.executed.price,
                    'size': order.executed.size,
                    'value': order.executed.price * order.executed.size
                })


@router.post("/run", response_model=BacktestResult)
async def run_backtest(
    request: BacktestRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run a backtest for the given parameters."""
    try:
        # Get price data from database
        prices = db.query(AssetPrice).filter(
            AssetPrice.symbol == request.symbol,
            AssetPrice.asset_type == request.asset_type,
            AssetPrice.timestamp >= request.start_date,
            AssetPrice.timestamp <= request.end_date
        ).order_by(AssetPrice.timestamp).all()
        
        if not prices:
            # Try to fetch data first
            try:
                from app.routers.data import _fetch_stock_data, _fetch_crypto_data
                from app.schemas import DataFetchRequest
                
                # Create a mock request for data fetching
                data_request = DataFetchRequest(
                    symbol=request.symbol,
                    asset_type=request.asset_type,
                    days=30
                )
                
                if request.asset_type == 'stock':
                    await _fetch_stock_data(data_request, db)
                else:
                    await _fetch_crypto_data(data_request, db)
                
                # Try to get prices again
                prices = db.query(AssetPrice).filter(
                    AssetPrice.symbol == request.symbol,
                    AssetPrice.asset_type == request.asset_type,
                    AssetPrice.timestamp >= request.start_date,
                    AssetPrice.timestamp <= request.end_date
                ).order_by(AssetPrice.timestamp).all()
                
            except Exception as e:
                print(f"Error fetching data: {e}")
            
            if not prices:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No price data found for {request.symbol}. Please fetch data first from the Dashboard."
                )
        
        # Convert to pandas DataFrame
        df = pd.DataFrame([
            {
                'datetime': price.timestamp,
                'open': float(price.open),
                'high': float(price.high),
                'low': float(price.low),
                'close': float(price.close),
                'volume': price.volume
            }
            for price in prices
        ])
        df.set_index('datetime', inplace=True)
        
        # Create Backtrader cerebro engine
        cerebro = bt.Cerebro()
        
        # Add data feed
        data_feed = bt.feeds.PandasData(
            dataname=df,
            datetime=None,
            open='open',
            high='high',
            low='low',
            close='close',
            volume='volume',
            openinterest=None
        )
        cerebro.adddata(data_feed)
        
        # Add strategy
        cerebro.addstrategy(
            MovingAverageCrossoverStrategy,
            short_window=request.short_window,
            long_window=request.long_window
        )
        
        # Set initial capital
        cerebro.broker.setcash(float(request.initial_capital))
        
        # Add commission
        cerebro.broker.setcommission(commission=0.001)  # 0.1% commission
        
        # Run backtest
        cerebro.run()
        
        # Get results
        final_value = cerebro.broker.getvalue()
        total_return = (final_value - float(request.initial_capital)) / float(request.initial_capital)
        
        # Calculate additional metrics
        trades = []
        equity_curve = []
        
        try:
            if hasattr(cerebro, 'runstrats') and len(cerebro.runstrats) > 0 and len(cerebro.runstrats[0]) > 0:
                strategy_instance = cerebro.runstrats[0][0]
                trades = getattr(strategy_instance, 'trades', [])
                equity_curve = getattr(strategy_instance, 'equity_curve', [])
        except (IndexError, AttributeError) as e:
            print(f"Warning: Could not access strategy instance: {e}")
            # Create mock data for demonstration
            trades = []
            equity_curve = [{'date': request.start_date.isoformat(), 'equity': float(request.initial_capital)}]
        
        # Calculate Sharpe ratio
        if len(equity_curve) > 1:
            returns = pd.Series([eq['equity'] for eq in equity_curve]).pct_change().dropna()
            sharpe_ratio = returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0
        else:
            sharpe_ratio = 0
        
        # Calculate max drawdown
        equity_values = [eq['equity'] for eq in equity_curve]
        max_drawdown = 0
        if len(equity_values) > 0:
            peak = equity_values[0]
            for value in equity_values:
                if value > peak:
                    peak = value
                drawdown = (peak - value) / peak
                max_drawdown = max(max_drawdown, drawdown)
        
        # Calculate win rate
        buy_trades = [t for t in trades if t.get('type') == 'buy']
        sell_trades = [t for t in trades if t.get('type') == 'sell']
        total_trades = min(len(buy_trades), len(sell_trades))
        winning_trades = 0
        
        if total_trades > 0:
            for i in range(total_trades):
                try:
                    if sell_trades[i].get('price', 0) > buy_trades[i].get('price', 0):
                        winning_trades += 1
                except (IndexError, KeyError):
                    continue
        
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        # Create backtest result
        backtest_result = BacktestResultModel(
            id=uuid.uuid4(),
            user_id=current_user["user_id"],
            symbol=request.symbol,
            asset_type=request.asset_type,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            final_capital=final_value,
            total_return=total_return,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            win_rate=win_rate,
            total_trades=total_trades,
            equity_curve=equity_curve,
            trades=trades,
            created_at=datetime.utcnow()
        )
        
        db.add(backtest_result)
        db.commit()
        db.refresh(backtest_result)
        
        return backtest_result
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running backtest: {str(e)}"
        )


@router.get("/results", response_model=List[BacktestResult])
async def get_backtest_results(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all backtest results for the current user."""
    results = db.query(BacktestResultModel).filter(
        BacktestResultModel.user_id == current_user["user_id"]
    ).order_by(BacktestResultModel.created_at.desc()).all()
    
    return results


@router.get("/results/{result_id}", response_model=BacktestResult)
async def get_backtest_result(
    result_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific backtest result."""
    result = db.query(BacktestResultModel).filter(
        BacktestResultModel.id == result_id,
        BacktestResultModel.user_id == current_user["user_id"]
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backtest result not found"
        )
    
    return result
