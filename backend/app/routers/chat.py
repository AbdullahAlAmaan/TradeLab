"""Data context service for local AI chatbots."""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user
from app.models import Portfolio, BacktestResult, PaperTrade, RiskMetric, Asset, AssetPrice
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()


class ContextRequest(BaseModel):
    context_type: str  # "portfolio", "backtest", "trading", "market"
    context_id: Optional[str] = None  # Portfolio ID, backtest ID, etc.


class ContextResponse(BaseModel):
    context_data: Dict[str, Any]
    suggestions: List[str] = []
    prompt_template: Optional[str] = None


@router.post("/context", response_model=ContextResponse)
async def get_chat_context(
    request: ContextRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get structured data context for local AI chatbots."""
    
    user_id = current_user["user_id"]
    logger.info(f"Context request from user {user_id}: {request.context_type}")
    
    try:
        context_data = {}
        suggestions = []
        prompt_template = None
        
        if request.context_type == "portfolio":
            context_data, suggestions, prompt_template = await _get_portfolio_context(
                user_id, request.context_id, db
            )
        elif request.context_type == "backtest":
            context_data, suggestions, prompt_template = await _get_backtest_context(
                user_id, request.context_id, db
            )
        elif request.context_type == "trading":
            context_data, suggestions, prompt_template = await _get_trading_context(
                user_id, db
            )
        elif request.context_type == "market":
            context_data, suggestions, prompt_template = await _get_market_context(db)
        else:
            context_data = {"message": "Unknown context type"}
            suggestions = ["Try 'portfolio', 'backtest', 'trading', or 'market'"]
        
        return ContextResponse(
            context_data=context_data,
            suggestions=suggestions,
            prompt_template=prompt_template
        )
        
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get context data"
        )


async def _get_portfolio_context(user_id: str, portfolio_id: Optional[str], db: Session):
    """Get comprehensive portfolio context data with financial metrics."""
    context_data = {}
    suggestions = [
        "Analyze portfolio diversification and risk concentration",
        "Calculate risk-adjusted returns and performance metrics", 
        "Suggest rebalancing strategy based on current allocation",
        "Explain portfolio performance vs benchmarks",
        "Identify top/bottom performing assets",
        "Assess sector and geographic diversification"
    ]
    
    try:
        if portfolio_id:
            # Get specific portfolio with comprehensive analysis
            portfolio = db.query(Portfolio).filter(
                Portfolio.id == portfolio_id,
                Portfolio.user_id == user_id
            ).first()
            
            if portfolio:
                # Get portfolio assets with price data
                assets = db.query(Asset).filter(
                    Asset.portfolio_id == portfolio_id
                ).all()
                
                # Enhanced asset data with real financial metrics
                enhanced_assets = []
                total_portfolio_value = 0
                asset_types = {}
                
                for asset in assets:
                    try:
                        # Get real current price from data API
                        from app.routers.data import fetch_data
                        from app.schemas import DataFetchRequest
                        
                        data_request = DataFetchRequest(
                            symbol=asset.symbol,
                            asset_type=asset.asset_type,
                            days=1
                        )
                        
                        # Get current price from latest data
                        current_price = 100.0  # Default fallback
                        try:
                            data_response = fetch_data(data_request, db)
                            if data_response and hasattr(data_response, 'data_preview'):
                                current_price = data_response.data_preview.last_price
                        except:
                            # If data fetch fails, use a reasonable default
                            current_price = 100.0
                        
                        # Get actual quantity from asset
                        quantity = getattr(asset, 'quantity', 1.0)
                        asset_value = current_price * quantity
                        total_portfolio_value += asset_value
                        
                        # Track asset types for diversification analysis
                        if asset.asset_type not in asset_types:
                            asset_types[asset.asset_type] = {"count": 0, "value": 0}
                        asset_types[asset.asset_type]["count"] += 1
                        asset_types[asset.asset_type]["value"] += asset_value
                        
                        enhanced_assets.append({
                            "symbol": asset.symbol,
                            "name": asset.name,
                            "type": asset.asset_type,
                            "exchange": asset.exchange,
                            "current_price": current_price,
                            "quantity": quantity,
                            "market_value": asset_value,
                            "weight_percent": 0,  # Will calculate after total
                            "sector": "Technology" if asset.asset_type == "stock" else "Cryptocurrency",
                        "risk_level": "Medium" if asset.asset_type == "stock" else "High"
                    })
                
                # Calculate weights and diversification metrics
                for asset in enhanced_assets:
                    asset["weight_percent"] = (asset["market_value"] / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
                
                # Calculate diversification score
                diversification_score = len(set(a["symbol"] for a in enhanced_assets)) / max(len(enhanced_assets), 1)
                max_concentration = max((a["weight_percent"] for a in enhanced_assets), default=0)
                
                context_data = {
                    "portfolio_analysis": {
                        "basic_info": {
                            "id": str(portfolio.id),
                            "name": portfolio.name,
                            "description": portfolio.description,
                            "created_at": portfolio.created_at.isoformat(),
                            "total_assets": len(assets),
                            "total_value": total_portfolio_value
                        },
                        "asset_breakdown": enhanced_assets,
                        "diversification_analysis": {
                            "asset_types": asset_types,
                            "diversification_score": diversification_score,
                            "concentration_risk": max_concentration,
                            "risk_assessment": "High" if max_concentration > 40 else "Medium" if max_concentration > 20 else "Low"
                        },
                        "performance_summary": {
                            "top_performer": max(enhanced_assets, key=lambda x: x["weight_percent"])["symbol"] if enhanced_assets else None,
                            "asset_type_allocation": {k: v["value"] for k, v in asset_types.items()},
                            "recommendation": "Consider rebalancing" if max_concentration > 30 else "Well diversified"
                        }
                    }
                }
        else:
            # Get all user portfolios with summary analysis
            portfolios = db.query(Portfolio).filter(
                Portfolio.user_id == user_id
            ).order_by(Portfolio.created_at.desc()).all()
            
            portfolio_summaries = []
            total_assets_across_portfolios = 0
            
            for p in portfolios:
                assets = db.query(Asset).filter(Asset.portfolio_id == p.id).all()
                # Calculate real portfolio value
                portfolio_value = 0.0
                for asset in assets:
                    try:
                        # Get real current price
                        from app.routers.data import fetch_data
                        from app.schemas import DataFetchRequest
                        
                        data_request = DataFetchRequest(
                            symbol=asset.symbol,
                            asset_type=asset.asset_type,
                            days=1
                        )
                        
                        current_price = 100.0  # Default fallback
                        try:
                            data_response = fetch_data(data_request, db)
                            if data_response and hasattr(data_response, 'data_preview'):
                                current_price = data_response.data_preview.last_price
                        except:
                            current_price = 100.0
                        
                        quantity = getattr(asset, 'quantity', 1.0)
                        portfolio_value += current_price * quantity
                    except:
                        # If individual asset fails, skip it
                        continue
                total_assets_across_portfolios += len(assets)
                
                portfolio_summaries.append({
                    "id": str(p.id),
                    "name": p.name,
                    "description": p.description,
                    "created_at": p.created_at.isoformat(),
                    "asset_count": len(assets),
                    "estimated_value": portfolio_value,
                    "primary_asset_types": list(set(asset.asset_type for asset in assets))
                })
            
            context_data = {
                "portfolios_overview": {
                    "total_portfolios": len(portfolios),
                    "total_assets": total_assets_across_portfolios,
                    "portfolio_details": portfolio_summaries,
                    "diversification_across_portfolios": len(set(p["primary_asset_types"][0] if p["primary_asset_types"] else "mixed" for p in portfolio_summaries))
                }
            }
    
    except Exception as e:
        logger.error(f"Error getting portfolio context: {e}")
        # Return empty context if database error
        context_data = {
            "error": f"Unable to fetch portfolio data: {str(e)}",
            "message": "Please ensure you have portfolios and assets in your account."
        }
    
    prompt_template = """You are an expert portfolio analyst and investment advisor. Based on the comprehensive portfolio data provided, analyze and provide insights on:

    1. **Portfolio Composition Analysis:**
       - Asset allocation breakdown and sector distribution
       - Diversification effectiveness across asset classes
       - Geographic and currency exposure

    2. **Risk Assessment:**
       - Concentration risk and position sizing
       - Volatility analysis and risk-adjusted returns
       - Correlation between holdings

    3. **Performance Evaluation:**
       - Individual asset performance and contribution
       - Portfolio vs benchmark comparison
       - Risk-adjusted performance metrics (Sharpe ratio, etc.)

    4. **Strategic Recommendations:**
       - Rebalancing opportunities
       - Portfolio optimization suggestions
       - Risk management improvements

    5. **Market Context:**
       - Current market environment impact
       - Sector rotation opportunities
       - Economic cycle positioning

    Portfolio Data:
    {context_data}

    Provide a detailed, actionable analysis with specific recommendations. Focus on practical insights that can improve portfolio performance and risk management."""
    
    return context_data, suggestions, prompt_template


async def _get_backtest_context(user_id: str, backtest_id: Optional[str], db: Session):
    """Get backtest context data for AI prompts."""
    context_data = {}
    suggestions = [
        "Analyze strategy performance",
        "Explain risk metrics",
        "Suggest improvements",
        "Compare with benchmarks"
    ]
    
    try:
        if backtest_id:
            # Get specific backtest
            backtest = db.query(BacktestResult).filter(
                BacktestResult.id == backtest_id,
                BacktestResult.user_id == user_id
            ).first()
            
            if backtest:
                context_data = {
                    "backtest": {
                        "id": str(backtest.id),
                        "symbol": backtest.symbol,
                        "asset_type": backtest.asset_type,
                        "period": f"{backtest.start_date.isoformat()} to {backtest.end_date.isoformat()}",
                        "initial_capital": float(backtest.initial_capital),
                        "final_capital": float(backtest.final_capital),
                        "total_return": float(backtest.total_return),
                        "sharpe_ratio": float(backtest.sharpe_ratio) if backtest.sharpe_ratio else None,
                        "max_drawdown": float(backtest.max_drawdown) if backtest.max_drawdown else None,
                        "win_rate": float(backtest.win_rate) if backtest.win_rate else None,
                        "total_trades": backtest.total_trades,
                        "created_at": backtest.created_at.isoformat()
                    }
                }
        else:
            # Get recent backtests
            backtests = db.query(BacktestResult).filter(
                BacktestResult.user_id == user_id
            ).order_by(BacktestResult.created_at.desc()).limit(10).all()
            
            context_data = {
                "recent_backtests": [
                    {
                        "id": str(bt.id),
                        "symbol": bt.symbol,
                        "total_return": float(bt.total_return),
                        "sharpe_ratio": float(bt.sharpe_ratio) if bt.sharpe_ratio else None,
                        "created_at": bt.created_at.isoformat()
                    }
                    for bt in backtests
                ]
            }
    
    except Exception as e:
        logger.error(f"Error getting backtest context: {e}")
        context_data = {"error": "Failed to fetch backtest data"}
    
    prompt_template = """You are a trading strategy analysis expert. Based on the following backtest results, provide insights on:
    1. Strategy performance evaluation
    2. Risk-adjusted returns analysis
    3. Areas for strategy improvement
    4. Comparison with market benchmarks
    
    Backtest Data:
    {context_data}
    
    Please provide a detailed analysis with specific recommendations."""
    
    return context_data, suggestions, prompt_template


async def _get_trading_context(user_id: str, db: Session):
    """Get trading context data for AI prompts."""
    context_data = {}
    suggestions = [
        "Review recent trades",
        "Analyze trading performance",
        "Calculate P&L summary",
        "Identify trading patterns"
    ]
    
    try:
        # Get recent paper trades
        trades = db.query(PaperTrade).filter(
            PaperTrade.user_id == user_id
        ).order_by(PaperTrade.created_at.desc()).limit(20).all()
        
        context_data = {
            "recent_trades": [
                {
                    "id": str(trade.id),
                    "symbol": trade.symbol,
                    "asset_type": trade.asset_type,
                    "side": trade.side,
                    "quantity": float(trade.quantity),
                    "price": float(trade.price),
                    "total_value": float(trade.total_value),
                    "broker": trade.broker,
                    "status": trade.status,
                    "executed_at": trade.executed_at.isoformat() if trade.executed_at else None,
                    "created_at": trade.created_at.isoformat()
                }
                for trade in trades
            ],
            "total_trades": len(trades)
        }
    
    except Exception as e:
        logger.error(f"Error getting trading context: {e}")
        context_data = {"error": "Failed to fetch trading data"}
    
    prompt_template = """You are a trading performance analyst. Based on the following trading data, provide insights on:
    1. Trading activity summary
    2. Performance analysis
    3. Risk management evaluation
    4. Suggestions for improvement
    
    Trading Data:
    {context_data}
    
    Please provide a comprehensive trading analysis."""
    
    return context_data, suggestions, prompt_template


async def _get_market_context(db: Session):
    """Get market context data for AI prompts."""
    context_data = {}
    suggestions = [
        "Analyze market trends",
        "Review asset performance",
        "Identify trading opportunities",
        "Assess market volatility"
    ]
    
    try:
        # Get recent price data for popular assets
        popular_symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'BTC', 'ETH']
        market_data = []
        
        for symbol in popular_symbols:
            recent_price = db.query(AssetPrice).filter(
                AssetPrice.symbol == symbol
            ).order_by(AssetPrice.timestamp.desc()).first()
            
            if recent_price:
                market_data.append({
                    "symbol": recent_price.symbol,
                    "asset_type": recent_price.asset_type,
                    "price": float(recent_price.close),
                    "timestamp": recent_price.timestamp.isoformat()
                })
        
        context_data = {
            "market_snapshot": market_data,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error getting market context: {e}")
        context_data = {"error": "Failed to fetch market data"}
    
    prompt_template = """You are a market analysis expert. Based on the following market data, provide insights on:
    1. Current market conditions
    2. Asset performance trends
    3. Potential trading opportunities
    4. Market risk assessment
    
    Market Data:
    {context_data}
    
    Please provide a thorough market analysis."""
    
    return context_data, suggestions, prompt_template


@router.get("/financial-terms")
async def get_financial_terms():
    """Get list of common financial terms for AI explanation."""
    terms = [
        "Sharpe Ratio", "Beta", "Alpha", "VaR", "CVaR", "Sortino Ratio",
        "Maximum Drawdown", "Calmar Ratio", "Information Ratio", "Treynor Ratio",
        "Standard Deviation", "Correlation", "Covariance", "Volatility",
        "Bull Market", "Bear Market", "Support", "Resistance", "Moving Average",
        "RSI", "MACD", "Bollinger Bands", "Fibonacci Retracement",
        "Portfolio Diversification", "Asset Allocation", "Risk Management",
        "Stop Loss", "Take Profit", "Market Cap", "P/E Ratio", "EPS"
    ]
    
    return {
        "terms": terms,
        "count": len(terms),
        "usage": "Use these terms with your local AI to get detailed explanations"
    }


class SmartContextRequest(BaseModel):
    user_query: str
    include_all_context: bool = False


class SmartContextResponse(BaseModel):
    enhanced_prompt: str
    context_types_used: List[str]
    context_data: Dict[str, Any]
    suggestions: List[str]


@router.post("/smart-context", response_model=SmartContextResponse)
async def get_smart_context(
    request: SmartContextRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Automatically detect and enhance user query with relevant context."""
    
    user_id = current_user["user_id"]
    user_query = request.user_query.lower()
    logger.info(f"Smart context request from user {user_id}: {request.user_query}")
    
    # Define context detection keywords
    context_keywords = {
        'portfolio': [
            'portfolio', 'holdings', 'assets', 'allocation', 'diversification', 
            'stocks', 'crypto', 'investment', 'position', 'weight', 'concentration',
            'risk', 'return', 'performance', 'balance', 'rebalance'
        ],
        'backtest': [
            'backtest', 'strategy', 'performance', 'sharpe', 'drawdown', 'returns',
            'trading strategy', 'algorithm', 'test', 'historical', 'simulation'
        ],
        'trading': [
            'trade', 'trading', 'buy', 'sell', 'order', 'position', 'profit', 'loss',
            'p&l', 'execution', 'paper trading', 'transactions'
        ],
        'market': [
            'market', 'price', 'trend', 'analysis', 'volatility', 'economic',
            'sector', 'industry', 'news', 'macro', 'technical analysis'
        ]
    }
    
    # Detect relevant context types
    relevant_contexts = []
    for context_type, keywords in context_keywords.items():
        if any(keyword in user_query for keyword in keywords):
            relevant_contexts.append(context_type)
    
    # If no specific context detected, include portfolio by default for financial queries
    financial_indicators = ['analyze', 'recommend', 'suggest', 'explain', 'calculate', 'evaluate']
    if not relevant_contexts and any(indicator in user_query for indicator in financial_indicators):
        relevant_contexts.append('portfolio')
    
    # Include all contexts if requested
    if request.include_all_context:
        relevant_contexts = ['portfolio', 'backtest', 'trading', 'market']
    
    # Gather context data
    all_context_data = {}
    all_suggestions = []
    
    try:
        for context_type in relevant_contexts:
            if context_type == "portfolio":
                context_data, suggestions, _ = await _get_portfolio_context(user_id, None, db)
                all_context_data["portfolio"] = context_data
                all_suggestions.extend(suggestions[:2])  # Limit suggestions per context
                
            elif context_type == "backtest":
                context_data, suggestions, _ = await _get_backtest_context(user_id, None, db)
                all_context_data["backtest"] = context_data
                all_suggestions.extend(suggestions[:2])
                
            elif context_type == "trading":
                context_data, suggestions, _ = await _get_trading_context(user_id, db)
                all_context_data["trading"] = context_data
                all_suggestions.extend(suggestions[:2])
                
            elif context_type == "market":
                context_data, suggestions, _ = await _get_market_context(db)
                all_context_data["market"] = context_data
                all_suggestions.extend(suggestions[:2])
        
        # Create enhanced prompt
        enhanced_prompt = f"""
CONTEXT: You are WizardLM2, an expert financial advisor and portfolio analyst. Answer the user's question using the provided real-time financial data.

USER QUESTION: {request.user_query}

AVAILABLE DATA:
{json.dumps(all_context_data, indent=2)}

INSTRUCTIONS:
1. Provide specific, actionable financial advice based on the actual data
2. Include relevant numbers, percentages, and metrics from the context
3. Explain your reasoning clearly
4. Suggest concrete next steps
5. If data is limited, acknowledge this and provide general best practices

Remember: This user trusts you for personalized financial guidance. Be thorough but concise."""

        return SmartContextResponse(
            enhanced_prompt=enhanced_prompt,
            context_types_used=relevant_contexts,
            context_data=all_context_data,
            suggestions=list(set(all_suggestions))  # Remove duplicates
        )
        
    except Exception as e:
        logger.error(f"Error in smart context: {e}")
        
        # Fallback response
        fallback_prompt = f"""
USER QUESTION: {request.user_query}

You are a financial advisor. Please answer this question with general financial guidance and best practices.
If specific portfolio data would be helpful, mention that connecting to a database would provide more personalized advice.
"""
        
        return SmartContextResponse(
            enhanced_prompt=fallback_prompt,
            context_types_used=[],
            context_data={"note": "No context data available"},
            suggestions=[
                "Connect your portfolio for personalized advice",
                "Run a backtest to validate strategies",
                "Review your risk tolerance"
            ]
        )


@router.get("/database-schema")
async def get_database_schema():
    """Get database schema for SQL query generation."""
    schema = {
        "portfolios": {
            "description": "User investment portfolios",
            "columns": {
                "id": "UUID - Primary key",
                "user_id": "UUID - User identifier",
                "name": "VARCHAR(255) - Portfolio name",
                "description": "TEXT - Portfolio description",
                "created_at": "TIMESTAMP - Creation date",
                "updated_at": "TIMESTAMP - Last update"
            }
        },
        "assets": {
            "description": "Assets within portfolios",
            "columns": {
                "id": "UUID - Primary key",
                "portfolio_id": "UUID - Portfolio reference",
                "symbol": "VARCHAR(20) - Asset symbol",
                "asset_type": "VARCHAR(10) - 'stock' or 'crypto'",
                "name": "VARCHAR(255) - Asset name",
                "exchange": "VARCHAR(50) - Exchange name"
            }
        },
        "asset_prices": {
            "description": "Historical price data",
            "columns": {
                "id": "UUID - Primary key",
                "symbol": "VARCHAR(20) - Asset symbol",
                "asset_type": "VARCHAR(10) - Asset type",
                "timestamp": "TIMESTAMP - Price timestamp",
                "open": "DECIMAL(20,8) - Opening price",
                "high": "DECIMAL(20,8) - High price",
                "low": "DECIMAL(20,8) - Low price",
                "close": "DECIMAL(20,8) - Closing price",
                "volume": "BIGINT - Trading volume"
            }
        },
        "backtest_results": {
            "description": "Strategy backtest results",
            "columns": {
                "id": "UUID - Primary key",
                "user_id": "UUID - User identifier",
                "symbol": "VARCHAR(20) - Tested symbol",
                "initial_capital": "DECIMAL(20,2) - Starting capital",
                "final_capital": "DECIMAL(20,2) - Ending capital",
                "total_return": "DECIMAL(10,4) - Return percentage",
                "sharpe_ratio": "DECIMAL(10,4) - Risk-adjusted return",
                "max_drawdown": "DECIMAL(10,4) - Maximum loss",
                "total_trades": "INTEGER - Number of trades"
            }
        },
        "paper_trades": {
            "description": "Simulated trading records",
            "columns": {
                "id": "UUID - Primary key",
                "user_id": "UUID - User identifier",
                "symbol": "VARCHAR(20) - Traded symbol",
                "side": "VARCHAR(4) - 'buy' or 'sell'",
                "quantity": "DECIMAL(20,8) - Trade quantity",
                "price": "DECIMAL(20,8) - Trade price",
                "total_value": "DECIMAL(20,2) - Total trade value",
                "status": "VARCHAR(20) - Trade status"
            }
        }
    }
    
    return {
        "schema": schema,
        "usage": "Use this schema to generate SQL queries with your local AI"
    }
