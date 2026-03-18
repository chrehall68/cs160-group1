from fastapi import APIRouter, HTTPException, status
from sqlmodel import select, func
import sys
import traceback

from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from models import (
    Account,
    Transaction,
    TransactionType,
    TransactionStatus,
    Transfer,
    TransferDirection,
    RecurringPayment,
    LedgerEntry,
)
from dtos.transactions import (
    TransferRequest,
    RecurringPaymentRequest,
    TransactionResponse,
)

router = APIRouter()


@router.post("/transfer/internal")
def transfer_money(
    request: TransferRequest,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    Transfer money between accounts
    """

    # find source account
    statement = select(Account).where(Account.account_id == request.from_account_id)
    from_account = session.exec(statement).first()

    if not from_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source account not found",
        )

    # check ownership
    if from_account.customer_id != user_info.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )

    # check balance
    if from_account.balance < request.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient funds",
        )

    try:
        # subtract money
        from_account.balance -= request.amount
        session.add(from_account)

        # create transaction
        txn = Transaction(
            account_id=request.from_account_id,
            transaction_type=TransactionType.TRANSFER,
            amount=request.amount,
            status=TransactionStatus.COMPLETED,
            description="Transfer",
        )
        session.add(txn)
        session.flush()

        # create transfer record
        assert txn.transaction_id
        transfer = Transfer(
            transaction_id=txn.transaction_id,
            type=request.transfer_type,
            direction=TransferDirection.OUTGOING,
        )
        session.add(transfer)

        session.commit()

        return {"message": "Transfer successful"}

    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transfer failed",
        )


@router.post("/recurring")
def create_recurring_payment(
    request: RecurringPaymentRequest,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    Create a recurring payment schedule
    """

    # verify account
    statement = select(Account).where(Account.account_id == request.from_account_id)
    account = session.exec(statement).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if account.customer_id != user_info.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )

    try:
        recurring = RecurringPayment(
            from_account_id=request.from_account_id,
            payee_account_number=request.payee_account_number,
            payee_routing_number=request.payee_routing_number,
            transfer_type=request.transfer_type,
            amount=request.amount,
            frequency=request.frequency,
            next_payment_date=request.next_payment_date,
        )

        session.add(recurring)
        session.commit()

        return {"message": "Recurring payment scheduled"}

    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create recurring payment",
        )


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

    if account.customer_id != user_info.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )

    try:
        offset = (page - 1) * limit
        value_stmt = (
            select(LedgerEntry, Transaction)
            .where(LedgerEntry.account_id == account_id)
            .join(Transaction, LedgerEntry.transaction_id == Transaction.transaction_id)  # type: ignore
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
        traceback.print_exception(e, file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get transactions",
        )
