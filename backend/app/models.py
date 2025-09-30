"""SQLAlchemy models for the TradeLab database."""

from sqlalchemy import Column, String, DateTime, Numeric, Integer, Boolean, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Portfolio(Base):
    """Portfolio model."""
    __tablename__ = "portfolios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    assets = relationship("Asset", back_populates="portfolio", cascade="all, delete-orphan")


class Asset(Base):
    """Asset model."""
    __tablename__ = "assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    asset_type = Column(String(10), nullable=False)  # 'stock' or 'crypto'
    name = Column(String(255), nullable=False)
    exchange = Column(String(50))
    quantity = Column(Numeric(20, 8), nullable=False, default=1)  # Number of shares/units
    purchase_price = Column(Numeric(20, 8), nullable=False, default=0)  # Purchase price per unit
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="assets")


class AssetPrice(Base):
    """Asset price model (OHLC data)."""
    __tablename__ = "asset_prices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), nullable=False)
    asset_type = Column(String(10), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    open = Column(Numeric(20, 8), nullable=False)
    high = Column(Numeric(20, 8), nullable=False)
    low = Column(Numeric(20, 8), nullable=False)
    close = Column(Numeric(20, 8), nullable=False)
    volume = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)


class Strategy(Base):
    """Trading strategy model."""
    __tablename__ = "strategies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(255), nullable=False)
    strategy_type = Column(String(50), nullable=False)
    parameters = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)


class BacktestResult(Base):
    """Backtest result model."""
    __tablename__ = "backtest_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id"))
    symbol = Column(String(20), nullable=False)
    asset_type = Column(String(10), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    initial_capital = Column(Numeric(20, 2), nullable=False)
    final_capital = Column(Numeric(20, 2), nullable=False)
    total_return = Column(Numeric(10, 4), nullable=False)
    sharpe_ratio = Column(Numeric(10, 4))
    max_drawdown = Column(Numeric(10, 4))
    win_rate = Column(Numeric(10, 4))
    total_trades = Column(Integer, nullable=False)
    equity_curve = Column(JSON, nullable=False)
    trades = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)


class PaperTrade(Base):
    """Paper trade model."""
    __tablename__ = "paper_trades"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"))
    symbol = Column(String(20), nullable=False)
    asset_type = Column(String(10), nullable=False)
    side = Column(String(4), nullable=False)  # 'buy' or 'sell'
    quantity = Column(Numeric(20, 8), nullable=False)
    price = Column(Numeric(20, 8), nullable=False)
    total_value = Column(Numeric(20, 2), nullable=False)
    broker = Column(String(20), nullable=False)  # 'alpaca' or 'binance'
    status = Column(String(20), default="pending")
    executed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False)


class RiskMetric(Base):
    """Risk metric model."""
    __tablename__ = "risk_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"))
    calculated_at = Column(DateTime(timezone=True), nullable=False)
    var_95 = Column(Numeric(10, 4))
    cvar_95 = Column(Numeric(10, 4))
    sharpe_ratio = Column(Numeric(10, 4))
    sortino_ratio = Column(Numeric(10, 4))
    beta = Column(Numeric(10, 4))
    max_drawdown = Column(Numeric(10, 4))
    monte_carlo_results = Column(JSON)
    created_at = Column(DateTime(timezone=True), nullable=False)

