import requests
import os
from typing import Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, Header

from app.schemas import EventOut
from app.models import Event

# Token validation function


async def validate_token(token: str) -> Optional[Dict]:
    """
    Validate JWT token by calling NextAuth API
    Returns user data if valid, None if invalid
    """
    try:
        nextauth_url = os.getenv("NEXTAUTH_URL", "http://localhost:3000")
        response = requests.post(
            f"{nextauth_url}/api/auth/validate",
            json={"token": token},
            timeout=5,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("user") if data.get("valid") else None

        return None

    except requests.RequestException as e:
        print(f"Error validating token: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error during token validation: {e}")
        return None

# Dependency to get current user


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict:
    """
    FastAPI dependency to validate authorization and return current user
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )

    if not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected 'Bearer <token>'"
        )

    try:
        token = authorization.split(' ')[1]
    except IndexError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    user_data = await validate_token(token)

    if not user_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return user_data
