from decimal import Decimal

# routing number for Online Bank.
# all online bank accounts should have this routing number
ROUTING_NUMBER = "021000021"

# hardcoding this here because this allows us to provide
# a nicer error message for when we would overflow
# hardcoded it based on Account.balance's max_digits=18, decimal_places=2 constraint
MAX_BALANCE = Decimal("9999999999999999.99")

BALANCE_OVERFLOW_MESSAGE = "This would exceed the account's maximum balance limit."
