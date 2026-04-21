import random
import os
from fastapi import APIRouter, HTTPException, status, UploadFile, Form
from sqlmodel import select, func, Session
from types_boto3_s3 import S3Client
from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from dependencies.admin import AdminDep
from typing import Optional
from constants import ROUTING_NUMBER, MAX_BALANCE, BALANCE_OVERFLOW_MESSAGE
import boto3
from models import (
    Account,
    OnlineDeposit,
    AccountType,
    AccountStatus,
    ATM,
    ATMStatus,
    Transaction,
    TransactionType,
    TransactionStatus,
    LedgerEntry,
    LedgerType,
    ATMDeposit,
    Withdraw,
    DepositType,
    User,
)
from lib.utils import get_or_create_address
from dtos.accounts import (
    CreateAccountRequest,
    CashDepositRequest,
    WithdrawRequest,
)
from decimal import Decimal
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


def get_or_create_atm(session: Session, atm_address) -> ATM:
    """Helper to find or create an ATM record from an address."""
    address = get_or_create_address(
        street=atm_address.street,
        unit=atm_address.unit,
        city=atm_address.city,
        state=atm_address.state,
        zipcode=atm_address.zipcode,
        country=atm_address.country,
        session=session,
    )

    stmt = select(ATM).where(ATM.address_id == address.address_id)
    atm = session.exec(stmt).first()
    # activate the atm if it's not active
    if atm and atm.status != ATMStatus.ACTIVE:
        atm.status = ATMStatus.ACTIVE
        session.flush()
    if atm:
        return atm
    atm = ATM(address_id=address.address_id, status=ATMStatus.ACTIVE)
    session.add(atm)
    session.flush()
    return atm


@router.post("/accounts/create")
def create_account(
    request: CreateAccountRequest,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    POST /accounts/create
    Creates a new checking or savings account. Requires authentication.
    """
    try:
        # get customer_id from the logged in user
        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer not found",
            )

        # generate a random unique account number
        account_number = str(random.randint(1000000000, 9999999999))
        routing_number = ROUTING_NUMBER

        account = Account(
            customer_id=user.customer_id,
            account_number=account_number,
            routing_number=routing_number,
            account_type=AccountType(request.account_type),
            status=AccountStatus.ACTIVE,
            balance=Decimal("0.00"),
            currency="USD",
        )
        session.add(account)
        session.commit()
        session.refresh(account)

        return {"account_id": account.account_id}

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


@router.delete("/accounts/{account_id}")
def close_account(
    account_id: int,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    DELETE /accounts/{account_id}
    Closes an account if it belongs to the user and has $0 balance. Requires authentication.
    """
    try:

        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found"
            )

        account = session.get(Account, account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )

        # make sure account belongs to this user
        if account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your account"
            )

        if account.status == AccountStatus.CLOSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is already closed",
            )

        # must have $0 balance to close
        if account.balance > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account must have $0 balance before closing",
            )

        account.status = AccountStatus.CLOSED
        session.add(account)
        session.commit()

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


@router.get("/accounts/{account_id}")
def get_account(
    account_id: int,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    GET /accounts/{account_id}
    Gets account info. Requires authentication.
    """
    try:
        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found"
            )

        account = session.get(Account, account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )

        if account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your account"
            )

        return account

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )


@router.get("/manager/accounts")
def get_all_accounts_admin(
    user_info: AdminDep,
    session: SessionDep,
    page: int = 1,
    limit: int = 10,
    account_type: Optional[str] = None,
    account_status: Optional[str] = None,
    min_balance: Optional[float] = None,
):
    """
    GET /manager/accounts
    Returns paginated accounts in the database.
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

        query = select(Account)
        count_query = select(func.count()).select_from(Account)

        if account_type:
            query = query.where(Account.account_type == account_type)
            count_query = count_query.where(Account.account_type == account_type)
        if account_status:
            query = query.where(Account.status == account_status)
            count_query = count_query.where(Account.status == account_status)
        if min_balance is not None:
            query = query.where(Account.balance >= min_balance)
            count_query = count_query.where(Account.balance >= min_balance)

        total = session.exec(count_query).one()
        total_pages = (total + limit - 1) // limit

        accounts = session.exec(
            query.order_by(Account.account_id)  # type: ignore
            .offset((page - 1) * limit)
            .limit(limit)
        ).all()

        return {"data": accounts, "total_pages": total_pages, "page": page}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching accounts",
        )


@router.get("/accounts")
def get_all_accounts(
    session: SessionDep,
    user_info: AuthDep,
):
    """
    GET /accounts
    Lists all accounts for the logged in user. Requires authentication.
    """
    try:
        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found"
            )

        statement = (
            select(Account)
            .where(Account.customer_id == user.customer_id)
            .where(Account.status == AccountStatus.ACTIVE)
        )
        accounts = session.exec(statement).all()

        return {"accounts": accounts}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )


@router.post("/deposit/cash")
def deposit_cash(
    request: CashDepositRequest,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    POST /deposit/cash
    Deposits cash at an ATM into an account. Requires authentication.
    """
    try:
        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found"
            )

        account = session.get(Account, request.account_id, with_for_update=True)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )

        if account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your account"
            )

        if account.status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Account is not active"
            )

        if account.balance + request.cash_amount > MAX_BALANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=BALANCE_OVERFLOW_MESSAGE,
            )

        # get or create ATM
        atm = get_or_create_atm(session, request.atm_address)

        # create transaction
        assert account.account_id
        transaction = Transaction(
            accounts=[account],
            transaction_type=TransactionType.ATM_DEPOSIT,
            amount=request.cash_amount,
            currency=account.currency,
            status=TransactionStatus.PENDING,
        )
        session.add(transaction)
        session.flush()

        # update balance
        account.balance += request.cash_amount
        session.add(account)

        # log ATM deposit
        assert transaction.transaction_id and atm.atm_id
        atm_deposit = ATMDeposit(
            transaction_id=transaction.transaction_id,
            atm_id=atm.atm_id,
            type=DepositType.CASH,
        )
        session.add(atm_deposit)

        # log ledger entry
        ledger = LedgerEntry(
            transaction_id=transaction.transaction_id,
            account_id=account.account_id,
            type=LedgerType.CREDIT,
        )
        session.add(ledger)

        # mark transaction complete
        transaction.status = TransactionStatus.COMPLETED
        session.add(transaction)
        session.commit()

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


@router.post("/withdraw")
def withdraw(
    request: WithdrawRequest,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    POST /withdraw
    Withdraws cash from an account at an ATM. Requires authentication.
    """
    try:
        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found"
            )

        account = session.get(Account, request.account_id, with_for_update=True)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )

        if account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your account"
            )

        if account.status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Account is not active"
            )

        if account.balance < request.cash_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient funds"
            )

        # get or create ATM
        atm = get_or_create_atm(session, request.atm_address)

        # create transaction
        assert account.account_id
        transaction = Transaction(
            accounts=[account],
            transaction_type=TransactionType.WITHDRAWAL,
            amount=request.cash_amount,
            currency=account.currency,
            status=TransactionStatus.PENDING,
        )
        session.add(transaction)
        session.flush()

        # update balance
        account.balance -= request.cash_amount
        session.add(account)

        # log withdraw
        assert transaction.transaction_id and atm.atm_id
        withdraw_record = Withdraw(
            transaction_id=transaction.transaction_id,
            atm_id=atm.atm_id,
        )
        session.add(withdraw_record)

        # log ledger entry
        ledger = LedgerEntry(
            transaction_id=transaction.transaction_id,
            account_id=account.account_id,
            type=LedgerType.DEBIT,
        )
        session.add(ledger)

        # mark transaction complete
        transaction.status = TransactionStatus.COMPLETED
        session.add(transaction)
        session.commit()

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


@router.post("/deposit/check")
def deposit_check(
    user_info: AuthDep,
    session: SessionDep,
    check_img: UploadFile,
    account_id: int = Form(),
    check_amount: Decimal = Form(),
    from_account_number: str = Form(),
    from_routing_number: str = Form(),
):
    try:
        account = session.get(Account, account_id, with_for_update=True)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )
        assert account.account_id
        user = session.get(User, user_info.user_id)
        if not user or not user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found"
            )
        if account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your account"
            )
        if account.status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Account is not active"
            )
        if check_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be positive",
            )
        if check_img.content_type not in ("image/png", "image/jpeg"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check image must be PNG or JPEG",
            )

        # make sure the account that issued this check isn't ours
        if from_routing_number == ROUTING_NUMBER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Checks are not issued by Online Bank",
            )

        if account.balance + check_amount > MAX_BALANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=BALANCE_OVERFLOW_MESSAGE,
            )

        # create transaction
        transaction = Transaction(
            accounts=[account],
            transaction_type=TransactionType.ONLINE_DEPOSIT,
            amount=check_amount,
            currency=account.currency,
            status=TransactionStatus.PENDING,
        )
        session.add(transaction)
        session.flush()

        # log deposit
        assert transaction.transaction_id
        deposit = OnlineDeposit(
            transaction_id=transaction.transaction_id,
            check_image_name=f"{transaction.transaction_id}.png",
            check_from_routing_number=from_routing_number,
            check_from_account_number=from_account_number,
        )
        session.add(deposit)

        # upload to s3
        client: S3Client = boto3.client("s3")
        AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
        assert AWS_S3_BUCKET
        client.upload_fileobj(
            check_img.file, AWS_S3_BUCKET, f"{transaction.transaction_id}.png"
        )

        # update account balance
        account.balance += check_amount
        session.add(account)

        # log ledger entry
        ledger = LedgerEntry(
            transaction_id=transaction.transaction_id,
            account_id=account.account_id,
            type=LedgerType.CREDIT,
        )
        session.add(ledger)

        # mark transaction complete
        transaction.status = TransactionStatus.COMPLETED
        session.add(transaction)
        session.commit()

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
