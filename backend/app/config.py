"""Configuration settings for the TradeLab backend."""

import os
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Environment
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    # Supabase Configuration
    supabase_url: str = "http://localhost:54321"  # Default for local development
    supabase_anon_key: str = "your_anon_key_here"
    supabase_service_role_key: str = "your_service_role_key_here"
    supabase_jwt_secret: Optional[str] = None  # Required for JWT verification
    supabase_db_password: str = "password"
    
    # Database Configuration
    database_url: Optional[str] = None  # Override automatic construction
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_timeout: int = 30
    
    # Alpaca Configuration
    alpaca_api_key: str = "your_alpaca_api_key"
    alpaca_secret_key: str = "your_alpaca_secret_key"
    alpaca_base_url: str = "https://paper-api.alpaca.markets"
    
    # Binance Configuration
    binance_api_key: str = "your_binance_api_key"
    binance_secret_key: str = "your_binance_secret_key"
    binance_base_url: str = "https://testnet.binance.vision"
    
    # AI Configuration (Local Ollama - frontend direct connection)
    # No server-side AI API keys required - users connect directly to their local Ollama
    ai_enabled: bool = True
    
    # Application Configuration
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174,https://trade-lab-mu.vercel.app"
    allowed_hosts: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    
    # Security Configuration
    secret_key: str = "your-super-secret-key-change-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # WebSocket Configuration
    websocket_heartbeat_interval: int = 30
    websocket_timeout: int = 300
    
    # Data Configuration
    max_data_points_per_request: int = 1000
    default_data_days: int = 30
    cache_ttl_seconds: int = 300
    
    # Risk Configuration
    max_portfolio_value: float = 1000000.0  # $1M limit for paper trading
    max_position_size_percent: float = 0.2  # 20% max position size
    default_risk_free_rate: float = 0.02  # 2% risk-free rate
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    def validate_settings(self) -> List[str]:
        """Validate critical settings and return list of warnings/errors."""
        warnings = []
        
        if self.is_production:
            if self.secret_key == "your-super-secret-key-change-in-production":
                warnings.append("SECRET_KEY not set for production")
            if not self.supabase_jwt_secret:
                warnings.append("SUPABASE_JWT_SECRET not set for production")
            if self.debug:
                warnings.append("DEBUG mode enabled in production")
        
        if self.supabase_url == "http://localhost:54321" and self.is_production:
            warnings.append("Using local Supabase URL in production")
            
        return warnings
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


# Global settings instance
settings = Settings()

# Validate settings on startup
startup_warnings = settings.validate_settings()
if startup_warnings:
    import logging
    logger = logging.getLogger(__name__)
    for warning in startup_warnings:
        logger.warning(f"Configuration warning: {warning}")

# Set debug mode based on environment
if os.getenv("ENVIRONMENT", "").lower() == "production":
    settings.debug = False

