from models import *
from constants import ROUTING_NUMBER
from sqlmodel import Session, select
import sys
from datetime import timedelta, datetime, timezone

DELTAS = {
    RecurringFrequency.WEEKLY: timedelta(days=7),
    RecurringFrequency.BIWEEKLY: timedelta(days=14),
    RecurringFrequency.MONTHLY: timedelta(days=30),
}


def process_recurring_payment(payment: RecurringPayment, session: Session):
    """
    Process the recurring payment, adding the necessary
    records to the transaction, transfer, and ledger tables

    This function will commit results to the database if successful.

    May throw an exception.

    Returns:
    (bool) - true on success, False on failure (no account or insufficient funds)
    """
    account = session.get(Account, payment.from_account_id)

    if not account:
        print("No account found", file=sys.stderr)
        return False

    if account.balance < payment.amount:
        print("Insufficient funds for recurring payment", file=sys.stderr)
        return False

    # subtract balance
    account.balance -= payment.amount

    # create transaction
    transaction = Transaction(
        account_id=payment.from_account_id,
        transaction_type=TransactionType.TRANSFER,
        amount=payment.amount,
        currency="USD",
        status=TransactionStatus.COMPLETED,
        description="Recurring payment",
        created_at=datetime.now(timezone.utc),
    )

    session.add(transaction)
    session.flush()

    # create transfer record
    assert transaction.transaction_id
    transfer = Transfer(
        transaction_id=transaction.transaction_id,
        type=payment.transfer_type,
        direction=TransferDirection.OUTGOING,
    )
    session.add(transfer)
    # and create ledger entry
    ledger1 = LedgerEntry(
        transaction_id=transaction.transaction_id,
        account_id=payment.from_account_id,
        type=LedgerType.DEBIT,
    )
    session.add(ledger1)

    # handle the other side too
    if payment.transfer_type == TransferType.INTERNAL:
        # need to validate that the complement exists
        if payment.payee_routing_number != ROUTING_NUMBER:
            print("Somehow got invalid payee routing number", file=sys.stderr)
            session.rollback()
            return False
        stmt = select(Account).where(
            Account.account_number == payment.payee_account_number
        )
        payee = session.exec(stmt).first()
        if payee is None:
            print("payee does not exist", file=sys.stderr)
            session.rollback()
            return False
        if payee.status == AccountStatus.CLOSED:
            print("payee is closed", file=sys.stderr)
            session.rollback()
            return False
        assert payee.account_id
        # transfer to payee
        payee.balance += payment.amount
        # and create records
        transfer = Transfer(
            transaction_id=transaction.transaction_id,
            type=payment.transfer_type,
            direction=TransferDirection.INCOMING,
        )
        session.add(transfer)
        ledger2 = LedgerEntry(
            transaction_id=transaction.transaction_id,
            account_id=payee.account_id,
            type=LedgerType.CREDIT,
        )
        session.add(ledger2)

    # update next payment date
    if payment.frequency != RecurringFrequency.ONCE:
        payment.next_payment_date = (
            payment.next_payment_date + DELTAS[payment.frequency]
        )
    else:
        # it was a one time thing. remove it from the db
        session.delete(payment)
    session.commit()
