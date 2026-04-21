from fastapi import APIRouter, HTTPException, status
import os
from sqlmodel import select, func
import boto3
from types_boto3_s3 import S3Client

from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from dependencies.admin import AdminDep
from models import (
    Account,
    Transaction,
    LedgerEntry,
    User,
    TransactionType,
    ATMDeposit,
    ATM,
    Address,
    OnlineDeposit,
    Withdraw,
    Transfer,
)
from dtos.transactions import TransactionResponse
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


def parse_iso_datetime(value: str, field_name: str) -> datetime:
    """Parse an ISO 8601 date/datetime string into a datetime."""
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a valid ISO 8601 date or datetime",
        ) from exc


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
    user = session.get(User, user_info.user_id)
    if not user or user.customer_id != account.customer_id:
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
                ledger_type=e[0].type,
                transaction_type=e[1].transaction_type,
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


@router.get("/manager/transactions")
def get_all_transactions(
    user_info: AdminDep,
    session: SessionDep,
    page: int = 1,
    limit: int = 10,
    transaction_type: Optional[str] = None,
    transaction_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
):
    """
    GET /manager/transactions
    Returns paginated transactions in the database.
    Requires admin authentication.
    """
    try:
        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="limit must be positive",
            )
        if page <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="page must be positive",
            )

        start = parse_iso_datetime(start_date, "start_date") if start_date else None
        end = parse_iso_datetime(end_date, "end_date") if end_date else None
        if start and end and start > end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be before or equal to end_date",
            )

        query = select(Transaction)
        count_query = select(func.count()).select_from(Transaction)

        if transaction_type:
            query = query.where(Transaction.transaction_type == transaction_type)
            count_query = count_query.where(
                Transaction.transaction_type == transaction_type
            )
        if transaction_status:
            query = query.where(Transaction.status == transaction_status)
            count_query = count_query.where(Transaction.status == transaction_status)
        if start:
            query = query.where(Transaction.created_at >= start)
            count_query = count_query.where(Transaction.created_at >= start)
        if end:
            query = query.where(Transaction.created_at <= end)
            count_query = count_query.where(Transaction.created_at <= end)
        if min_amount is not None:
            query = query.where(Transaction.amount >= min_amount)
            count_query = count_query.where(Transaction.amount >= min_amount)

        total = session.exec(count_query).one()
        total_pages = (total + limit - 1) // limit

        transactions = session.exec(
            query.order_by(-Transaction.transaction_id)  # type: ignore
            .offset((page - 1) * limit)
            .limit(limit)
        ).all()

        return {"data": transactions, "total_pages": total_pages, "page": page}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching transactions",
        )


@router.get("/transactions/{account_id}/{transaction_id}")
def get_transaction(
    user_info: AuthDep, account_id: int, transaction_id: int, session: SessionDep
):
    try:
        logger.debug(f"Transaction id: {transaction_id}")
        transaction = session.get(Transaction, transaction_id)
        logger.info(f"Transaction: {transaction}")

        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
            )
        account = session.get(Account, account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )

        user = session.get(User, user_info.user_id)
        if not user or account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your account"
            )
        if account not in transaction.accounts:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your transaction"
            )
        # get additional info about the transaction
        transaction_type = transaction.transaction_type
        match transaction_type:
            case TransactionType.ATM_DEPOSIT:
                # get the atm deposit
                stmt = select(ATMDeposit).where(
                    ATMDeposit.transaction_id == transaction_id
                )
                atm_deposit = session.exec(stmt).one()
                assert atm_deposit
                # get the ATM address
                atm = session.get(ATM, atm_deposit.atm_id)
                address = session.get(Address, atm.address_id) if atm else None
                return {
                    "transaction": transaction,
                    "atm_deposit": atm_deposit,
                    "atm_address": (
                        f"{address.street}, {address.city}, {address.state} {address.zip_code}"
                        if address
                        else None
                    ),
                }
            case TransactionType.ONLINE_DEPOSIT:
                # get the online deposit
                stmt = select(OnlineDeposit).where(
                    OnlineDeposit.transaction_id == transaction_id
                )
                online_deposit = session.exec(stmt).one()
                assert online_deposit
                # then presign a url for the check image
                client: S3Client = boto3.client("s3")
                AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
                presigned_url = client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": AWS_S3_BUCKET, "Key": f"{transaction_id}.png"},
                    ExpiresIn=3600,  # 1 hour
                )
                return {
                    "transaction": transaction,
                    "online_deposit": online_deposit,
                    "check_image_url": presigned_url,
                }
            case TransactionType.WITHDRAWAL:
                # get the withdrawal
                stmt = select(Withdraw).where(Withdraw.transaction_id == transaction_id)
                withdrawal = session.exec(stmt).one()
                assert withdrawal
                # get the ATM address
                atm = session.get(ATM, withdrawal.atm_id)
                address = session.get(Address, atm.address_id) if atm else None
                return {
                    "transaction": transaction,
                    "withdrawal": withdrawal,
                    "atm_address": (
                        f"{address.street}, {address.city}, {address.state} {address.zip_code}"
                        if address
                        else None
                    ),
                }
            case TransactionType.TRANSFER:
                # get the transfer
                stmt = select(Transfer).where(Transfer.transaction_id == transaction_id)
                transfer = session.exec(stmt).one()
                assert transfer
                return {"transaction": transaction, "transfer": transfer}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching transaction",
        )
