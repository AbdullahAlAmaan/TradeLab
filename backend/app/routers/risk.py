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
                status_code=400,
                detail="Portfolio has no assets. Please add assets to your portfolio before running risk analysis."
            )
        else:
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
                raise HTTPException(
                    status_code=400,
                    detail="No price data available for portfolio assets. Please ensure assets have recent price data."
                )
        
        
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
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
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


@router.get("/correlation/{portfolio_id}")
async def get_correlation_matrix(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get correlation matrix for portfolio assets."""
    try:
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
        
        # Get all assets in portfolio
        assets = db.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
        
        if len(assets) < 2:
            return {
                "message": "Need at least 2 assets to calculate correlation",
                "assets": len(assets)
            }
        
        # Get price data for all assets
        returns_data = {}
        for asset in assets:
            prices = db.query(AssetPrice).filter(
                AssetPrice.symbol == asset.symbol,
                AssetPrice.asset_type == asset.asset_type,
                AssetPrice.timestamp >= datetime.utcnow() - timedelta(days=365)
            ).order_by(AssetPrice.timestamp).all()
            
            if prices:
                df = pd.DataFrame([
                    {
                        'date': price.timestamp,
                        'close': float(price.close)
                    }
                    for price in prices
                ])
                df.set_index('date', inplace=True)
                returns = df['close'].pct_change().dropna()
                returns_data[asset.symbol] = returns
        
        if len(returns_data) < 2:
            return {
                "message": "Insufficient price data for correlation analysis",
                "assets_with_data": len(returns_data)
            }
        
        # Create returns DataFrame
        returns_df = pd.DataFrame(returns_data)
        returns_df = returns_df.dropna()
        
        # Calculate correlation matrix
        correlation_matrix = returns_df.corr()
        
        # Convert to serializable format
        correlation_data = {}
        for symbol1 in correlation_matrix.columns:
            correlation_data[symbol1] = {}
            for symbol2 in correlation_matrix.columns:
                correlation_data[symbol1][symbol2] = float(correlation_matrix.loc[symbol1, symbol2])
        
        # Calculate diversification metrics
        avg_correlation = correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].mean()
        max_correlation = correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].max()
        min_correlation = correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].min()
        
        return {
            "correlation_matrix": correlation_data,
            "diversification_metrics": {
                "average_correlation": float(avg_correlation),
                "maximum_correlation": float(max_correlation),
                "minimum_correlation": float(min_correlation),
                "diversification_score": float(1 - avg_correlation)  # Higher is better
            },
            "assets": list(returns_data.keys()),
            "data_points": len(returns_df),
            "calculated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating correlation matrix: {str(e)}"
        )


@router.get("/stress-test/{portfolio_id}")
async def portfolio_stress_test(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run stress testing scenarios on portfolio."""
    try:
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
        
        # Get portfolio assets and their price data
        assets = db.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
        
        portfolio_data = {}
        for asset in assets:
            prices = db.query(AssetPrice).filter(
                AssetPrice.symbol == asset.symbol,
                AssetPrice.asset_type == asset.asset_type,
                AssetPrice.timestamp >= datetime.utcnow() - timedelta(days=365)
            ).order_by(AssetPrice.timestamp).all()
            
            if prices:
                df = pd.DataFrame([
                    {
                        'date': price.timestamp,
                        'close': float(price.close)
                    }
                    for price in prices
                ])
                df.set_index('date', inplace=True)
                returns = df['close'].pct_change().dropna()
                portfolio_data[asset.symbol] = returns
        
        if not portfolio_data:
            return {"message": "No price data available for stress testing"}
        
        # Calculate portfolio returns (equal weight)
        returns_df = pd.DataFrame(portfolio_data)
        portfolio_returns = returns_df.mean(axis=1).dropna()
        
        # Define stress scenarios
        scenarios = {
            "market_crash": {
                "description": "30% market decline scenario",
                "shock": -0.30
            },
            "black_monday": {
                "description": "22% single-day decline (Black Monday 1987)",
                "shock": -0.22
            },
            "dot_com_crash": {
                "description": "78% decline over 2 years (2000-2002)",
                "shock": -0.78
            },
            "financial_crisis": {
                "description": "57% decline (2007-2009)",
                "shock": -0.57
            },
            "covid_crash": {
                "description": "34% decline in 1 month (March 2020)",
                "shock": -0.34
            }
        }
        
        stress_results = {}
        current_value = 100000  # Assume $100k portfolio
        
        for scenario_name, scenario in scenarios.items():
            shocked_value = current_value * (1 + scenario["shock"])
            loss_amount = current_value - shocked_value
            
            stress_results[scenario_name] = {
                "description": scenario["description"],
                "shock_percentage": scenario["shock"] * 100,
                "portfolio_value_before": current_value,
                "portfolio_value_after": shocked_value,
                "absolute_loss": loss_amount,
                "time_to_recover_days": estimate_recovery_time(portfolio_returns, abs(scenario["shock"]))
            }
        
        # Calculate portfolio resilience metrics
        resilience_metrics = {
            "worst_case_scenario": min(scenarios.values(), key=lambda x: x["shock"])["shock"] * 100,
            "average_scenario_loss": np.mean([s["shock"] for s in scenarios.values()]) * 100,
            "portfolio_volatility": float(portfolio_returns.std() * np.sqrt(252) * 100),  # Annualized %
            "maximum_daily_loss": float(portfolio_returns.min() * 100)
        }
        
        return {
            "stress_scenarios": stress_results,
            "resilience_metrics": resilience_metrics,
            "recommendation": generate_stress_recommendation(stress_results, resilience_metrics),
            "calculated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running stress test: {str(e)}"
        )


def estimate_recovery_time(returns: pd.Series, loss_percentage: float) -> int:
    """Estimate recovery time based on historical returns."""
    if len(returns) == 0:
        return 0
    
    avg_daily_return = returns.mean()
    if avg_daily_return <= 0:
        return 9999  # Very long recovery
    
    # Calculate days needed to recover the loss
    recovery_days = int(np.log(1 / (1 - loss_percentage)) / avg_daily_return)
    return min(recovery_days, 9999)


def generate_stress_recommendation(stress_results: dict, resilience_metrics: dict) -> str:
    """Generate recommendation based on stress test results."""
    avg_loss = abs(resilience_metrics["average_scenario_loss"])
    volatility = resilience_metrics["portfolio_volatility"]
    
    if avg_loss > 50:
        return "HIGH RISK: Portfolio is vulnerable to severe market stress. Consider diversification and hedging strategies."
    elif avg_loss > 30:
        return "MODERATE RISK: Portfolio shows significant stress vulnerability. Review asset allocation and consider defensive positions."
    elif volatility > 25:
        return "HIGH VOLATILITY: While stress resilient, portfolio has high daily volatility. Consider volatility management."
    else:
        return "WELL-POSITIONED: Portfolio shows good resilience to stress scenarios. Continue monitoring and gradual optimization."


@router.get("/sector-analysis/{portfolio_id}")
async def portfolio_sector_analysis(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze portfolio sector concentration and diversification."""
    try:
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
        
        # Get portfolio assets
        assets = db.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
        
        if not assets:
            return {"message": "No assets in portfolio"}
        
        # Categorize assets by type and mock sector (in real implementation, use external API)
        sector_mapping = {
            "AAPL": "Technology",
            "MSFT": "Technology", 
            "GOOGL": "Technology",
            "TSLA": "Automotive",
            "JPM": "Financial",
            "JNJ": "Healthcare",
            "BTC": "Cryptocurrency",
            "ETH": "Cryptocurrency",
            "BNB": "Cryptocurrency"
        }
        
        asset_analysis = []
        sector_counts = {}
        type_counts = {"stock": 0, "crypto": 0}
        
        for asset in assets:
            sector = sector_mapping.get(asset.symbol, "Other")
            type_counts[asset.asset_type] += 1
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
            
            asset_analysis.append({
                "symbol": asset.symbol,
                "name": asset.name,
                "asset_type": asset.asset_type,
                "sector": sector,
                "exchange": asset.exchange
            })
        
        # Calculate concentration metrics
        total_assets = len(assets)
        sector_percentages = {sector: (count / total_assets) * 100 for sector, count in sector_counts.items()}
        type_percentages = {type_name: (count / total_assets) * 100 for type_name, count in type_counts.items()}
        
        # Calculate Herfindahl-Hirschman Index for concentration
        hhi_sector = sum((pct / 100) ** 2 for pct in sector_percentages.values())
        hhi_type = sum((pct / 100) ** 2 for pct in type_percentages.values())
        
        # Generate diversification recommendations
        recommendations = []
        
        if hhi_sector > 0.25:  # High concentration
            recommendations.append("High sector concentration detected. Consider adding assets from different sectors.")
        
        if type_percentages.get("crypto", 0) > 20:
            recommendations.append("High cryptocurrency allocation. Consider the increased volatility and regulatory risks.")
        
        if len(sector_counts) < 3:
            recommendations.append("Limited sector diversification. Consider expanding to at least 3-5 different sectors.")
        
        if not recommendations:
            recommendations.append("Good diversification across sectors and asset types.")
        
        return {
            "assets": asset_analysis,
            "sector_breakdown": sector_percentages,
            "asset_type_breakdown": type_percentages,
            "concentration_metrics": {
                "sector_hhi": float(hhi_sector),
                "type_hhi": float(hhi_type),
                "diversification_score": float(1 - hhi_sector),  # Higher is better
                "total_sectors": len(sector_counts),
                "total_assets": total_assets
            },
            "recommendations": recommendations,
            "calculated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing portfolio sectors: {str(e)}"
        )
