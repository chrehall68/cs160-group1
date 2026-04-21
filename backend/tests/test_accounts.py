import io
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlmodel import Session, func, select
from models import ATM, OnlineDeposit, Transaction, TransactionToAccount
from dependencies.db import get_engine
import constants

from tests.shared import create_account, login_admin, make_atm_address, register_user


def make_check_deposit_data(account_id: int, amount: str = "250.00"):
    """Build multipart form data for a check deposit request."""
    return {
        "data": {
            "account_id": str(account_id),
            "check_amount": amount,
            "from_account_number": "9876543210",
            "from_routing_number": "110000000",
        },
        "files": {
            "check_img": ("check.png", io.BytesIO(b"fake-png-bytes"), "image/png"),
        },
    }


def post_check_deposit(client, account_id: int, **overrides):
    """Helper that posts a check deposit with S3 mocked out."""
    parts = make_check_deposit_data(account_id)
    parts["data"].update(overrides)
    return client.post(
        "/deposit/check",
        data=parts["data"],
        files=parts["files"],
    )


def test_create_account_returns_account_id_for_authenticated_user(client):
    register_user(client)

    response = client.post("/accounts/create", json={"account_type": "checking"})

    assert response.status_code == 200
    assert isinstance(response.json()["account_id"], int)


def test_get_account_returns_owned_account_details(client):
    register_user(client)
    account_id = create_account(client, "savings")

    response = client.get(f"/accounts/{account_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["account_id"] == account_id
    assert body["account_type"] == "savings"
    assert body["status"] == "active"
    assert body["balance"] == "0.00"
    assert body["currency"] == "USD"


def test_get_account_rejects_other_users_account(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.get(f"/accounts/{account_id}")

    assert response.status_code == 403
    assert response.json() == {"detail": "Not your account"}


def test_get_all_accounts_returns_only_active_accounts(client):
    register_user(client)
    active_account_id = create_account(client, "checking")
    closed_account_id = create_account(client, "savings")

    close_response = client.delete(f"/accounts/{closed_account_id}")
    assert close_response.status_code == 200

    response = client.get("/accounts")

    assert response.status_code == 200
    accounts = response.json()["accounts"]
    assert len(accounts) == 1
    assert accounts[0]["account_id"] == active_account_id
    assert accounts[0]["status"] == "active"


def test_deposit_cash_updates_account_balance(client):
    register_user(client)
    account_id = create_account(client)

    deposit_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "125.50",
            "atm_address": make_atm_address(),
        },
    )

    assert deposit_response.status_code == 200
    assert deposit_response.json() == {}

    account_response = client.get(f"/accounts/{account_id}")
    assert account_response.status_code == 200
    assert account_response.json()["balance"] == "125.50"


def test_deposit_cash_rejects_balance_overflow(client):
    register_user(client)
    account_id = create_account(client)

    fill_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "9999999999999999.00",
            "atm_address": make_atm_address(),
        },
    )
    assert fill_response.status_code == 200

    overflow_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "1.00",
            "atm_address": make_atm_address(),
        },
    )
    assert overflow_response.status_code == 400
    assert overflow_response.json() == {"detail": constants.BALANCE_OVERFLOW_MESSAGE}


def test_withdraw_rejects_insufficient_funds(client):
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/withdraw",
        json={
            "account_id": account_id,
            "cash_amount": "20.00",
            "atm_address": make_atm_address(),
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Insufficient funds"}


def test_withdraw_updates_account_balance(client):
    register_user(client)
    account_id = create_account(client)
    deposit_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "100.00",
            "atm_address": make_atm_address(),
        },
    )
    assert deposit_response.status_code == 200

    withdraw_response = client.post(
        "/withdraw",
        json={
            "account_id": account_id,
            "cash_amount": "40.00",
            "atm_address": make_atm_address(),
        },
    )

    assert withdraw_response.status_code == 200
    assert withdraw_response.json() == {}

    account_response = client.get(f"/accounts/{account_id}")
    assert account_response.status_code == 200
    assert account_response.json()["balance"] == "60.00"


def test_close_account_rejects_non_zero_balance(client):
    register_user(client)
    account_id = create_account(client)
    deposit_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "10.00",
            "atm_address": make_atm_address(),
        },
    )
    assert deposit_response.status_code == 200

    response = client.delete(f"/accounts/{account_id}")

    assert response.status_code == 400
    assert response.json() == {"detail": "Account must have $0 balance before closing"}


def test_close_account_fails_when_account_is_already_closed(client):
    register_user(client)
    account_id = create_account(client)

    first_close_response = client.delete(f"/accounts/{account_id}")
    second_close_response = client.delete(f"/accounts/{account_id}")

    assert first_close_response.status_code == 200
    assert first_close_response.json() == {}
    assert second_close_response.status_code == 400
    assert second_close_response.json() == {"detail": "Account is already closed"}


def test_no_duplicate_atms_created(client):
    register_user(client)
    account_id = create_account(client)

    first_deposit_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "10.00",
            "atm_address": make_atm_address(),
        },
    )
    second_deposit_response = client.post(
        "/deposit/cash",
        json={
            "account_id": account_id,
            "cash_amount": "10.00",
            "atm_address": make_atm_address(),
        },
    )
    assert first_deposit_response.status_code == 200
    assert second_deposit_response.status_code == 200

    with Session(get_engine()) as session:
        count = session.exec(select(func.count()).select_from(ATM)).one()

    assert count == 1


def test_manager_accounts_returns_paginated_accounts_for_admin(client):
    register_user(client)
    account_id = create_account(client, "savings")

    login_admin(client)

    response = client.get("/manager/accounts", params={"page": 1, "limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 1
    assert body["total_pages"] >= 1

    returned_account = next(
        account for account in body["data"] if account["account_id"] == account_id
    )
    assert returned_account["account_type"] == "savings"
    assert returned_account["status"] == "active"
    assert returned_account["balance"] == "0.00"


def test_manager_accounts_rejects_invalid_pagination_arguments(client):
    login_admin(client)

    zero_limit_response = client.get("/manager/accounts", params={"limit": 0})
    zero_page_response = client.get("/manager/accounts", params={"page": 0})

    assert zero_limit_response.status_code == 400
    assert zero_limit_response.json() == {"detail": "limit must be positive"}
    assert zero_page_response.status_code == 400
    assert zero_page_response.json() == {"detail": "page must be positive"}


def test_manager_accounts_rejects_non_admin(client):
    register_user(client)

    response = client.get("/manager/accounts")

    assert response.status_code == 403
    assert response.json() == {"detail": "Access denied. Admin privileges required."}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_updates_balance(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    response = post_check_deposit(client, account_id, check_amount="250.00")

    assert response.status_code == 200
    assert response.json() == {}

    account = client.get(f"/accounts/{account_id}").json()
    assert account["balance"] == "250.00"


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_creates_transaction_and_online_deposit(
    mock_getenv, mock_boto3, client
):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    post_check_deposit(client, account_id, check_amount="100.00")

    with Session(get_engine()) as session:
        txn = session.exec(
            select(Transaction)
            .join(
                TransactionToAccount,
                TransactionToAccount.transaction_id == Transaction.transaction_id,  # type: ignore
            )
            .where(TransactionToAccount.account_id == account_id)
        ).first()
        assert txn is not None
        assert txn.transaction_type.value == "online_deposit"
        assert txn.status.value == "completed"
        assert txn.amount == 100

        deposit = session.exec(
            select(OnlineDeposit).where(
                OnlineDeposit.transaction_id == txn.transaction_id
            )
        ).first()
        assert deposit is not None
        assert deposit.check_from_routing_number == "110000000"
        assert deposit.check_from_account_number == "9876543210"


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_uploads_to_s3(mock_getenv, mock_boto3, client):
    mock_s3 = MagicMock()
    mock_boto3.client.return_value = mock_s3
    register_user(client)
    account_id = create_account(client)

    post_check_deposit(client, account_id)

    mock_s3.upload_fileobj.assert_called_once()
    call_args = mock_s3.upload_fileobj.call_args
    assert call_args[0][1] == "test-bucket"
    assert call_args[0][2].endswith(".png")


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_rejects_nonexistent_account(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)

    response = post_check_deposit(client, account_id=999999)

    assert response.status_code == 404
    assert response.json() == {"detail": "Account not found"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_rejects_other_users_account(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()

    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = post_check_deposit(other_client, account_id)

    assert response.status_code == 403
    assert response.json() == {"detail": "Not your account"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_rejects_zero_amount(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    response = post_check_deposit(client, account_id, check_amount="0")

    assert response.status_code == 400
    assert response.json() == {"detail": "Amount must be positive"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_rejects_negative_amount(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    response = post_check_deposit(client, account_id, check_amount="-50.00")

    assert response.status_code == 400
    assert response.json() == {"detail": "Amount must be positive"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_rejects_invalid_image_type(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/deposit/check",
        data={
            "account_id": str(account_id),
            "check_amount": "100.00",
            "from_account_number": "9876543210",
            "from_routing_number": "110000000",
        },
        files={
            "check_img": ("check.pdf", io.BytesIO(b"fake-pdf"), "application/pdf"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Check image must be PNG or JPEG"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_rejects_own_routing_number(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    response = post_check_deposit(client, account_id, from_routing_number="021000021")

    assert response.status_code == 400
    assert response.json() == {"detail": "Checks are not issued by Online Bank"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_on_closed_account(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)
    client.delete(f"/accounts/{account_id}")

    response = post_check_deposit(client, account_id)

    assert response.status_code == 400
    assert response.json() == {"detail": "Account is not active"}


@patch("routes.accounts.boto3")
@patch("routes.accounts.os.getenv", return_value="test-bucket")
def test_deposit_check_accepts_jpeg(mock_getenv, mock_boto3, client):
    mock_boto3.client.return_value = MagicMock()
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/deposit/check",
        data={
            "account_id": str(account_id),
            "check_amount": "75.00",
            "from_account_number": "9876543210",
            "from_routing_number": "110000000",
        },
        files={
            "check_img": ("check.jpg", io.BytesIO(b"fake-jpeg"), "image/jpeg"),
        },
    )

    assert response.status_code == 200
    account = client.get(f"/accounts/{account_id}").json()
    assert account["balance"] == "75.00"
