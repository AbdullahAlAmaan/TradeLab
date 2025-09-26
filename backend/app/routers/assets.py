"""Asset management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.models import Portfolio, Asset
from app.schemas import (
    PortfolioCreate, PortfolioUpdate, Portfolio as PortfolioSchema,
    AssetCreate, AssetUpdate, Asset as AssetSchema
)
from datetime import datetime
import uuid

router = APIRouter()


# Portfolio endpoints
@router.post("/portfolios", response_model=PortfolioSchema)
async def create_portfolio(
    portfolio: PortfolioCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new portfolio."""
    db_portfolio = Portfolio(
        user_id=current_user["user_id"],
        name=portfolio.name,
        description=portfolio.description,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio


@router.get("/portfolios", response_model=List[PortfolioSchema])
async def get_portfolios(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all portfolios for the current user."""
    portfolios = db.query(Portfolio).filter(
        Portfolio.user_id == current_user["user_id"]
    ).all()
    return portfolios


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
