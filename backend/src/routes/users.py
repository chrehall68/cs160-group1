from fastapi import APIRouter, HTTPException, status, Response, Request
from sqlmodel import select
from dependencies.db import SessionDep
from dependencies.admin import AdminDep
from models import User, Customer, Account, AccountStatus
from dtos.users import LoginRequest, RegisterRequest
from dependencies.auth import (
    AuthDep,
    hash_password,
    verify_password,
    create_access_token,
)
from datetime import datetime, timezone
from lib.utils import get_or_create_address
import logging

logger = logging.getLogger("uvicorn.error")

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
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )


@router.get("/customer")
def get_user_info(user_info: AuthDep, session: SessionDep):
    """
    GET /customer
    Returns the current user's attached customer's nonsensitive information.
    Requires authentication.
    """

    user = session.get(User, user_info.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    # just in case the user deleted their customer info
    if not user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no customer information",
        )
    customer = user.customer
    assert customer is not None  # for mypy

    return {
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "email": customer.email,
        "phone": customer.phone_number,
    }


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

        # Check if SSN already exists
        customer_check = select(Customer).where(Customer.ssn == request.ssn)
        existing_customer = session.exec(customer_check).first()
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SSN already exists",
            )

        # Create address
        address = get_or_create_address(
            street=request.address.street,
            city=request.address.city,
            state=request.address.state,
            zipcode=request.address.zipcode,
            country=request.address.country,
            unit=request.address.unit,
            session=session,
        )

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
        session.commit()
        session.refresh(user)  # that way we get the user id
        # ====== end of db operations ======

        if user.user_id is None:
            session.rollback()
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
        logger.exception(e)
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
        if user_info.user_id != user_id and user_info.role != "admin":
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
        logger.exception(e)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )


@router.get("/manager/users")
def get_all_users(user_info: AdminDep, session: SessionDep):
    """
    GET /manager/users
    Returns all users in the database (excluding password hashes).
    Requires admin authentication.
    """
    try:
        users = session.exec(select(User)).all()

        safe_users = [
            {
                "user_id": u.user_id,
                "customer_id": u.customer_id,
                "username": u.username,
                "role": u.role,
                "status": u.status,
                "last_login": u.last_login,
                "created_at": u.created_at,
            }
            for u in users
        ]
        return safe_users

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching users",
        )


@router.get("/manager/customers")
def get_all_customers(user_info: AdminDep, session: SessionDep):
    """
    GET /manager/customers
    Returns all customers in the database.
    Requires admin authentication.
    """
    try:
        customers = session.exec(select(Customer)).all()
        return customers

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching customers",
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
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )
