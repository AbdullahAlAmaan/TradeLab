"""WebSocket endpoints for real-time market data and updates."""

import asyncio
import json
import logging
from typing import Dict, Set, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.websockets import WebSocketState
import yfinance as yf
try:
    from binance import ThreadedWebSocketManager
except ImportError:
    # Fallback for older binance versions
    try:
        from binance.websockets import BinanceSocketManager as ThreadedWebSocketManager
    except ImportError:
        ThreadedWebSocketManager = None
        
from app.config import settings
from app.auth import get_current_user
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time data streaming."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_subscriptions: Dict[str, Set[str]] = {}  # user_id -> set of symbols
        self.symbol_subscribers: Dict[str, Set[str]] = {}  # symbol -> set of user_ids
        self.binance_manager = None
        self.price_cache: Dict[str, Dict] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """Accept WebSocket connection and assign connection ID."""
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        self.user_subscriptions[user_id] = set()
        
        logger.info(f"WebSocket connected: user {user_id}, connection {connection_id}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection",
            "status": "connected",
            "connection_id": connection_id,
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)
        
        return connection_id
    
    def disconnect(self, connection_id: str, user_id: str):
        """Remove WebSocket connection and clean up subscriptions."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            
        # Clean up subscriptions
        if user_id in self.user_subscriptions:
            for symbol in self.user_subscriptions[user_id]:
                if symbol in self.symbol_subscribers:
                    self.symbol_subscribers[symbol].discard(user_id)
                    if not self.symbol_subscribers[symbol]:
                        del self.symbol_subscribers[symbol]
            del self.user_subscriptions[user_id]
        
        logger.info(f"WebSocket disconnected: user {user_id}, connection {connection_id}")
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send message to specific connection."""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to {connection_id}: {e}")
            else:
                logger.warning(f"WebSocket {connection_id} not connected")
    
    async def broadcast_to_symbol_subscribers(self, symbol: str, message: dict):
        """Broadcast message to all users subscribed to a symbol."""
        if symbol in self.symbol_subscribers:
            for user_id in self.symbol_subscribers[symbol]:
                for connection_id, websocket in self.active_connections.items():
                    if websocket.client_state == WebSocketState.CONNECTED:
                        try:
                            await websocket.send_text(json.dumps(message))
                        except Exception as e:
                            logger.error(f"Error broadcasting to {connection_id}: {e}")
    
    def subscribe_to_symbol(self, user_id: str, symbol: str, asset_type: str):
        """Subscribe user to symbol updates."""
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        
        self.user_subscriptions[user_id].add(symbol)
        
        if symbol not in self.symbol_subscribers:
            self.symbol_subscribers[symbol] = set()
        
        self.symbol_subscribers[symbol].add(user_id)
        
        logger.info(f"User {user_id} subscribed to {symbol} ({asset_type})")
        
        # Start data streaming for this symbol if not already started
        if asset_type == "crypto":
            self._start_crypto_stream(symbol)
        else:
            self._start_stock_stream(symbol)
    
    def unsubscribe_from_symbol(self, user_id: str, symbol: str):
        """Unsubscribe user from symbol updates."""
        if user_id in self.user_subscriptions:
            self.user_subscriptions[user_id].discard(symbol)
        
        if symbol in self.symbol_subscribers:
            self.symbol_subscribers[symbol].discard(user_id)
            if not self.symbol_subscribers[symbol]:
                del self.symbol_subscribers[symbol]
                # Stop streaming if no subscribers
                self._stop_symbol_stream(symbol)
        
        logger.info(f"User {user_id} unsubscribed from {symbol}")
    
    def _start_crypto_stream(self, symbol: str):
        """Start Binance WebSocket stream for crypto symbol."""
        try:
            if ThreadedWebSocketManager is None:
                logger.warning("ThreadedWebSocketManager not available, skipping crypto stream")
                return
                
            if not self.binance_manager:
                self.binance_manager = ThreadedWebSocketManager(
                    api_key=settings.binance_api_key,
                    api_secret=settings.binance_secret_key,
                    testnet=False
                )
                self.binance_manager.start()
            
            # Subscribe to ticker stream
            stream_name = f"{symbol.lower()}usdt@ticker"
            self.binance_manager.start_symbol_ticker_socket(
                callback=self._handle_binance_message,
                symbol=f"{symbol}USDT"
            )
            
            logger.info(f"Started Binance stream for {symbol}")
            
        except Exception as e:
            logger.error(f"Failed to start Binance stream for {symbol}: {e}")
    
    def _start_stock_stream(self, symbol: str):
        """Start stock price streaming (using periodic updates)."""
        # For stocks, we'll use periodic price updates since Yahoo Finance doesn't have WebSocket
        asyncio.create_task(self._periodic_stock_update(symbol))
    
    async def _periodic_stock_update(self, symbol: str):
        """Periodically fetch and broadcast stock prices."""
        while symbol in self.symbol_subscribers and self.symbol_subscribers[symbol]:
            try:
                ticker = yf.Ticker(symbol)
                data = ticker.history(period="1d", interval="1m")
                
                if not data.empty:
                    latest = data.iloc[-1]
                    price_data = {
                        "type": "price_update",
                        "symbol": symbol,
                        "asset_type": "stock",
                        "price": float(latest['Close']),
                        "change": float(latest['Close'] - data.iloc[-2]['Close']) if len(data) > 1 else 0,
                        "change_percent": float((latest['Close'] - data.iloc[-2]['Close']) / data.iloc[-2]['Close'] * 100) if len(data) > 1 else 0,
                        "volume": int(latest['Volume']),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    await self.broadcast_to_symbol_subscribers(symbol, price_data)
                    self.price_cache[symbol] = price_data
                
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in stock update for {symbol}: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    def _handle_binance_message(self, msg):
        """Handle Binance WebSocket messages."""
        try:
            symbol = msg['s'].replace('USDT', '')
            price_data = {
                "type": "price_update",
                "symbol": symbol,
                "asset_type": "crypto",
                "price": float(msg['c']),
                "change": float(msg['P']),
                "change_percent": float(msg['p']),
                "volume": float(msg['v']),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Use asyncio to broadcast (since this callback is sync)
            asyncio.create_task(self.broadcast_to_symbol_subscribers(symbol, price_data))
            self.price_cache[symbol] = price_data
            
        except Exception as e:
            logger.error(f"Error handling Binance message: {e}")
    
    def _stop_symbol_stream(self, symbol: str):
        """Stop streaming for a symbol."""
        logger.info(f"Stopping stream for {symbol}")
        # Implementation depends on the streaming method used


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time market data."""
    
    # Note: WebSocket authentication is more complex
    # For now, we'll accept connections and handle auth via message
    user_id = None
    connection_id = None
    
    try:
        connection_id = await manager.connect(websocket, "anonymous")
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "authenticate":
                # Handle authentication
                token = message.get("token")
                if token:
                    # Verify token (simplified for demo)
                    user_id = "authenticated_user"  # In real implementation, verify JWT
                    await manager.send_personal_message({
                        "type": "auth_success",
                        "user_id": user_id
                    }, connection_id)
                else:
                    await manager.send_personal_message({
                        "type": "auth_error",
                        "message": "Token required"
                    }, connection_id)
            
            elif message_type == "subscribe":
                if user_id:
                    symbol = message.get("symbol")
                    asset_type = message.get("asset_type", "stock")
                    if symbol:
                        manager.subscribe_to_symbol(user_id, symbol.upper(), asset_type)
                        await manager.send_personal_message({
                            "type": "subscribed",
                            "symbol": symbol.upper(),
                            "asset_type": asset_type
                        }, connection_id)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "Authentication required"
                    }, connection_id)
            
            elif message_type == "unsubscribe":
                if user_id:
                    symbol = message.get("symbol")
                    if symbol:
                        manager.unsubscribe_from_symbol(user_id, symbol.upper())
                        await manager.send_personal_message({
                            "type": "unsubscribed",
                            "symbol": symbol.upper()
                        }, connection_id)
            
            elif message_type == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, connection_id)
            
            else:
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                }, connection_id)
    
    except WebSocketDisconnect:
        if connection_id and user_id:
            manager.disconnect(connection_id, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if connection_id and user_id:
            manager.disconnect(connection_id, user_id)


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status and statistics."""
    return {
        "active_connections": len(manager.active_connections),
        "total_subscriptions": sum(len(subs) for subs in manager.user_subscriptions.values()),
        "symbols_tracked": len(manager.symbol_subscribers),
        "cached_prices": len(manager.price_cache),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ws/prices")
async def get_cached_prices():
    """Get currently cached real-time prices."""
    return {
        "prices": manager.price_cache,
        "count": len(manager.price_cache),
        "timestamp": datetime.utcnow().isoformat()
    }
