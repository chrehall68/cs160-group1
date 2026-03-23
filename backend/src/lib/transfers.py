from models import *
from sqlmodel import Session, select
from datetime import timedelta
from dataclasses import dataclass
from constants import ROUTING_NUMBER

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
    Process the recurring payment, adding the necessary
    records to the transaction, transfer, and ledger tables

    This function will commit results to the database if successful.

    On failure, this function will rollback and then throw a TransferException
    with the reason.
    """

    # treat it like a regular transfer
    process_transfer(
        payment.from_account_id,
        payment.payee_account_number,
        payment.payee_routing_number,
        payment.transfer_type,
        payment.amount,
        "Recurring Payment",
        session,
        False,
    )

    # update next payment date
    if payment.frequency != RecurringFrequency.ONCE:
        payment.next_payment_date = (
            payment.next_payment_date + DELTAS[payment.frequency]
        )
    else:
        # it was a one time thing. remove it from the db
        session.delete(payment)
    session.commit()


def process_transfer(
    from_account_id: int,
    payee_account_number: str,
    payee_routing_number: str,
    transfer_type: TransferType,
    amount: Decimal,
    description: str,
    session: Session,
    commit: bool = True,
):
    """
    Process the transfer, adding the necessary
    records to the transaction, transfer, and ledger tables

    This function will commit results to the database if successful and commit is True.

    On failure, this function will rollback and then throw a TransferException
    with the reason.
    """

    account = session.get(Account, from_account_id)

    if not account:
        raise TransferException("Account does not exist")

    if account.balance < amount:
        raise TransferException("Insufficient funds for payment")
    # subtract balance
    account.balance -= amount

    # create transaction
    transaction = Transaction(
        account_id=from_account_id,
        transaction_type=TransactionType.TRANSFER,
        amount=amount,
        currency="USD",
        status=TransactionStatus.COMPLETED,
        description=description,
        created_at=datetime.now(timezone.utc),
    )

    session.add(transaction)
    session.flush()

    # create transfer record
    assert transaction.transaction_id
    transfer = Transfer(
        transaction_id=transaction.transaction_id,
        type=transfer_type,
        direction=TransferDirection.OUTGOING,
    )
    session.add(transfer)
    # and create ledger entry
    ledger1 = LedgerEntry(
        transaction_id=transaction.transaction_id,
        account_id=from_account_id,
        type=LedgerType.DEBIT,
    )
    session.add(ledger1)

    # handle the other side too
    if transfer_type == TransferType.INTERNAL:
        # need to validate that the complement exists
        if payee_routing_number != ROUTING_NUMBER:
            session.rollback()
            raise TransferException("Invalid internal routing number")
        stmt = select(Account).where(Account.account_number == payee_account_number)
        payee = session.exec(stmt).first()
        if payee is None:
            session.rollback()
            raise TransferException("Payee account number not found")
        if payee.status == AccountStatus.CLOSED:
            session.rollback()
            raise TransferException("Payee account is closed")
        assert payee.account_id
        # transfer to payee
        payee.balance += amount
        # and create records
        transfer = Transfer(
            transaction_id=transaction.transaction_id,
            type=transfer_type,
            direction=TransferDirection.INCOMING,
        )
        session.add(transfer)
        ledger2 = LedgerEntry(
            transaction_id=transaction.transaction_id,
            account_id=payee.account_id,
            type=LedgerType.CREDIT,
        )
        session.add(ledger2)

    # commit changes, if requested
    if commit:
        session.commit()
