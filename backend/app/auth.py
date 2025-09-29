"""Authentication utilities for Supabase JWT validation."""

import logging
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from jose import JWTError, jwt
from app.config import settings
from typing import Optional
import requests

# Set up logging
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Optional[Client] = None
try:
    if settings.supabase_url and settings.supabase_anon_key:
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("Supabase client initialized successfully")
    else:
        logger.warning("Supabase credentials not configured")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

# HTTP Bearer token scheme
security = HTTPBearer()

# Cache for JWT secrets
_jwt_secret_cache = {}


def get_jwt_secret() -> str:
    """Get the JWT secret for token verification."""
    if settings.supabase_jwt_secret:
        return settings.supabase_jwt_secret
    
    # For development, we can use the anon key, but this should be avoided in production
    if settings.debug:
        logger.warning("Using anon key for JWT verification in development mode - not recommended for production")
        return settings.supabase_anon_key
    
    raise ValueError("JWT secret not configured. Please set SUPABASE_JWT_SECRET environment variable.")


def verify_jwt_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload with proper security."""
    try:
        if not token or len(token.split('.')) != 3:
            logger.warning("Invalid token format")
            return None
        
        # Get JWT secret
        try:
            jwt_secret = get_jwt_secret()
        except ValueError as e:
            logger.error(f"JWT secret configuration error: {e}")
            return None
        
        # Verify token with proper validation
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_aud": False  # Supabase doesn't always set audience
                }
            )
            
            # Validate required claims
            if not payload.get("sub"):
                logger.warning("Token missing 'sub' claim")
                return None
                
            if not payload.get("email") and not payload.get("phone"):
                logger.warning("Token missing both 'email' and 'phone' claims")
                return None
            
            logger.debug(f"Token verified successfully for user: {payload.get('email', 'N/A')}")
            return payload
            
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            # In development mode only, provide more lenient validation
            if settings.debug:
                logger.warning("Attempting lenient token validation for development")
                try:
                    payload = jwt.decode(
                        token,
                        jwt_secret,
                        algorithms=["HS256"],
                        options={
                            "verify_signature": False,
                            "verify_exp": False,
                            "verify_iat": False,
                            "verify_aud": False
                        }
                    )
                    if payload.get("sub"):
                        logger.warning("Using unverified token in development mode")
                        return payload
                except Exception as dev_e:
                    logger.error(f"Even lenient validation failed: {dev_e}")
            return None
            
    except Exception as e:
        logger.error(f"Unexpected error in token verification: {e}")
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user from JWT token."""
    try:
        token = credentials.credentials
        payload = verify_jwt_token(token)
        
        if payload is None:
            logger.warning("Token verification failed - invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            logger.warning("Token missing user ID (sub claim)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token - missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Log successful authentication (but not sensitive details in production)
        if settings.debug:
            logger.debug(f"User authenticated: {payload.get('email', 'N/A')} (ID: {user_id})")
        
        # Ensure user_id is a string (UUIDs should be strings for database consistency)
        user_id_str = str(user_id) if user_id else None
        
        user_data = {
            "user_id": user_id_str,
            "email": payload.get("email"),
            "phone": payload.get("phone"),
            "role": payload.get("role", "authenticated"),
            "aud": payload.get("aud"),
            "exp": payload.get("exp"),
            "iat": payload.get("iat")
        }
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Get current user if authenticated, otherwise return None."""
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        logger.debug("Optional authentication failed - returning None")
        return None


def verify_user_access(current_user: dict, resource_user_id: str) -> bool:
    """Verify that the current user has access to a resource owned by resource_user_id."""
    if not current_user or not current_user.get("user_id"):
        return False
    
    # Check if the current user is the owner of the resource
    if current_user["user_id"] == str(resource_user_id):
        return True
    
    # Check for admin role (if implemented)
    if current_user.get("role") == "admin":
        return True
    
    return False


def require_user_access(current_user: dict, resource_user_id: str):
    """Raise HTTPException if user doesn't have access to the resource."""
    if not verify_user_access(current_user, resource_user_id):
        logger.warning(f"Access denied: user {current_user.get('user_id')} attempted to access resource owned by {resource_user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - insufficient permissions"
        )

