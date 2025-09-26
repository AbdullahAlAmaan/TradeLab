"""Configuration settings for the TradeLab backend."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_db_password: str
    
    # Alpaca Configuration
    alpaca_api_key: str
    alpaca_secret_key: str
    alpaca_base_url: str = "https://paper-api.alpaca.markets"
    
    # Binance Configuration
    binance_api_key: str
    binance_secret_key: str
    binance_base_url: str = "https://testnet.binance.vision"
    
    # Application Configuration
    debug: bool = False
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

