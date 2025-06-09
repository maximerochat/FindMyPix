import requests
import os
from typing import Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, Header

# Token validation function


async def validate_token(token: str) -> Optional[Dict]:
    """
    Validate JWT token by calling NextAuth API
    Returns user data if valid, None if invalid
    """
    try:
        nextauth_url = os.getenv("NEXTAUTH_URL", "http://localhost:3000")
        test_tok = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjdYVUwwLW4wOHMtVHFMaHR2eVV4Y25zekJzLXlZTzhpbG82cVEzWGZaTUpOUVd0TDN1dUNtcExwWHNFR01ZVElWY2hVWDZWV3hXcHBKbTN2MUhrZ3cifQ..g-HN1FchVvXl3nFclY-h9A.SmMBlFVPEmhHrBLU9ReN0Xv7WircvGG9fwNoEpzOEqCn5_Xx99UCv9YAY4OBkYHfvGCMuitcrNryrDWR1OhMhwQHqiG53SSj-FO_US9hN81ZXL1BembCAnGwDUEwBg5spTs38Dj7Y-mUfQKodVSk9KODFl4OpUSXEpCKf541r3oQsP38nVP9i-Jtno7X5iAQblmArp-NUu51s8FtgkfKkmU0ZCTVIekOeVqkqUM5CHL9Z_leZEN8VpXNX0Hrsxf-8-4x5TS03dagB80tbZj70KCSKIyiWYy0QfyrtqT-tMs.4_FG__-oM6EQvvbZ8ouEtYmUGVaxvOWacV9THlkA-wI"
        response = requests.post(
            f"{nextauth_url}/api/auth/validate",
            json={"token": token},
            timeout=5,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("user") if data.get("valid") else None

        print(f"Token validation failed with status: {response.status_code}")
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
    print("Token is ", token)
    user_data = await validate_token(token)
    print("User data: ", user_data)

    if not user_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return user_data
