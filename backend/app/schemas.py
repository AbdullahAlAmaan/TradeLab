"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from uuid import UUID


# Base schemas
class PortfolioBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None


class Portfolio(PortfolioBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Asset schemas
class AssetBase(BaseModel):
    symbol: str = Field(..., max_length=20)
    asset_type: str = Field(..., pattern="^(stock|crypto)$")
    name: str = Field(..., max_length=255)
    exchange: Optional[str] = Field(None, max_length=50)
    quantity: Optional[Decimal] = Field(1, ge=0)
    purchase_price: Optional[Decimal] = Field(0, ge=0)


class AssetCreate(AssetBase):
    portfolio_id: UUID


class AssetUpdate(BaseModel):
    symbol: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=255)
    exchange: Optional[str] = Field(None, max_length=50)


class Asset(AssetBase):
    id: UUID
    portfolio_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Asset price schemas
class AssetPriceBase(BaseModel):
    symbol: str = Field(..., max_length=20)
    asset_type: str = Field(..., pattern="^(stock|crypto)$")
    timestamp: datetime
    open: Decimal = Field(..., decimal_places=8)
    high: Decimal = Field(..., decimal_places=8)
    low: Decimal = Field(..., decimal_places=8)
    close: Decimal = Field(..., decimal_places=8)
    volume: int


class AssetPriceCreate(AssetPriceBase):
    pass


class AssetPrice(AssetPriceBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Strategy schemas
class StrategyBase(BaseModel):
    name: str = Field(..., max_length=255)
    strategy_type: str = Field(..., max_length=50)
    parameters: Dict[str, Any]
    is_active: bool = True


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class Strategy(StrategyBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Backtest schemas
class BacktestRequest(BaseModel):
    symbol: str = Field(..., max_length=20)
    asset_type: str = Field(..., pattern="^(stock|crypto)$")
    start_date: datetime
    end_date: datetime
    short_window: int = Field(..., ge=1, le=100)
    long_window: int = Field(..., ge=1, le=500)
    initial_capital: Decimal = Field(..., decimal_places=2)


class BacktestResult(BaseModel):
    id: UUID
    user_id: UUID
    strategy_id: Optional[UUID]
    symbol: str
    asset_type: str
    start_date: datetime
    end_date: datetime
    initial_capital: Decimal
    final_capital: Decimal
    total_return: Decimal
    sharpe_ratio: Optional[Decimal]
    max_drawdown: Optional[Decimal]
    win_rate: Optional[Decimal]
    total_trades: int
    equity_curve: List[Dict[str, Any]]
    trades: List[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Paper trade schemas
class PaperTradeRequest(BaseModel):
    portfolio_id: UUID
    symbol: str = Field(..., max_length=20)
    asset_type: str = Field(..., pattern="^(stock|crypto)$")
    side: str = Field(..., pattern="^(buy|sell)$")
    quantity: Decimal = Field(..., decimal_places=8, gt=0)
    broker: str = Field(..., pattern="^(alpaca|binance)$")


class PaperTrade(BaseModel):
    id: UUID
    user_id: UUID
    portfolio_id: UUID
    symbol: str
    asset_type: str
    side: str
    quantity: Decimal
    price: Decimal
    total_value: Decimal
    broker: str
    status: str
    executed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Risk metrics schemas
class RiskMetricsRequest(BaseModel):
    portfolio_id: UUID


class RiskMetrics(BaseModel):
    id: UUID
    portfolio_id: UUID
    calculated_at: datetime
    var_95: Optional[Decimal]
    cvar_95: Optional[Decimal]
    sharpe_ratio: Optional[Decimal]
    sortino_ratio: Optional[Decimal]
    beta: Optional[Decimal]
    max_drawdown: Optional[Decimal]
    monte_carlo_results: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Data fetching schemas
class DataFetchRequest(BaseModel):
    symbol: str = Field(..., max_length=20)
    asset_type: str = Field(..., pattern="^(stock|crypto)$")
    days: int = Field(90, ge=1, le=365)


# Health check schema
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0"

