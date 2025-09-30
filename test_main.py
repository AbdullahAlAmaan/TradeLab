"""Simple test FastAPI application for Railway."""

from fastapi import FastAPI

# Create FastAPI application
app = FastAPI(
    title="TradeLab API Test",
    description="Simple test version",
    version="1.0.0"
)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "TradeLab API Test",
        "status": "working",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "API is working"
    }

# For Railway deployment
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
