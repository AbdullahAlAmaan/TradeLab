"""
LLM Proxy Router - Forwards requests to Ollama running on a server.
This allows the Vercel frontend to use AI features even when deployed.
"""

import httpx
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import asyncio

router = APIRouter()

class LLMRequest(BaseModel):
    model: str = "wizardlm2:latest"
    prompt: str
    stream: bool = True
    options: Optional[dict] = None

class LLMResponse(BaseModel):
    model: str
    response: str
    done: bool = True

# Configuration - you can set this via environment variables
OLLAMA_HOST = "http://localhost:11434"  # Change this to your Ollama server URL

@router.post("/llm/generate", response_model=LLMResponse)
async def generate_response(request: LLMRequest):
    """
    Generate a response using Ollama.
    This endpoint proxies requests to Ollama running on a server.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Prepare the request to Ollama
            ollama_request = {
                "model": request.model,
                "prompt": request.prompt,
                "stream": request.stream,
                "options": request.options or {}
            }
            
            # Make request to Ollama
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json=ollama_request,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama API error: {response.text}"
                )
            
            if request.stream:
                # Handle streaming response
                return StreamingResponse(
                    stream_ollama_response(response),
                    media_type="text/plain"
                )
            else:
                # Handle non-streaming response
                data = response.json()
                return LLMResponse(
                    model=data.get("model", request.model),
                    response=data.get("response", ""),
                    done=data.get("done", True)
                )
                
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama server is not accessible. Please ensure Ollama is running on the server."
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request to Ollama timed out. The model might be too slow or the server is overloaded."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Ollama: {str(e)}"
        )

async def stream_ollama_response(response):
    """Stream the response from Ollama line by line."""
    async for line in response.aiter_lines():
        if line.strip():
            try:
                data = json.loads(line)
                if "response" in data:
                    yield data["response"]
                if data.get("done", False):
                    break
            except json.JSONDecodeError:
                continue

@router.get("/llm/models")
async def get_available_models():
    """Get list of available models from Ollama."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama API error: {response.text}"
                )
            
            data = response.json()
            return {
                "models": data.get("models", []),
                "ollama_host": OLLAMA_HOST
            }
            
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama server is not accessible. Please ensure Ollama is running on the server."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Ollama: {str(e)}"
        )

@router.get("/llm/health")
async def check_ollama_health():
    """Check if Ollama is running and accessible."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "healthy",
                    "ollama_host": OLLAMA_HOST,
                    "models_available": len(data.get("models", [])),
                    "models": [m.get("name", "unknown") for m in data.get("models", [])]
                }
            else:
                return {
                    "status": "unhealthy",
                    "ollama_host": OLLAMA_HOST,
                    "error": f"HTTP {response.status_code}"
                }
                
    except Exception as e:
        return {
            "status": "unhealthy",
            "ollama_host": OLLAMA_HOST,
            "error": str(e)
        }
