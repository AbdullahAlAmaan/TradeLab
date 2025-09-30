"""Asset management endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app.auth import get_current_user, require_user_access
from app.models import Portfolio, Asset
from app.schemas import (
    PortfolioCreate, PortfolioUpdate, Portfolio as PortfolioSchema,
    AssetCreate, AssetUpdate, Asset as AssetSchema
)
from datetime import datetime
import uuid

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


# Portfolio endpoints
@router.post("/portfolios", response_model=PortfolioSchema)
async def create_portfolio(
    portfolio: PortfolioCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new portfolio."""
    user_id = current_user["user_id"]
    user_email = current_user.get("email", "N/A")
    
    logger.info(f"Creating portfolio '{portfolio.name}' for user {user_email} (ID: {user_id})")
    
    try:
        # Validate input
        if not portfolio.name or len(portfolio.name.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Portfolio name is required"
            )
        
        # Test database connection first
        try:
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
        except Exception as db_error:
            logger.error(f"Database connection failed: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failed. Please check your database configuration."
            )
        
        # Check for duplicate portfolio names for this user
        existing = db.query(Portfolio).filter(
            Portfolio.user_id == user_id,
            Portfolio.name == portfolio.name.strip()
        ).first()
        
        if existing:
            logger.warning(f"Duplicate portfolio name '{portfolio.name}' for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Portfolio with this name already exists"
            )
        
        # Create portfolio
        from datetime import timezone
        now = datetime.now(timezone.utc)
        db_portfolio = Portfolio(
            user_id=uuid.UUID(user_id),
            name=portfolio.name.strip(),
            description=portfolio.description.strip() if portfolio.description else None,
            created_at=now,
            updated_at=now
        )
        
        db.add(db_portfolio)
        db.commit()
        db.refresh(db_portfolio)
        
        logger.info(f"Successfully created portfolio {db_portfolio.id} for user {user_id}")
        return db_portfolio
        
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating portfolio: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create portfolio - database constraint violation"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating portfolio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create portfolio"
        )


@router.get("/portfolios", response_model=List[PortfolioSchema])
async def get_portfolios(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all portfolios for the current user."""
    user_id = current_user["user_id"]
    user_email = current_user.get("email", "N/A")
    
    logger.info(f"Retrieving portfolios for user {user_email} (ID: {user_id})")
    
    try:
        # Ensure user_id is properly formatted (handle both string and UUID formats)
        if isinstance(user_id, str):
            # Try to parse as UUID to validate format
            try:
                uuid.UUID(user_id)
            except ValueError:
                logger.error(f"Invalid user_id format: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format"
                )
        
        # Debug information in development mode
        if logger.isEnabledFor(logging.DEBUG):
            total_portfolios = db.query(Portfolio).count()
            logger.debug(f"Total portfolios in database: {total_portfolios}")
            
            # Sample portfolio user IDs for debugging
            sample_portfolios = db.query(Portfolio).limit(5).all()
            for p in sample_portfolios:
                logger.debug(f"Portfolio {p.id} belongs to user {p.user_id} (type: {type(p.user_id)})")
        
        # Query portfolios for current user with explicit string conversion
        portfolios = db.query(Portfolio).filter(
            Portfolio.user_id == str(user_id)
        ).order_by(Portfolio.created_at.desc()).all()
        
        logger.info(f"Found {len(portfolios)} portfolios for user {user_id}")
        
        # Additional debug logging for portfolio persistence issues
        if len(portfolios) == 0:
            logger.warning(f"No portfolios found for user {user_id}. Checking for user ID variations...")
            
            # Check if there are portfolios with similar user IDs (debugging aid)
            all_user_ids = db.query(Portfolio.user_id).distinct().all()
            logger.debug(f"All user IDs in database: {[str(uid[0]) for uid in all_user_ids]}")
        
        return portfolios
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving portfolios for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve portfolios"
        )


@router.get("/portfolios/{portfolio_id}", response_model=PortfolioSchema)
async def get_portfolio(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific portfolio."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return portfolio


@router.put("/portfolios/{portfolio_id}", response_model=PortfolioSchema)
async def update_portfolio(
    portfolio_id: uuid.UUID,
    portfolio_update: PortfolioUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a portfolio."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    update_data = portfolio_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(portfolio, field, value)
    
    portfolio.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.delete("/portfolios/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a portfolio."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    db.delete(portfolio)
    db.commit()
    return {"message": "Portfolio deleted successfully"}


# Asset endpoints
@router.post("/assets", response_model=AssetSchema)
async def create_asset(
    asset: AssetCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new asset in a portfolio."""
    # Verify portfolio belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == asset.portfolio_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Check if asset already exists in portfolio
    existing_asset = db.query(Asset).filter(
        Asset.portfolio_id == asset.portfolio_id,
        Asset.symbol == asset.symbol,
        Asset.asset_type == asset.asset_type
    ).first()
    
    if existing_asset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset already exists in portfolio"
        )
    
    db_asset = Asset(
        portfolio_id=asset.portfolio_id,
        symbol=asset.symbol,
        asset_type=asset.asset_type,
        name=asset.name,
        exchange=asset.exchange,
        quantity=asset.quantity or 1,
        purchase_price=asset.purchase_price or 0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.get("/portfolios/{portfolio_id}/assets", response_model=List[AssetSchema])
async def get_portfolio_assets(
    portfolio_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all assets in a portfolio."""
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
    
    assets = db.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
    return assets


@router.put("/assets/{asset_id}", response_model=AssetSchema)
async def update_asset(
    asset_id: uuid.UUID,
    asset_update: AssetUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an asset."""
    asset = db.query(Asset).join(Portfolio).filter(
        Asset.id == asset_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    update_data = asset_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    asset.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an asset."""
    asset = db.query(Asset).join(Portfolio).filter(
        Asset.id == asset_id,
        Portfolio.user_id == current_user["user_id"]
    ).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted successfully"}
