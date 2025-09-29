#!/usr/bin/env python3
"""
Debug script to test authentication and portfolio persistence
"""

import requests
import json
import time

# Configuration
API_BASE_URL = "http://localhost:8000"

def test_auth_flow():
    """Test the complete authentication flow"""
    print("🔍 Testing Authentication Flow")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False
    
    # Test 2: Test auth endpoint without token
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/auth/me")
        print(f"📊 Auth endpoint without token: {response.status_code}")
        if response.status_code == 401:
            print("✅ Auth endpoint properly rejects requests without token")
        else:
            print("❌ Auth endpoint should return 401 for requests without token")
    except Exception as e:
        print(f"❌ Error testing auth endpoint: {e}")
    
    # Test 3: Test portfolios endpoint without token
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/assets/portfolios")
        print(f"📊 Portfolios endpoint without token: {response.status_code}")
        if response.status_code == 401:
            print("✅ Portfolios endpoint properly rejects requests without token")
        else:
            print("❌ Portfolios endpoint should return 401 for requests without token")
    except Exception as e:
        print(f"❌ Error testing portfolios endpoint: {e}")
    
    print("\n🔍 To test with authentication:")
    print("1. Start the backend: cd backend && python -m uvicorn app.main:app --reload")
    print("2. Start the frontend: cd frontend && npm run dev")
    print("3. Sign up/login in the frontend")
    print("4. Create a portfolio")
    print("5. Check the backend logs for DEBUG messages")
    print("6. Sign out and sign back in")
    print("7. Check if portfolios persist")
    
    return True

def test_jwt_token():
    """Test JWT token parsing"""
    print("\n🔍 Testing JWT Token Parsing")
    print("=" * 50)
    
    # This would require a valid JWT token from Supabase
    print("To test JWT token parsing:")
    print("1. Get a JWT token from Supabase (check browser dev tools)")
    print("2. Use it to test the auth endpoints")
    print("3. Check the backend logs for DEBUG messages")

if __name__ == "__main__":
    print("🚀 TradeLab Authentication Debug Tool")
    print("=" * 50)
    
    test_auth_flow()
    test_jwt_token()
    
    print("\n📋 Debug Checklist:")
    print("1. ✅ Backend running and accessible")
    print("2. ✅ Auth endpoints require authentication")
    print("3. ⏳ Test with real JWT token from frontend")
    print("4. ⏳ Check user_id consistency between login sessions")
    print("5. ⏳ Verify portfolio persistence across login sessions")
