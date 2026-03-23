from pydantic import BaseModel, field_validator
from datetime import date, datetime
from decimal import Decimal
from models import RecurringFrequency, LedgerType


class InternalTransferRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    to_routing_number: str
    amount: Decimal
    # removed scheduled date because the UI will use
    # recurring payments for that

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    # TODO - enforce that if transfer type is internal,
    # the routing number is Online Bank's routing number


class RecurringPaymentRequest(BaseModel):
    from_account_id: int
    payee_account_number: str
    payee_routing_number: str
    amount: Decimal
    frequency: RecurringFrequency
    next_payment_date: date


class TransactionResponse(BaseModel):
    transaction_id: int
    type: LedgerType
    amount: Decimal
    currency: str
    created_at: datetime
