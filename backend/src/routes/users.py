import sys
import traceback
from fastapi import APIRouter, HTTPException, status, Response, Request
from sqlmodel import select
from dependencies.db import SessionDep
from models import User, Customer, Address, Account, AccountStatus
from dtos.users import LoginRequest, RegisterRequest
from dependencies.auth import (
    AuthDep,
    hash_password,
    verify_password,
    create_access_token,
)
from datetime import datetime, timezone

router = APIRouter()


@router.post("/login")
def login(request: LoginRequest, session: SessionDep, response: Response):
    """
    POST /login
    Validates user credentials and returns JWT token as cookie.
    """
    try:
        # Find user by username
        statement = select(User).where(User.username == request.username)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid username or password",
            )

        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid username or password",
            )

        # Create JWT token
        if user.user_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User ID not found",
            )
        access_token = create_access_token(user.user_id, user.role)

        # Set JWT as httponly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="strict",
        )

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        session.add(user)
        session.commit()

        return {
            "access_token": access_token,
            "role": user.role.value,
            "user_id": user.user_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/user")
def register(request: RegisterRequest, session: SessionDep, response: Response):
    """
    POST /user
    Registers a new user and logs them in by returning JWT token as cookie.

    Returns:
        The created user.

    Raises:
        HTTPException with 400 status (Bad Request) if:
            - Username already exists.
            - Any validation error occurs during user creation (e.g. invalid phone number, SSN, or date of birth).
    """
    try:
        # ===== start of db operations =====
        # Check if username already exists
        statement = select(User).where(User.username == request.username)
        existing_user = session.exec(statement).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )

        # Create address
        address = Address(
            street=request.address.street,
            unit=request.address.unit,
            city=request.address.city,
            state=request.address.state,
            zip_code=request.address.zipcode,
            country=request.address.country,
        )
        session.add(address)
        session.flush()

        # Create customer
        customer = Customer(
            first_name=request.first_name,
            last_name=request.last_name,
            date_of_birth=request.date_of_birth,
            email=request.email,
            phone_number=request.phone,
            address_id=address.address_id,
            ssn=request.ssn,
        )
        session.add(customer)
        session.flush()

        # Create user
        password_hash = hash_password(request.password)
        user = User(
            customer_id=customer.customer_id,
            username=request.username,
            password_hash=password_hash,
        )
        session.add(user)
        session.flush()
        session.commit()  # commits to db
        session.refresh(user)  # that way we get the user id
        # ====== end of db operations ======

        if user.user_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to insert user",
            )
        access_token = create_access_token(user.user_id, user.role)

        # Set JWT as httponly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="strict",
        )

        return {
            "access_token": access_token,
            "role": user.role.value,
            "user_id": user.user_id,
        }

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )


@router.delete("/user/{user_id}")
def delete_user(
    user_id: int,
    session: SessionDep,
    user_info: AuthDep,
    response: Response,
):
    """
    DELETE /user/{user_id}
    Deletes a user if they have no open accounts. Requires authentication.
    """
    try:
        # check that the user is deleting their own account
        # or this is an admin
        if user_info != user_id and user_info.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete another user's account",
            )

        # Get user
        statement = select(User).where(User.user_id == user_id)
        user = session.exec(statement).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check if user has any open accounts
        if user.customer_id:
            account_statement = select(Account).where(
                Account.customer_id == user.customer_id,
                Account.status == AccountStatus.ACTIVE,
            )
            open_accounts = session.exec(account_statement).all()

            if open_accounts:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete user with open accounts",
                )

        # delete the user
        session.delete(user)
        session.commit()

        # remove JWT cookie
        response.delete_cookie("access_token")

        return {}

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        traceback.print_exc(file=sys.stderr)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )


@router.post("/logout")
def logout(request_obj: Request, response: Response):
    """
    POST /logout
    Logs a user out by removing the JWT cookie. Requires authentication.
    """
    try:
        if request_obj.cookies.get("access_token") is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        # remove JWT cookie
        # don't need to verify it since we're just deleting it
        response.delete_cookie("access_token")

        return {}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )
