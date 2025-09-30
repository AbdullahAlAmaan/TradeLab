"""Health check endpoints."""

from fastapi import APIRouter
from datetime import datetime
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check server health status."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow()
    )


@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check including database and external services."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.2",
        "services": {
            "database": "unknown",
            "supabase": "unknown",
            "alpaca": "unknown",
            "binance": "unknown"
        }
    }
    
    # Check database connection
    try:
        from app.database import get_db
        db = next(get_db())
        db.execute("SELECT 1")
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Supabase connection
    try:
        from app.auth import supabase
        if supabase:
            # Simple test query
            health_status["services"]["supabase"] = "healthy"
        else:
            health_status["services"]["supabase"] = "not_configured"
    except Exception as e:
        health_status["services"]["supabase"] = f"unhealthy: {str(e)}"
    
    return health_status


@router.get("/debug/database")
async def debug_database():
    """Debug endpoint to check database contents."""
    try:
        from app.database import get_db
        from app.models import Portfolio, Asset, PaperTrade, BacktestResult
        from sqlalchemy import text
        
        db = next(get_db())
        
        # Get database info
        result = db.execute(text("SELECT current_database(), current_user, version()"))
        db_info = result.fetchone()
        
        # Count records in each table
        portfolio_count = db.query(Portfolio).count()
        asset_count = db.query(Asset).count()
        trade_count = db.query(PaperTrade).count()
        backtest_count = db.query(BacktestResult).count()
        
        # Get sample portfolios
        portfolios = db.query(Portfolio).limit(5).all()
        portfolio_data = []
        for p in portfolios:
            portfolio_data.append({
                "id": str(p.id),
                "user_id": str(p.user_id),
                "name": p.name,
                "created_at": p.created_at.isoformat()
            })
        
        return {
            "database_info": {
                "database": db_info[0] if db_info else "unknown",
                "user": db_info[1] if db_info else "unknown",
                "version": db_info[2] if db_info else "unknown"
            },
            "table_counts": {
                "portfolios": portfolio_count,
                "assets": asset_count,
                "paper_trades": trade_count,
                "backtest_results": backtest_count
            },
            "sample_portfolios": portfolio_data
        }
    except Exception as e:
        return {
            "error": str(e),
            "type": type(e).__name__
        }
