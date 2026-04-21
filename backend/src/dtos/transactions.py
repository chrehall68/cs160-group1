from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

from models import LedgerType, RecurringFrequency, TransactionType


class InternalTransferRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    to_routing_number: str
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal):
        if v < 0:
            raise ValueError("Amount must be nonnegative")
        return v


class ExternalTransferInitiateRequest(BaseModel):
    account_id: int
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal):
        if v < 0:
            raise ValueError("Amount must be nonnegative")
        return v


class ExternalTransferCompleteRequest(BaseModel):
    transfer_intent_id: str
    public_token: str


class RecurringPaymentRequest(BaseModel):
    from_account_id: int
    payee_account_number: str
    payee_routing_number: str
    amount: Decimal
    frequency: RecurringFrequency
    next_payment_date: date

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal):
        if v < 0:
            raise ValueError("Amount must be nonnegative")
        return v


class TransactionResponse(BaseModel):
    transaction_id: int
    ledger_type: LedgerType
    transaction_type: TransactionType
    amount: Decimal
    currency: str
    created_at: datetime
