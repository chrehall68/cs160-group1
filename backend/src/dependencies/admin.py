from fastapi import HTTPException, status, Depends
from typing import Annotated
from dependencies.auth import AuthDep, UserInfo


def verify_admin(user_info: AuthDep):
    """Dependency that ensures the requesting user is an admin."""
    if user_info.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required.",
        )
    return user_info


AdminDep = Annotated[UserInfo, Depends(verify_admin)]
