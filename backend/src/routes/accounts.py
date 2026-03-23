import sys
import traceback
import random
from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from constants import ROUTING_NUMBER
from models import (
    Account,
    AccountType,
    AccountStatus,
    ATM,
    Address,
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
from dtos.accounts import CreateAccountRequest, CashDepositRequest, WithdrawRequest
from decimal import Decimal

router = APIRouter()


def get_or_create_atm(session, atm_address) -> ATM:
    """Helper to find or create an ATM record from an address."""
    address = Address(
        street=atm_address.street,
        unit=atm_address.unit,
        city=atm_address.city,
        state=atm_address.state,
        zip_code=atm_address.zipcode,
        country=atm_address.country,
    )
    session.add(address)
    session.flush()

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
        traceback.print_exc(file=sys.stderr)
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
        traceback.print_exc(file=sys.stderr)
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
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
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
        traceback.print_exc(file=sys.stderr)
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

        account = session.get(Account, request.account_id)
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

        # get or create ATM
        atm = get_or_create_atm(session, request.atm_address)

        # create transaction
        assert account.account_id
        transaction = Transaction(
            account_id=account.account_id,
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
        traceback.print_exc(file=sys.stderr)
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

        account = session.get(Account, request.account_id)
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
            account_id=account.account_id,
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
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred",
        )
