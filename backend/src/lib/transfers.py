from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from sqlmodel import Session, select

from constants import ROUTING_NUMBER, MAX_BALANCE, BALANCE_OVERFLOW_MESSAGE
from models import (
    Account,
    AccountStatus,
    LedgerEntry,
    LedgerType,
    RecurringFrequency,
    RecurringPayment,
    Transaction,
    TransactionStatus,
    TransactionType,
    Transfer,
)

DELTAS = {
    RecurringFrequency.WEEKLY: timedelta(days=7),
    RecurringFrequency.BIWEEKLY: timedelta(days=14),
    RecurringFrequency.MONTHLY: timedelta(days=30),
}


@dataclass
class TransferException(Exception):
    reason: str


def process_recurring_payment(payment: RecurringPayment, session: Session):
    """
    Process a stored recurring payment and persist the resulting records.

    TODO - it would be nice to store the success / failure message
    and maybe limit the amount of retries we do on a failing payment
    """

    # recurring payment is just a regular transfer
    process_transfer(
        payment.from_account_id,
        payment.payee_account_number,
        payment.payee_routing_number,
        payment.amount,
        "Recurring Payment",
        session,
        commit=False,
        recurring_payment_id=payment.recurring_payment_id,
    )

    # then, update status
    if payment.frequency != RecurringFrequency.ONCE:
        payment.next_payment_date = (
            payment.next_payment_date + DELTAS[payment.frequency]
        )
    else:
        payment.completed_at = datetime.now(timezone.utc)
    session.add(payment)
    session.commit()


def process_transfer(
    from_account_id: int,
    payee_account_number: str,
    payee_routing_number: str,
    amount: Decimal,
    description: str,
    session: Session,
    commit: bool = True,
    recurring_payment_id: Optional[int] = None,
):
    """
    Process a transfer from an internal account
    to either an external account or an internal account,
    as determined by the routing number.

    This function will commit results to the database if successful and commit is True.

    On failure, this function will rollback and then throw a TransferException
    with the reason.

    This function will create the transaction, transfer, and ledger records.
    """

    account = session.get(Account, from_account_id)

    if not account:
        raise TransferException("Account does not exist")

    if account.status is not AccountStatus.ACTIVE:
        raise TransferException("Account is not active")

    if amount < 0:
        raise TransferException(
            "Invalid amount. Only nonnegative amounts can be transferred"
        )

    if (
        payee_routing_number == ROUTING_NUMBER
        and payee_account_number == account.account_number
    ):
        raise TransferException("Cannot transfer to the same account")

    if account.balance < amount:
        raise TransferException("Insufficient funds for payment")

    account.balance -= amount

    transaction = Transaction(
        accounts=[account],
        transaction_type=TransactionType.TRANSFER,
        amount=amount,
        currency="USD",
        status=TransactionStatus.COMPLETED,
        description=description,
        created_at=datetime.now(timezone.utc),
    )

    session.add(transaction)
    session.flush()

    # create records
    assert transaction.transaction_id is not None
    session.add(
        Transfer(
            transaction_id=transaction.transaction_id,
            from_account_number=str(account.account_number),
            from_routing_number=str(account.routing_number),
            to_account_number=payee_account_number,
            to_routing_number=payee_routing_number,
            recurring_payment_id=recurring_payment_id,
        )
    )
    session.add(
        LedgerEntry(
            transaction_id=transaction.transaction_id,
            account_id=from_account_id,
            type=LedgerType.DEBIT,
        )
    )

    # handle the other side too
    if payee_routing_number == ROUTING_NUMBER:
        # need to validate that the complement exists
        stmt = (
            select(Account)
            .where(Account.account_number == payee_account_number)
            .with_for_update()
        )
        payee = session.exec(stmt).first()
        if payee is None:
            session.rollback()
            raise TransferException("Payee account number not found")
        if payee.status is not AccountStatus.ACTIVE:
            session.rollback()
            raise TransferException("Payee account is not active")
        if payee.balance + amount > MAX_BALANCE:
            session.rollback()
            raise TransferException(BALANCE_OVERFLOW_MESSAGE)
        assert payee.account_id is not None
        payee.balance += amount
        transaction.accounts.append(payee)
        session.add(transaction)
        session.add(
            LedgerEntry(
                transaction_id=transaction.transaction_id,
                account_id=payee.account_id,
                type=LedgerType.CREDIT,
            )
        )

    # commit changes, if requested
    if commit:
        session.commit()
