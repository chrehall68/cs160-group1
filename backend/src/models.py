from sqlmodel import CheckConstraint, Column, SQLModel, Field, Relationship
from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy import BigInteger
from decimal import Decimal
from typing import Optional
from datetime import datetime, timezone, date
from enum import Enum


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    LOCKED = "locked"


class CustomerType(str, Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"


class KYCStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"


class AccountStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    FROZEN = "frozen"


class ATMStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    OUT_OF_SERVICE = "out_of_service"


class TransactionType(str, Enum):
    ATM_DEPOSIT = "atm_deposit"
    ONLINE_DEPOSIT = "online_deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class RecurringFrequency(str, Enum):
    ONCE = "once"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class LedgerType(str, Enum):
    DEBIT = "debit"
    CREDIT = "credit"


class TransferDirection(str, Enum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"


class DepositType(str, Enum):
    CASH = "cash"
    CHECK = "check"


class User(SQLModel, table=True):
    # pk and relationship
    user_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk
    customer_id: Optional[int] = Field(
        index=True,
        foreign_key="customer.customer_id",
        nullable=True,
        sa_type=BigInteger,
        ondelete="SET NULL",
    )
    customer: Optional["Customer"] = Relationship()

    # login fields
    username: str = Field(unique=True, max_length=150)
    password_hash: bytes  # no need for salt since bcrypt includes it in the hash
    # info fields
    role: UserRole = Field(default=UserRole.USER, max_length=5)
    last_login: datetime = Field(default_factory=utcnow)
    # TODO - I don't think we ever use this
    # but added it bc it's in the LLD
    status: UserStatus = Field(default=UserStatus.ACTIVE, max_length=6)
    created_at: datetime = Field(default_factory=utcnow)


class Customer(SQLModel, table=True):
    __table_args__ = (
        CheckConstraint(
            "date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')",
            name="ck_customer_dob_over_18",
        ),
    )
    # pk
    customer_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )

    # info fields
    # TODO - do we ever use business?
    customer_type: CustomerType = Field(default=CustomerType.INDIVIDUAL, max_length=10)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    # must be 18 years or older to create account
    date_of_birth: date
    email: str = Field(max_length=255)
    phone_number: str = Field(max_length=32)

    address_id: Optional[int] = Field(
        foreign_key="address.address_id",
        nullable=True,
    )
    address: "Address" = Relationship()
    ssn: str = Field(max_length=9, unique=True)
    kyc_status: KYCStatus = Field(default=KYCStatus.PENDING, max_length=10)


class Address(SQLModel, table=True):
    # pk
    address_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )

    # info fields
    street: str = Field(max_length=255)
    unit: Optional[str] = Field(default=None, max_length=50)
    city: str = Field(max_length=128)
    state: str = Field(max_length=64)
    zip_code: str = Field(max_length=32)
    # Aayush added a good default
    country: str = Field(default="USA", max_length=64)


class Account(SQLModel, table=True):
    # pk
    account_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk
    customer_id: int = Field(
        default=None,
        nullable=False,
        index=True,
        foreign_key="customer.customer_id",
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    customer: Customer = Relationship()

    # info fields
    account_number: str = Field(unique=True, max_length=64)
    routing_number: str = Field(max_length=64)
    account_type: AccountType = Field(max_length=10)
    status: AccountStatus = Field(default=AccountStatus.ACTIVE, max_length=6)
    # check that balance is >= 0
    balance: Decimal = Field(default=0.0, ge=0.0, decimal_places=2, max_digits=18)
    currency: str = Field(default="USD", max_length=3)
    created_at: datetime = Field(default_factory=utcnow)


class ATM(SQLModel, table=True):
    # pk
    atm_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )

    # info fields
    address_id: Optional[int] = Field(
        foreign_key="address.address_id",
        sa_type=BigInteger,
        nullable=False,
    )
    address: Address = Relationship()
    status: ATMStatus = Field(default=ATMStatus.ACTIVE, max_length=15)


class Transaction(SQLModel, table=True):
    # pk
    transaction_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk
    account_id: int = Field(
        index=True,
        sa_type=BigInteger,
        foreign_key="account.account_id",
        nullable=False,
        ondelete="CASCADE",
    )
    account: Account = Relationship()

    # Note: ommitted reference number
    # and skipping "fee" and "adjustment" since those aren't
    # part of the LLD
    transaction_type: TransactionType = Field(max_length=10)
    amount: Decimal = Field(gt=0.0, decimal_places=2, max_digits=18)
    currency: str = Field(default="USD", max_length=3)
    status: TransactionStatus = Field(default=TransactionStatus.PENDING, max_length=10)
    description: str = Field(default="")
    created_at: datetime = Field(default_factory=utcnow)

    # omitting "account.status==active" because we would want
    # to have transactions in the past


class RecurringPayment(SQLModel, table=True):
    # pk
    recurring_payment_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    from_account_id: int = Field(
        index=True,
        foreign_key="account.account_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    from_account: Account = Relationship()

    # info fields
    payee_account_number: str = Field(max_length=64)
    payee_routing_number: str = Field(max_length=64)
    # see Transfer for why we don't need type
    amount: Decimal = Field(gt=0.0, decimal_places=2, max_digits=18)
    currency: str = Field(default="USD", max_length=3)
    frequency: RecurringFrequency = Field(max_length=8)
    next_payment_date: date
    created_at: datetime = Field(default_factory=utcnow)

    # will be None if the recurring payment is active, otherwise it will be the date it was canceled
    canceled_at: Optional[datetime] = Field(default=None)


# for withdrawals (which always happen at an ATM)
class Withdraw(SQLModel, table=True):
    # pk
    withdraw_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk's
    transaction_id: int = Field(
        index=True,
        foreign_key="transaction.transaction_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    transaction: Transaction = Relationship()
    atm_id: int = Field(
        foreign_key="atm.atm_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    atm: ATM = Relationship()


# ledger entries
class LedgerEntry(SQLModel, table=True):
    # pk
    ledger_entry_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # info
    transaction_id: int = Field(
        index=True,
        foreign_key="transaction.transaction_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    transaction: Transaction = Relationship()
    account_id: int = Field(
        index=True,
        foreign_key="account.account_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    account: Account = Relationship()
    type: LedgerType = Field(max_length=6)
    # for amount, currency, and created_at, just check transaction
    # since otherwise this would be redundant and could lead to inconsistencies


# transfers
# following the LLD, if we had an internal transfer,
# then there would be 2 transfers created;
# one would have direction "outgoing" and the other would have direction "incoming"
# and for external transfers, we would have just 1 transfer record.
class Transfer(SQLModel, table=True):
    # pk
    transfer_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk
    transaction_id: int = Field(
        index=True,
        foreign_key="transaction.transaction_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    transaction: Transaction = Relationship()
    # note that we no longer need a type field
    # since the backend infers internal/external based on routing number
    direction: TransferDirection = Field(max_length=8)


# atm deposits
# always happen at an atm
class ATMDeposit(SQLModel, table=True):
    # pk
    deposit_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk's
    transaction_id: int = Field(
        index=True,
        foreign_key="transaction.transaction_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    transaction: Transaction = Relationship()
    atm_id: int = Field(
        foreign_key="atm.atm_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    atm: ATM = Relationship()
    type: DepositType = Field(max_length=8)


# and online deposits are always checks
# so they need a check image path
class OnlineDeposit(SQLModel, table=True):
    # pk
    deposit_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    transaction_id: int = Field(
        index=True,
        foreign_key="transaction.transaction_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    transaction: Transaction = Relationship()
    check_image_name: str = Field(max_length=512, unique=True)
    check_from_routing_number: str = Field(max_length=64)
    check_from_account_number: str = Field(max_length=64)


class PotentialExternalTransfer(SQLModel, table=True):
    # pk
    potential_external_transfer_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    transfer_intent_id: str = Field(max_length=64, unique=True)
    account_id: int = Field(
        foreign_key="account.account_id",
        nullable=False,
        sa_type=BigInteger,
        ondelete="CASCADE",
    )
    account: Account = Relationship()
    amount: Decimal = Field(gt=0.0, decimal_places=2, max_digits=18)
    currency: str = Field(default="USD", max_length=3)
    created_at: datetime = Field(default_factory=utcnow)


# audit log
class AuditLog(SQLModel, table=True):
    # pk
    log_id: Optional[int] = Field(
        default=None,
        primary_key=True,
        sa_type=BigInteger,
    )
    # fk
    # will be null if the action was performed by a
    # user that has since been deleted, but we still want to keep the audit log entry
    user_id: Optional[int] = Field(
        index=True,
        foreign_key="user.user_id",
        nullable=True,
        sa_type=BigInteger,
        ondelete="SET NULL",
    )
    user: User = Relationship()
    action: str = Field(max_length=255)
    object_type: str = Field(max_length=50)
    object_id: int = Field(sa_column=Column(BigInteger(), nullable=False))
    details: dict = Field(sa_column=Column(JSONB, nullable=False))
    timestamp: datetime = Field(default_factory=utcnow)
