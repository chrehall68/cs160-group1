from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


class AddressRequest(BaseModel):
    street: str
    unit: Optional[str] = None
    city: str
    state: str
    zipcode: str
    country: str = "USA"


class CreateAccountRequest(BaseModel):
    account_type: str  # "checking" or "savings"

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v: str) -> str:
        if v not in ["checking", "savings"]:
            raise ValueError("Account type must be 'checking' or 'savings'")
        return v


class CashDepositRequest(BaseModel):
    account_id: int
    cash_amount: Decimal
    atm_address: AddressRequest

    @field_validator("cash_amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class WithdrawRequest(BaseModel):
    account_id: int
    cash_amount: Decimal
    atm_address: AddressRequest

    @field_validator("cash_amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class AccountResponse(BaseModel):
    account_id: int
    account_number: str
    routing_number: str
    account_type: str
    status: str
    balance: Decimal
    currency: str
    created_at: datetime


class CheckDepositRequest(BaseModel):
    account_id: int
    check_amount: Decimal
    from_account_number: str
    from_routing_number: str
