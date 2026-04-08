from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from models import User, Customer, Account, Transaction, UserRole
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/manager", tags=["manager"])


def _verify_admin(user_info: AuthDep):
    """Helper to ensure the requesting user is an admin."""
    # Based on your delete route, user_info.role might evaluate to the string "admin"
    # or the Enum UserRole.ADMIN. Checking both/either keeps it safe.
    if user_info.role != "admin" and user_info.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required.",
        )


@router.get("/users")
def get_all_users(user_info: AuthDep, session: SessionDep):
    """
    GET /manager/users
    Returns all users in the database (excluding password hashes).
    Requires admin authentication.
    """
    _verify_admin(user_info)
    try:
        users = session.exec(select(User)).all()

        # Manually construct the response to ensure password_hash is NEVER sent to the frontend
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


@router.get("/customers")
def get_all_customers(user_info: AuthDep, session: SessionDep):
    """
    GET /manager/customers
    Returns all customers in the database.
    Requires admin authentication.
    """
    _verify_admin(user_info)
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


@router.get("/accounts")
def get_all_accounts(user_info: AuthDep, session: SessionDep):
    """
    GET /manager/accounts
    Returns all accounts in the database.
    Requires admin authentication.
    """
    _verify_admin(user_info)
    try:
        accounts = session.exec(select(Account)).all()
        return accounts

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching accounts",
        )


@router.get("/transactions")
def get_all_transactions(user_info: AuthDep, session: SessionDep):
    """
    GET /manager/transactions
    Returns all transactions in the database.
    Requires admin authentication.
    """
    _verify_admin(user_info)
    try:
        transactions = session.exec(select(Transaction)).all()
        return transactions

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching transactions",
        )
