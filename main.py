"""Main FastAPI application."""

print("🚀 DEBUG: Starting main.py execution")
print("🚀 DEBUG: This is the ROOT main.py file")
print("🚀 DEBUG: Importing FastAPI...")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("🚀 DEBUG: Importing app modules...")
from app.config import settings
print("🚀 DEBUG: Config imported successfully")

print("🚀 DEBUG: Importing routers...")

# Debug: Check if llm_proxy.py exists
import os
print(f"🚀 DEBUG: Current working directory: {os.getcwd()}")
print(f"🚀 DEBUG: Checking if llm_proxy.py exists...")
llm_proxy_path = "app/routers/llm_proxy.py"
if os.path.exists(llm_proxy_path):
    print(f"✅ DEBUG: {llm_proxy_path} exists")
    print(f"🚀 DEBUG: File size: {os.path.getsize(llm_proxy_path)} bytes")
else:
    print(f"❌ DEBUG: {llm_proxy_path} does not exist")

# Debug: List all files in routers directory
routers_dir = "app/routers"
if os.path.exists(routers_dir):
    print(f"🚀 DEBUG: Files in {routers_dir}:")
    for file in os.listdir(routers_dir):
        if file.endswith('.py'):
            print(f"  - {file}")
else:
    print(f"❌ DEBUG: {routers_dir} directory does not exist")

# Debug: Check __init__.py content
init_path = "app/routers/__init__.py"
if os.path.exists(init_path):
    print(f"🚀 DEBUG: Reading {init_path} content:")
    with open(init_path, 'r') as f:
        content = f.read()
        print(f"Content:\n{content}")
else:
    print(f"❌ DEBUG: {init_path} does not exist")
try:
    from app.routers import health
    print("✅ DEBUG: health router imported")
except Exception as e:
    print(f"❌ DEBUG: health router import failed: {e}")

try:
    from app.routers import auth
    print("✅ DEBUG: auth router imported")
except Exception as e:
    print(f"❌ DEBUG: auth router import failed: {e}")

try:
    from app.routers import assets
    print("✅ DEBUG: assets router imported")
except Exception as e:
    print(f"❌ DEBUG: assets router import failed: {e}")

try:
    from app.routers import data
    print("✅ DEBUG: data router imported")
except Exception as e:
    print(f"❌ DEBUG: data router import failed: {e}")

try:
    from app.routers import backtest
    print("✅ DEBUG: backtest router imported")
except Exception as e:
    print(f"❌ DEBUG: backtest router import failed: {e}")

try:
    from app.routers import risk
    print("✅ DEBUG: risk router imported")
except Exception as e:
    print(f"❌ DEBUG: risk router import failed: {e}")

try:
    from app.routers import trade
    print("✅ DEBUG: trade router imported")
except Exception as e:
    print(f"❌ DEBUG: trade router import failed: {e}")

try:
    from app.routers import chat
    print("✅ DEBUG: chat router imported")
except Exception as e:
    print(f"❌ DEBUG: chat router import failed: {e}")

try:
    from app.routers import websocket
    print("✅ DEBUG: websocket router imported")
except Exception as e:
    print(f"❌ DEBUG: websocket router import failed: {e}")

try:
    from app.routers import llm_proxy
    print("✅ DEBUG: llm_proxy router imported")
except Exception as e:
    print(f"❌ DEBUG: llm_proxy router import failed: {e}")

try:
    from app.routers import gemini
    print("✅ DEBUG: gemini router imported")
except Exception as e:
    print(f"❌ DEBUG: gemini router import failed: {e}")

print("🚀 DEBUG: All router imports attempted")

print("🚀 DEBUG: All imports successful")
print("🚀 DEBUG: About to create FastAPI app")

# Create FastAPI application
print("🚀 DEBUG: Creating FastAPI app...")
app = FastAPI(
    title="TradeLab API",
    description="A comprehensive trading platform with backtesting, risk analysis, and paper trading",
    version="1.0.2",
    docs_url="/docs",
    redoc_url="/redoc"
)
print("🚀 DEBUG: FastAPI app created successfully")

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
print("🚀 DEBUG: About to include routers...")

try:
    app.include_router(health.router, prefix="/api/v1", tags=["health"])
    print("✅ DEBUG: health router included")
except Exception as e:
    print(f"❌ DEBUG: health router inclusion failed: {e}")

try:
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
    print("✅ DEBUG: auth router included")
except Exception as e:
    print(f"❌ DEBUG: auth router inclusion failed: {e}")

try:
    app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
    print("✅ DEBUG: assets router included")
except Exception as e:
    print(f"❌ DEBUG: assets router inclusion failed: {e}")

try:
    app.include_router(data.router, prefix="/api/v1/data", tags=["data"])
    print("✅ DEBUG: data router included")
except Exception as e:
    print(f"❌ DEBUG: data router inclusion failed: {e}")

try:
    app.include_router(backtest.router, prefix="/api/v1/backtest", tags=["backtesting"])
    print("✅ DEBUG: backtest router included")
except Exception as e:
    print(f"❌ DEBUG: backtest router inclusion failed: {e}")

try:
    app.include_router(risk.router, prefix="/api/v1/risk", tags=["risk"])
    print("✅ DEBUG: risk router included")
except Exception as e:
    print(f"❌ DEBUG: risk router inclusion failed: {e}")

try:
    app.include_router(trade.router, prefix="/api/v1/trade", tags=["trading"])
    print("✅ DEBUG: trade router included")
except Exception as e:
    print(f"❌ DEBUG: trade router inclusion failed: {e}")

try:
    app.include_router(chat.router, prefix="/api/v1/ai", tags=["data-context"])
    print("✅ DEBUG: chat router included")
except Exception as e:
    print(f"❌ DEBUG: chat router inclusion failed: {e}")

try:
    app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])
    print("✅ DEBUG: websocket router included")
except Exception as e:
    print(f"❌ DEBUG: websocket router inclusion failed: {e}")

try:
    app.include_router(llm_proxy.router, prefix="/api/v1", tags=["llm-proxy"])
    print("✅ DEBUG: llm_proxy router included")
except Exception as e:
    print(f"❌ DEBUG: llm_proxy router inclusion failed: {e}")

try:
    app.include_router(gemini.router, prefix="/api/v1", tags=["gemini-ai"])
    print("✅ DEBUG: gemini router included")
except Exception as e:
    print(f"❌ DEBUG: gemini router inclusion failed: {e}")


@app.get("/")
async def root():
    """Root endpoint."""
    print("🚀 DEBUG: Root endpoint called - version should be 1.0.2")
    print("🚀 DEBUG: This is the main.py file in root directory")
    return {
        "message": "Welcome to TradeLab API",
        "version": "1.0.2",
        "docs": "/docs",
        "status": "deployed_on_railway_debug_v2",
        "debug": "This is the root main.py file",
        "timestamp": "2025-09-30T18:30:00Z",
        "file_location": "root/main.py"
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
    print("🚀 DEBUG: Starting uvicorn server...")
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 DEBUG: Starting server on port {port}")
    print(f"🚀 DEBUG: Environment variables: PORT={os.environ.get('PORT', 'NOT_SET')}")
    uvicorn.run(app, host="0.0.0.0", port=port)

