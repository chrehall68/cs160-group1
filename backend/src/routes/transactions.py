from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
from datetime import datetime

from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from models import (
    Account,
    Transaction,
    TransactionType,
    TransactionStatus,
    Transfer,
    TransferDirection,
    TransferType,
    RecurringPayment,
)
from dtos.transactions import TransferRequest, RecurringPaymentRequest


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
    statement = select(Account).where(
        Account.account_id == request.from_account_id
    )
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

    #verify account
    statement = select(Account).where(
        Account.account_id == request.from_account_id
    )
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