import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
import bcrypt
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.requests import Request
from dataclasses import dataclass

# somewhat taken from https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
# JWT config
# use openssl rand -hex 32 to generate a secure random key
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 hours


@dataclass
class UserInfo:
    user_id: int
    role: str


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


def create_access_token(
    user_id: int, role: str, expires_delta: Optional[timedelta] = None
) -> str:
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
        "user_id": user_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> UserInfo:
    """
        Decode and verify the token.
    dict
        Returns:
            The decoded token payload if valid.
        Raises:
            HTTPException with 401 status (Unauthorized) if the token is invalid or expired.

    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("user_id")
        role: str | None = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return UserInfo(user_id=user_id, role=role)
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


def get_user_info(request: Request) -> UserInfo:
    """
    Get the current user ID and role from the request token.

    Returns:
        The user ID and role extracted from the token.
    Raises:
        HTTPException with 401 status (Unauthorized) if:
            - The token is not found in the cookies.
            - The token is invalid or expired.
    """
    token = get_token_from_request(request)
    data = verify_token(token)
    import sys

    print(data, file=sys.stderr)
    return data


AuthDep = Annotated[UserInfo, Depends(get_user_info)]
