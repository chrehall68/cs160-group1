from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from models import (
    Account,
    RecurringPayment,
    AccountStatus,
    User,
    PotentialExternalTransfer,
    Transaction,
    TransactionType,
    TransactionStatus,
    Transfer,
    LedgerEntry,
    LedgerType,
)
from dtos.transactions import (
    InternalTransferRequest,
    ExternalTransferInitiateRequest,
    ExternalTransferCompleteRequest,
    RecurringPaymentRequest,
    RecurringPaymentResponse,
    TransactionResponse,
)
from lib.transfers import process_transfer, TransferException
from constants import MAX_BALANCE, BALANCE_OVERFLOW_MESSAGE
from datetime import date, datetime, timezone

# for external transfers
import plaid
from plaid.model.transfer_intent_create_request import TransferIntentCreateRequest
from plaid.model.transfer_intent_create_mode import TransferIntentCreateMode
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.ach_class import ACHClass
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.auth_get_request import AuthGetRequest
from plaid.model.auth_get_response import AuthGetResponse
from plaid.api import plaid_api
import os
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

# Available environments are
# 'Production'
# 'Sandbox'
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        "clientId": os.getenv("PLAID_CLIENT_ID"),
        "secret": os.getenv("PLAID_SECRET"),
    },
)

plaid_api_client = plaid.ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(plaid_api_client)


@router.post("/transfer/internal")
def transfer_money(
    request: InternalTransferRequest,
    session: SessionDep,
    user_info: AuthDep,
):
    """
    Transfer money from an internal account
    to either an external account or an internal account,
    as determined by the routing number.
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
    user = session.get(User, user_info.user_id)
    if not user or from_account.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )

    try:
        process_transfer(
            request.from_account_id,
            request.to_account_number,
            request.to_routing_number,
            request.amount,
            "Transfer",
            session,
        )

        return {"message": "Transfer successful"}

    except TransferException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.reason)
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
    if account.status is not AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not active",
        )

    # check ownership
    user = session.get(User, user_info.user_id)
    if not user or account.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )
    # check date
    if request.next_payment_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Next payment date must be today or later",
        )

    try:
        recurring = RecurringPayment(
            from_account_id=request.from_account_id,
            payee_account_number=request.payee_account_number,
            payee_routing_number=request.payee_routing_number,
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


def get_status(payment: RecurringPayment) -> str:
    if payment.canceled_at is not None:
        return "canceled"
    if payment.completed_at is not None:
        return "completed"
    return "active"


def load_owned_recurring_payment(
    recurring_payment_id: int, session: SessionDep, user_info: AuthDep
) -> RecurringPayment:
    """Fetch a recurring payment and verify it belongs to the current user."""
    payment = session.get(RecurringPayment, recurring_payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring payment not found",
        )
    account = session.get(Account, payment.from_account_id)
    user = session.get(User, user_info.user_id)
    if not user or not account or account.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recurring payment does not belong to user",
        )
    return payment


@router.get("/recurring/{account_id}")
def get_recurring_payments(account_id: int, session: SessionDep, user_info: AuthDep):
    """List recurring/scheduled payments (active, canceled, and completed) for an account."""
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    user = session.get(User, user_info.user_id)
    if not user or account.customer_id != user.customer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to user",
        )

    stmt = (
        select(RecurringPayment)
        .where(RecurringPayment.from_account_id == account_id)
        .order_by(-RecurringPayment.recurring_payment_id)  # type: ignore
    )
    payments = session.exec(stmt).all()

    return {
        "recurring_payments": [
            RecurringPaymentResponse(
                recurring_payment_id=p.recurring_payment_id,  # type: ignore
                from_account_id=p.from_account_id,
                payee_account_number=p.payee_account_number,
                payee_routing_number=p.payee_routing_number,
                amount=p.amount,
                currency=p.currency,
                frequency=p.frequency,
                next_payment_date=p.next_payment_date,
                created_at=p.created_at,
                canceled_at=p.canceled_at,
                completed_at=p.completed_at,
                status=get_status(p),  # type: ignore
            )
            for p in payments
        ]
    }


@router.post("/recurring/{recurring_payment_id}/cancel")
def cancel_recurring_payment(
    recurring_payment_id: int, session: SessionDep, user_info: AuthDep
):
    """Cancel an active recurring/scheduled payment."""
    payment = load_owned_recurring_payment(recurring_payment_id, session, user_info)

    if payment.canceled_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recurring payment is already canceled",
        )
    if payment.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recurring payment is already completed",
        )

    payment.canceled_at = datetime.now(timezone.utc)
    session.add(payment)
    session.commit()

    return {"message": "Recurring payment canceled"}


@router.get("/recurring/{recurring_payment_id}/transactions")
def get_recurring_payment_transactions(
    recurring_payment_id: int, session: SessionDep, user_info: AuthDep
):
    """List transactions produced by a recurring/scheduled payment."""
    payment = load_owned_recurring_payment(recurring_payment_id, session, user_info)

    stmt = (
        select(LedgerEntry, Transaction)
        .join(Transaction, LedgerEntry.transaction_id == Transaction.transaction_id)  # type: ignore
        .join(Transfer, Transfer.transaction_id == Transaction.transaction_id)  # type: ignore
        .where(Transfer.recurring_payment_id == recurring_payment_id)
        .where(LedgerEntry.account_id == payment.from_account_id)
        .order_by(-Transaction.transaction_id)  # type: ignore
    )
    rows = session.exec(stmt).all()

    return {
        "transactions": [
            TransactionResponse(
                transaction_id=txn.transaction_id,  # type: ignore
                ledger_type=ledger.type,
                transaction_type=txn.transaction_type,
                amount=txn.amount,
                currency=txn.currency,
                created_at=txn.created_at,
            )
            for ledger, txn in rows
        ]
    }


@router.post("/transfer/external/initiate")
def initiate_external_transfer(
    request: ExternalTransferInitiateRequest, session: SessionDep, user_info: AuthDep
):
    try:
        account = session.get(Account, request.account_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )

        if account.status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is not active",
            )
        user = session.get(User, user_info.user_id)
        if not user or account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account does not belong to user",
            )
        customer = user.customer
        assert customer is not None  # for mypy

        if account.balance + request.amount > MAX_BALANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=BALANCE_OVERFLOW_MESSAGE,
            )

        # call plaid
        # https://plaid.com/docs/api/products/transfer/account-linking/#transferintentcreate
        transfer_intent = plaid_client.transfer_intent_create(
            TransferIntentCreateRequest(
                mode=TransferIntentCreateMode("PAYMENT"),
                amount=f"{request.amount:.2f}",
                description="transfer",
                ach_class=ACHClass("ppd"),
                user={"legal_name": f"{customer.first_name} {customer.last_name}"},
            )
        )
        logger.info(transfer_intent)
        link_res = plaid_client.link_token_create(
            LinkTokenCreateRequest(
                language="en",
                country_codes=[CountryCode("US")],
                user={
                    "legal_name": f"{customer.first_name} {customer.last_name}",
                    "client_user_id": str(user.user_id),
                },
                products=[Products("transfer")],
                transfer={"intent_id": transfer_intent["transfer_intent"]["id"]},
                link_customization_name="transfer_customization",
                client_name="Online Bank",
            )
        )
        logger.info(link_res)
        session.add(
            PotentialExternalTransfer(
                account_id=request.account_id,
                amount=request.amount,
                transfer_intent_id=transfer_intent["transfer_intent"]["id"],
            )
        )
        session.commit()

        return {
            "link_token": link_res["link_token"],
            "transfer_intent_id": transfer_intent["transfer_intent"]["id"],
        }
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transfer failed",
        )


@router.post("/transfer/external/complete")
def complete_external_transfer(
    request: ExternalTransferCompleteRequest, session: SessionDep, user_info: AuthDep
):
    try:
        stmt = select(PotentialExternalTransfer).where(
            PotentialExternalTransfer.transfer_intent_id == request.transfer_intent_id
        )
        potential_transfer = session.exec(stmt).first()
        if not potential_transfer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid transfer intent id",
            )
        account = session.get(
            Account, potential_transfer.account_id, with_for_update=True
        )
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )
        user = session.get(User, user_info.user_id)
        if not user or account.customer_id != user.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account does not belong to user",
            )

        # exchange public token
        # https://plaid.com/docs/api/items/#itempublic_tokenexchange
        exchange_res = plaid_client.item_public_token_exchange(
            ItemPublicTokenExchangeRequest(public_token=request.public_token)
        )

        # get the access token
        access_token = exchange_res["access_token"]

        # get the account info using the access token
        # https://plaid.com/docs/api/products/auth/#authget
        account_info: AuthGetResponse = plaid_client.auth_get(
            AuthGetRequest(access_token=access_token)
        )
        from_account_num = account_info.numbers["ach"][0]["account"]
        from_routing_num = account_info.numbers["ach"][0]["routing"]

        if account.balance + potential_transfer.amount > MAX_BALANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=BALANCE_OVERFLOW_MESSAGE,
            )

        # and add transaction
        account.balance += potential_transfer.amount
        assert account.account_id
        transaction = Transaction(
            accounts=[account],
            amount=potential_transfer.amount,
            transaction_type=TransactionType.TRANSFER,
            status=TransactionStatus.COMPLETED,
            description="External transfer",
        )
        session.add(transaction)
        session.flush()
        # and add transfer
        assert transaction.transaction_id
        session.add(
            Transfer(
                transaction_id=transaction.transaction_id,
                to_account_number=str(account.account_number),
                to_routing_number=str(account.routing_number),
                from_account_number=from_account_num,
                from_routing_number=from_routing_num,
            )
        )
        session.add(
            LedgerEntry(
                transaction_id=transaction.transaction_id,
                account_id=account.account_id,
                type=LedgerType.CREDIT,
            )
        )
        # mark the transfer as done
        session.delete(potential_transfer)
        session.commit()
        # TODO - technically we should use webhooks and not just assume
        # that the transfer worked
        # but this is also just CS 160...

        return {"message": "External transfer completed successfully"}

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transfer failed",
        )
