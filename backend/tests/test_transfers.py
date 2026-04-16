from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlmodel import select, Session

from dependencies.db import get_engine
from models import RecurringPayment
from tests.shared import create_account, deposit_cash, get_account, register_user


def _future_date(days: int = 1) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def test_internal_transfer_to_internal_account_succeeds_and_records_history(client):
    register_user(client)
    account_id_a = create_account(client)
    deposit_cash(client, account_id_a, "20.34")

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        account_id_b = create_account(other_client)
        account_info = get_account(other_client, account_id_b)

        response = client.post(
            "/transfer/internal",
            json={
                "from_account_id": account_id_a,
                "to_account_number": account_info["account_number"],
                "to_routing_number": account_info["routing_number"],
                "amount": "20.34",
            },
        )

        assert response.status_code == 200, response.text
        assert response.json() == {"message": "Transfer successful"}
        assert get_account(client, account_id_a)["balance"] == "0.00"
        assert get_account(other_client, account_id_b)["balance"] == "20.34"

        source_history = client.get(f"/transactions/{account_id_a}")
        destination_history = other_client.get(f"/transactions/{account_id_b}")

        assert source_history.status_code == 200
        assert source_history.json()["transactions"][0]["ledger_type"] == "debit"
        assert source_history.json()["transactions"][0]["amount"] == "20.34"

        assert destination_history.status_code == 200
        assert destination_history.json()["transactions"][0]["ledger_type"] == "credit"
        assert destination_history.json()["transactions"][0]["amount"] == "20.34"


def test_internal_transfer_to_external_account_succeeds(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "15.00")

    response = client.post(
        "/transfer/internal",
        json={
            "from_account_id": account_id,
            "to_account_number": "9999999999",
            "to_routing_number": "111000111",
            "amount": "5.00",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Transfer successful"}
    assert get_account(client, account_id)["balance"] == "10.00"

    source_history = client.get(f"/transactions/{account_id}")
    assert source_history.status_code == 200
    assert source_history.json()["transactions"][0]["ledger_type"] == "debit"
    assert source_history.json()["transactions"][0]["amount"] == "5.00"


def test_internal_transfer_rejects_same_account_destination(client):
    register_user(client)
    account_id = create_account(client)
    account_info = get_account(client, account_id)
    deposit_cash(client, account_id, "15.00")

    response = client.post(
        "/transfer/internal",
        json={
            "from_account_id": account_id,
            "to_account_number": account_info["account_number"],
            "to_routing_number": account_info["routing_number"],
            "amount": "5.00",
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Cannot transfer to the same account"}


def test_internal_transfer_rejects_insufficient_funds(client):
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/transfer/internal",
        json={
            "from_account_id": account_id,
            "to_account_number": "9999999999",
            "to_routing_number": "111000111",
            "amount": "5.00",
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Insufficient funds for payment"}


def test_internal_transfer_rejects_missing_source_account(client):
    register_user(client)

    response = client.post(
        "/transfer/internal",
        json={
            "from_account_id": 999999,
            "to_account_number": "9999999999",
            "to_routing_number": "111000111",
            "amount": "5.00",
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Source account not found"}


def test_internal_transfer_rejects_other_users_source_account(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)
        deposit_cash(owner_client, account_id, "25.00")

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.post(
            "/transfer/internal",
            json={
                "from_account_id": account_id,
                "to_account_number": "9999999999",
                "to_routing_number": "111000111",
                "amount": "5.00",
            },
        )

    assert response.status_code == 403
    assert response.json() == {"detail": "Account does not belong to user"}


def test_internal_transfer_rejects_missing_internal_payee_account(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "15.00")

    response = client.post(
        "/transfer/internal",
        json={
            "from_account_id": account_id,
            "to_account_number": "9999999999",
            "to_routing_number": "021000021",
            "amount": "5.00",
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Payee account number not found"}


def test_internal_transfer_rejects_inactive_internal_payee_account(client):
    register_user(client)
    account_id_a = create_account(client)
    deposit_cash(client, account_id_a, "15.00")

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        account_id_b = create_account(other_client)
        account_info = get_account(other_client, account_id_b)
        close_response = other_client.delete(f"/accounts/{account_id_b}")
        assert close_response.status_code == 200

        response = client.post(
            "/transfer/internal",
            json={
                "from_account_id": account_id_a,
                "to_account_number": account_info["account_number"],
                "to_routing_number": account_info["routing_number"],
                "amount": "5.00",
            },
        )

    assert response.status_code == 400
    assert response.json() == {"detail": "Payee account is not active"}


def test_create_recurring_payment_succeeds_for_owned_active_account(client):
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/recurring",
        json={
            "from_account_id": account_id,
            "payee_account_number": "9999999999",
            "payee_routing_number": "021000021",
            "amount": "12.50",
            "frequency": "weekly",
            "next_payment_date": _future_date(),
        },
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Recurring payment scheduled"}

    with Session(get_engine()) as session:
        recurring = session.exec(
            select(RecurringPayment).where(
                RecurringPayment.from_account_id == account_id
            )
        ).all()
        assert len(recurring) == 1
        assert str(recurring[0].amount) == "12.50"
        assert recurring[0].frequency.value == "weekly"


def test_create_recurring_payment_rejects_other_users_account(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.post(
            "/recurring",
            json={
                "from_account_id": account_id,
                "payee_account_number": "9999999999",
                "payee_routing_number": "021000021",
                "amount": "12.50",
                "frequency": "weekly",
                "next_payment_date": _future_date(),
            },
        )

    assert response.status_code == 403
    assert response.json() == {"detail": "Account does not belong to user"}


def test_create_recurring_payment_rejects_missing_account(client):
    register_user(client)

    response = client.post(
        "/recurring",
        json={
            "from_account_id": 999999,
            "payee_account_number": "9999999999",
            "payee_routing_number": "021000021",
            "amount": "12.50",
            "frequency": "weekly",
            "next_payment_date": _future_date(),
        },
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Account not found"}


def test_create_recurring_payment_rejects_inactive_account(client):
    register_user(client)
    account_id = create_account(client)
    close_response = client.delete(f"/accounts/{account_id}")
    assert close_response.status_code == 200

    response = client.post(
        "/recurring",
        json={
            "from_account_id": account_id,
            "payee_account_number": "9999999999",
            "payee_routing_number": "021000021",
            "amount": "12.50",
            "frequency": "weekly",
            "next_payment_date": _future_date(),
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Account is not active"}


def test_create_recurring_payment_rejects_past_next_payment_date(client):
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/recurring",
        json={
            "from_account_id": account_id,
            "payee_account_number": "9999999999",
            "payee_routing_number": "021000021",
            "amount": "12.50",
            "frequency": "weekly",
            "next_payment_date": _future_date(-1),
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Next payment date must be today or later"}


def test_create_recurring_payment_rejects_negative_amount(client):
    register_user(client)
    account_id = create_account(client)

    response = client.post(
        "/recurring",
        json={
            "from_account_id": account_id,
            "payee_account_number": "9999999999",
            "payee_routing_number": "021000021",
            "amount": "-1.22",
            "frequency": "weekly",
            "next_payment_date": _future_date(),
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "amount"]
    assert (
        response.json()["detail"][0]["msg"] == "Value error, Amount must be nonnegative"
    )
