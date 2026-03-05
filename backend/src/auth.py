import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from fastapi import HTTPException, status
from fastapi.requests import Request

# JWT config
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 hours


def hash_password(password: str) -> bytes:
    """
    Hash a password using bcrypt.
    Returns the hashed_password (which includes the salt)
    """
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed


def verify_password(plain_password: str, hashed_password: bytes) -> bool:
    """
    Verify a password against its hash.
    Returns True if the password is correct, False otherwise.
    """
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password)


def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token for a user.
    Returns the encoded token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "user_id": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Decode and verify the token.

    Returns:
        The decoded token payload if valid.
    Raises:
        HTTPException with 401 status (Unauthorized) if the token is invalid or expired.

    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


def get_token_from_request(request: Request) -> str:
    """
    Extract JWT token from cookies.

    Returns:
        The JWT token.

    Raises:
        HTTPException with 401 status (Unauthorized) if the token is not found in the cookies.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return token


def get_current_user_id(request: Request) -> int:
    """
    Get the current user ID from the request token.

    Returns:
        The user ID extracted from the token.
    Raises:
        HTTPException with 401 status (Unauthorized) if:
            - The token is not found in the cookies.
            - The token is invalid or expired.
    """
    token = get_token_from_request(request)
    payload = verify_token(token)
    user_id_str = payload.get("user_id")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    user_id = int(user_id_str)
    return user_id
