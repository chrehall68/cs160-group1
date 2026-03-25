from fastapi.testclient import TestClient
from sqlmodel import Session, func, select
from models import ATM
from dependencies.db import get_engine

from tests.shared import create_account, make_atm_address, register_user


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
