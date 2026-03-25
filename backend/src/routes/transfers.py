from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from dependencies.db import SessionDep
from dependencies.auth import AuthDep
from models import Account, RecurringPayment, AccountStatus, User
from dtos.transactions import (
    InternalTransferRequest,
    ExternalTransferRequest,
    RecurringPaymentRequest,
)
from lib.transfers import process_transfer, TransferException
from datetime import date

# for external transfers
import plaid
from plaid.model.transfer_intent_create_request import TransferIntentCreateRequest
from plaid.model.transfer_intent_create_mode import TransferIntentCreateMode
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.ach_class import ACHClass
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
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


@router.post("/external/initiate")
def transfer_external(
    request: ExternalTransferRequest, session: SessionDep, user_info: AuthDep
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

        # call plaid
        # https://plaid.com/docs/api/products/transfer/account-linking/#transferintentcreate
        transfer_intent = plaid_client.transfer_intent_create(
            TransferIntentCreateRequest(
                mode=TransferIntentCreateMode("PAYMENT"),
                amount=str(request.amount),
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

        return {"link_token": link_res["link_token"]}
    except Exception as e:
        session.rollback()
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transfer failed",
        )
