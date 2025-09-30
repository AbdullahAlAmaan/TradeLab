"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, auth, assets, data, backtest, risk, trade, chat, websocket

# Create FastAPI application
app = FastAPI(
    title="TradeLab API",
    description="A comprehensive trading platform with backtesting, risk analysis, and paper trading",
    version="1.0.2",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trade-lab-mu.vercel.app",
        "https://trade-lab-git-main-abdullahalamaans-projects.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
app.include_router(data.router, prefix="/api/v1/data", tags=["data"])
app.include_router(backtest.router, prefix="/api/v1/backtest", tags=["backtesting"])
app.include_router(risk.router, prefix="/api/v1/risk", tags=["risk"])
app.include_router(trade.router, prefix="/api/v1/trade", tags=["trading"])
app.include_router(chat.router, prefix="/api/v1/ai", tags=["data-context"])
app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to TradeLab API",
        "version": "1.0.2",
        "docs": "/docs",
        "status": "deployed_on_railway_with_numpy_fix"
    }

@app.get("/test")
async def test():
    """Simple test endpoint."""
    return {
        "status": "ok",
        "message": "API is working",
        "python_version": "3.12"
    }

# For Railway deployment
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

