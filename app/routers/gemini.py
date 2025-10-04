"""
Gemini AI Router - Uses Google's Gemini API for AI-powered portfolio analysis.
This replaces the Ollama proxy and works from any deployed environment.
Updated: 2025-01-30 - Gemini Integration
"""

import os
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio
from datetime import datetime

router = APIRouter()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")  # Fast and free model

# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
else:
    model = None

class GeminiRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    stream: bool = False

class GeminiResponse(BaseModel):
    response: str
    model: str
    timestamp: str
    tokens_used: Optional[int] = None

class GeminiHealthResponse(BaseModel):
    status: str
    model: str
    api_key_configured: bool
    error: Optional[str] = None

@router.get("/gemini/health", response_model=GeminiHealthResponse)
async def gemini_health_check():
    """Check if Gemini API is properly configured and accessible."""
    try:
        if not GEMINI_API_KEY:
            return GeminiHealthResponse(
                status="unhealthy",
                model=GEMINI_MODEL,
                api_key_configured=False,
                error="GEMINI_API_KEY environment variable not set"
            )
        
        if not model:
            return GeminiHealthResponse(
                status="unhealthy",
                model=GEMINI_MODEL,
                api_key_configured=True,
                error="Failed to initialize Gemini model"
            )
        
        # Test with a simple request
        print(f"🚀 DEBUG: Testing Gemini with model: {GEMINI_MODEL}")
        test_response = model.generate_content("Hello")
        print(f"🚀 DEBUG: Gemini response: {test_response}")
        if test_response and test_response.text:
            return GeminiHealthResponse(
                status="healthy",
                model=GEMINI_MODEL,
                api_key_configured=True,
                error=None
            )
        else:
            return GeminiHealthResponse(
                status="unhealthy",
                model=GEMINI_MODEL,
                api_key_configured=True,
                error="Gemini API returned empty response"
            )
            
    except Exception as e:
        return GeminiHealthResponse(
            status="unhealthy",
            model=GEMINI_MODEL,
            api_key_configured=bool(GEMINI_API_KEY),
            error=f"Gemini API error: {str(e)}"
        )

@router.post("/gemini/generate", response_model=GeminiResponse)
async def generate_gemini_response(request: GeminiRequest):
    """Generate AI response using Gemini API."""
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
            )
        
        if not model:
            raise HTTPException(
                status_code=503,
                detail="Gemini model not initialized"
            )
        
        # Build context-aware prompt
        full_prompt = request.prompt
        
        if request.context:
            context_str = json.dumps(request.context, indent=2)
            full_prompt = f"""You are a financial AI assistant helping with portfolio analysis and trading strategies.

Context Data:
{context_str}

User Question: {request.prompt}

Please provide a helpful, accurate response based on the context data provided. If the context doesn't contain relevant information, provide general financial advice."""
        
        # Generate response
        print(f"🚀 DEBUG: Generating response with prompt: {full_prompt[:100]}...")
        response = model.generate_content(full_prompt)
        print(f"🚀 DEBUG: Response object: {response}")
        
        if response and response.text:
            return GeminiResponse(
                response=response.text,
                model=GEMINI_MODEL,
                timestamp=datetime.utcnow().isoformat(),
                tokens_used=None  # Gemini doesn't always provide usage metadata
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Gemini API returned empty response"
            )
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating Gemini response: {str(e)}"
        )

@router.post("/gemini/stream")
async def stream_gemini_response(request: GeminiRequest):
    """Stream AI response using Gemini API (simulated streaming)."""
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Gemini API key not configured"
            )
        
        if not model:
            raise HTTPException(
                status_code=503,
                detail="Gemini model not initialized"
            )
        
        # Build context-aware prompt
        full_prompt = request.prompt
        
        if request.context:
            context_str = json.dumps(request.context, indent=2)
            full_prompt = f"""You are a financial AI assistant helping with portfolio analysis and trading strategies.

Context Data:
{context_str}

User Question: {request.prompt}

Please provide a helpful, accurate response based on the context data provided."""
        
        # Generate response
        response = model.generate_content(full_prompt)
        
        if not response or not response.text:
            raise HTTPException(
                status_code=500,
                detail="Gemini API returned empty response"
            )
        
        # Simulate streaming by chunking the response
        async def generate_chunks():
            text = response.text
            chunk_size = 50  # Characters per chunk
            
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
                await asyncio.sleep(0.05)  # Small delay to simulate streaming
            
            # Send final chunk
            yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
        
        return StreamingResponse(
            generate_chunks(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error streaming Gemini response: {str(e)}"
        )

@router.get("/gemini/models")
async def get_available_models():
    """Get list of available Gemini models."""
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Gemini API key not configured"
            )
        
        # Return available models (Gemini API doesn't have a models endpoint like OpenAI)
        available_models = [
            {
                "id": "gemini-2.0-flash",
                "name": "Gemini 2.0 Flash",
                "description": "Fast and efficient model for most tasks",
                "context_length": 1048576,
                "free": True
            },
            {
                "id": "gemini-2.5-flash",
                "name": "Gemini 2.5 Flash", 
                "description": "Latest and most capable model",
                "context_length": 2097152,
                "free": True
            },
            {
                "id": "gemini-2.5-pro",
                "name": "Gemini 2.5 Pro", 
                "description": "Most capable model for complex tasks",
                "context_length": 2097152,
                "free": True
            }
        ]
        
        return {
            "models": available_models,
            "current_model": GEMINI_MODEL,
            "api_key_configured": bool(GEMINI_API_KEY)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting models: {str(e)}"
        )
