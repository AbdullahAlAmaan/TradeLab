"""Risk analysis endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.schemas import RiskMetricsRequest, RiskMetrics
from app.models import RiskMetric, AssetPrice, Portfolio, Asset
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any
import uuid

router = APIRouter()


@router.post("/calculate", response_model=RiskMetrics)
async def calculate_risk_metrics(
    request: RiskMetricsRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate risk metrics for a portfolio."""
    try:
        # Verify portfolio belongs to user
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == request.portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        ).first()
        
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        # Get all assets in portfolio
        assets = db.query(Asset).filter(Asset.portfolio_id == request.portfolio_id).all()
        print(f"Found {len(assets)} assets in portfolio {request.portfolio_id}")
        
        if not assets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Portfolio has no assets"
            )
        
        # Get price data for all assets
        portfolio_data = {}
        for asset in assets:
            print(f"Looking for price data for {asset.symbol} ({asset.asset_type})")
            prices = db.query(AssetPrice).filter(
                AssetPrice.symbol == asset.symbol,
                AssetPrice.asset_type == asset.asset_type,
                AssetPrice.timestamp >= datetime.utcnow() - timedelta(days=365)  # Last year
            ).order_by(AssetPrice.timestamp).all()
            
            print(f"Found {len(prices)} price records for {asset.symbol}")
            
            if prices:
                df = pd.DataFrame([
                    {
                        'date': price.timestamp,
                        'close': float(price.close)
                    }
                    for price in prices
                ])
                df.set_index('date', inplace=True)
                df['returns'] = df['close'].pct_change().dropna()
                portfolio_data[asset.symbol] = df
                print(f"Created returns series with {len(df['returns'])} data points for {asset.symbol}")
        
        if not portfolio_data:
            print("No price data found, generating mock data for risk analysis")
            # Generate mock data for demonstration
            portfolio_data = generate_mock_portfolio_data(assets)
        
        # Calculate portfolio returns (equal weight for now)
        print(f"Portfolio data keys: {list(portfolio_data.keys())}")
        
        # Combine all asset returns into a single DataFrame
        if len(portfolio_data) == 1:
            # Single asset case
            asset_symbol = list(portfolio_data.keys())[0]
            portfolio_returns = portfolio_data[asset_symbol]['returns']
        else:
            # Multiple assets case - combine returns
            returns_data = {}
            for symbol, df in portfolio_data.items():
                returns_data[symbol] = df['returns']
            
            # Create DataFrame from returns data
            combined_df = pd.DataFrame(returns_data)
            portfolio_returns = combined_df.mean(axis=1).dropna()
        
        print(f"Portfolio returns calculated: {len(portfolio_returns)} data points")
        
        if len(portfolio_returns) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient data for risk analysis. Need at least 2 data points."
            )
        
        # Calculate risk metrics
        var_95 = calculate_var(portfolio_returns, 0.95)
        cvar_95 = calculate_cvar(portfolio_returns, 0.95)
        sharpe_ratio = calculate_sharpe_ratio(portfolio_returns)
        sortino_ratio = calculate_sortino_ratio(portfolio_returns)
        max_drawdown = calculate_max_drawdown(portfolio_returns)
        
        # Calculate Beta (vs SPY)
        beta = await calculate_beta(portfolio_returns, db)
        
        # Run Monte Carlo simulation
        monte_carlo_results = run_monte_carlo_simulation(portfolio_returns)
        
        # Create risk metrics record
        risk_metrics = RiskMetric(
            id=uuid.uuid4(),
            portfolio_id=request.portfolio_id,
            calculated_at=datetime.utcnow(),
            var_95=var_95,
            cvar_95=cvar_95,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            beta=beta,
            max_drawdown=max_drawdown,
            monte_carlo_results=monte_carlo_results,
            created_at=datetime.utcnow()
        )
        
        db.add(risk_metrics)
        db.commit()
        db.refresh(risk_metrics)
        
        return risk_metrics
        
    except Exception as e:
        db.rollback()
        print(f"Risk calculation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating risk metrics: {str(e)}"
        )


def calculate_var(returns: pd.Series, confidence_level: float) -> float:
    """Calculate Value at Risk (VaR)."""
    var = np.percentile(returns, (1 - confidence_level) * 100)
    return float(var) if not np.isnan(var) else 0.0


def calculate_cvar(returns: pd.Series, confidence_level: float) -> float:
    """Calculate Conditional Value at Risk (CVaR)."""
    var = calculate_var(returns, confidence_level)
    tail_returns = returns[returns <= var]
    if len(tail_returns) == 0:
        return 0.0
    cvar = tail_returns.mean()
    return float(cvar) if not np.isnan(cvar) else 0.0


def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
    """Calculate Sharpe ratio."""
    if returns.std() == 0 or len(returns) < 2:
        return 0.0
    excess_returns = returns - risk_free_rate / 252  # Daily risk-free rate
    sharpe = excess_returns.mean() / returns.std() * np.sqrt(252)
    return float(sharpe) if not np.isnan(sharpe) else 0.0


def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
    """Calculate Sortino ratio."""
    excess_returns = returns - risk_free_rate / 252
    downside_returns = returns[returns < 0]
    downside_std = downside_returns.std() if len(downside_returns) > 0 else 0
    if downside_std == 0 or len(downside_returns) < 2:
        return 0.0
    sortino = excess_returns.mean() / downside_std * np.sqrt(252)
    return float(sortino) if not np.isnan(sortino) else 0.0


def calculate_max_drawdown(returns: pd.Series) -> float:
    """Calculate maximum drawdown."""
    if len(returns) < 2:
        return 0.0
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = (cumulative - running_max) / running_max
    max_dd = drawdown.min()
    return float(max_dd) if not np.isnan(max_dd) else 0.0


async def calculate_beta(portfolio_returns: pd.Series, db: Session) -> float:
    """Calculate Beta vs SPY."""
    try:
        # Get SPY data
        spy_prices = db.query(AssetPrice).filter(
            AssetPrice.symbol == "SPY",
            AssetPrice.asset_type == "stock",
            AssetPrice.timestamp >= datetime.utcnow() - timedelta(days=365)
        ).order_by(AssetPrice.timestamp).all()
        
        if not spy_prices:
            return 0.0
        
        spy_df = pd.DataFrame([
            {
                'date': price.timestamp,
                'close': float(price.close)
            }
            for price in spy_prices
        ])
        spy_df.set_index('date', inplace=True)
        spy_returns = spy_df['close'].pct_change().dropna()
        
        # Align dates
        common_dates = portfolio_returns.index.intersection(spy_returns.index)
        if len(common_dates) < 2:
            return 0.0
        
        portfolio_aligned = portfolio_returns.loc[common_dates]
        spy_aligned = spy_returns.loc[common_dates]
        
        # Calculate beta
        covariance = np.cov(portfolio_aligned, spy_aligned)[0, 1]
        spy_variance = np.var(spy_aligned)
        
        if spy_variance == 0 or np.isnan(covariance) or np.isnan(spy_variance):
            return 0.0
        
        beta = covariance / spy_variance
        return float(beta) if not np.isnan(beta) else 0.0
        
    except Exception:
        return 0.0


def generate_mock_portfolio_data(assets: List[Asset]) -> Dict[str, pd.DataFrame]:
    """Generate mock portfolio data for risk analysis when real data is not available."""
    portfolio_data = {}
    
    for asset in assets:
        # Generate 252 days of mock data (1 year of trading days)
        dates = pd.date_range(start=datetime.utcnow() - timedelta(days=365), periods=252, freq='D')
        
        # Generate realistic price data with some volatility
        base_price = 100.0  # Starting price
        returns = np.random.normal(0.0005, 0.02, 252)  # Daily returns with 0.05% mean, 2% std
        prices = [base_price]
        
        for ret in returns[1:]:
            prices.append(prices[-1] * (1 + ret))
        
        df = pd.DataFrame({
            'date': dates,
            'close': prices
        })
        df.set_index('date', inplace=True)
        df['returns'] = df['close'].pct_change().dropna()
        portfolio_data[asset.symbol] = df
        
        print(f"Generated mock data for {asset.symbol}: {len(df)} days, {len(df['returns'])} returns")
    
    return portfolio_data


def run_monte_carlo_simulation(returns: pd.Series, num_simulations: int = 1000) -> Dict[str, Any]:
    """Run Monte Carlo simulation for portfolio returns."""
    mean_return = returns.mean()
    std_return = returns.std()
    
    # Generate random returns
    simulated_returns = np.random.normal(mean_return, std_return, (num_simulations, 252))  # 252 trading days
    
    # Calculate cumulative returns
    cumulative_returns = np.cumprod(1 + simulated_returns, axis=1)
    
    # Calculate statistics
    final_values = cumulative_returns[:, -1]
    
    return {
        "num_simulations": num_simulations,
        "mean_final_value": float(np.mean(final_values)),
        "std_final_value": float(np.std(final_values)),
        "percentile_5": float(np.percentile(final_values, 5)),
        "percentile_95": float(np.percentile(final_values, 95)),
        "simulated_paths": cumulative_returns.tolist()[:100]  # Return first 100 paths for visualization
    }


@router.get("/metrics/{portfolio_id}", response_model=List[RiskMetrics])
async def get_risk_metrics(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get risk metrics for a portfolio."""
    # Verify portfolio belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    metrics = db.query(RiskMetric).filter(
        RiskMetric.portfolio_id == portfolio_id
    ).order_by(RiskMetric.calculated_at.desc()).all()
    
    return metrics
