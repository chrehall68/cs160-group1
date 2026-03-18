from pydantic import BaseModel, field_validator
from datetime import date
from decimal import Decimal
from models import TransferType, RecurringFrequency


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    to_routing_number: str
    transfer_type: TransferType
    amount: Decimal
    scheduled_date: date

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class RecurringPaymentRequest(BaseModel):
    from_account_id: int
    payee_account_number: str
    payee_routing_number: str
    transfer_type: TransferType
    amount: Decimal
    frequency: RecurringFrequency
    next_payment_date: date
