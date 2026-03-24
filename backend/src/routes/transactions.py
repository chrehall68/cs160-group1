from fastapi import APIRouter, HTTPException, status
from sqlmodel import select, func

from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from models import Account, Transaction, LedgerEntry
from dtos.transactions import TransactionResponse
from lib.users import get_associated_user
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.get("/transactions/{account_id}")
def get_account_transactions(
    account_id: int,
    session: SessionDep,
    user_info: AuthDep,
    page: int = 1,
    limit: int = 10,
):
    """
    Gets transactions for the associated account

    Query Parameters:
    - page (int): the 1-based page of results to fetch
    - limit (int): how many results to return per page
    """
    if limit <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="limit must be positive"
        )
    if page <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="page must be positive"
        )

    # verify account
    value_stmt = select(Account).where(Account.account_id == account_id)
    account = session.exec(value_stmt).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    # verify account belongs to user
    user = get_associated_user(account.customer_id, session)
    if not user or user.user_id != user_info.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )

    try:
        offset = (page - 1) * limit
        # transaction id is autoincrement, so larger id -> happened later
        # so to get recent transactions first, we just reverse the order
        value_stmt = (
            select(LedgerEntry, Transaction)
            .where(LedgerEntry.account_id == account_id)
            .join(Transaction, LedgerEntry.transaction_id == Transaction.transaction_id)  # type: ignore
            .order_by(-LedgerEntry.transaction_id)  # type: ignore
            .offset(offset)
            .limit(limit)
        )
        count_stmt = (
            select(func.count("*"))
            .select_from(LedgerEntry)
            .where(LedgerEntry.account_id == account_id)
        )
        results = session.exec(value_stmt).all()
        count = session.exec(count_stmt).one()

        pages = (count + limit - 1) // limit
        results = [
            TransactionResponse(
                transaction_id=e[1].transaction_id,  # type: ignore
                type=e[0].type,
                amount=e[1].amount,
                currency=e[1].currency,
                created_at=e[1].created_at,
            )
            for e in results
        ]

        return {"transactions": results, "total_pages": pages}

    except Exception as e:
        session.rollback()
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get transactions",
        )
