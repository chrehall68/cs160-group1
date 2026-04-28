from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlmodel import select, Session

from dependencies.db import get_engine
from models import (
    RecurringFrequency,
    RecurringPayment,
    Transaction,
    TransactionStatus,
    Transfer,
)
from scheduler import process_recurring_payments
from tests.shared import (
    create_account,
    deposit_cash,
    get_account,
    register_user,
    withdraw_cash,
)


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
    deposit_cash(client, account_id, "20.00")

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
        deposit_cash(owner_client, account_id, "20.00")

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


def test_create_recurring_payment_rejects_insufficient_funds(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "5.00")

    response = client.post(
        "/recurring",
        json={
            "from_account_id": account_id,
            "payee_account_number": "9999999999",
            "payee_routing_number": "021000021",
            "amount": "10.00",
            "frequency": "weekly",
            "next_payment_date": _future_date(),
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Insufficient funds for payment"}


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


def _create_recurring(
    client,
    account_id: int,
    amount: str = "5.00",
    frequency: str = "weekly",
    next_payment_date: str | None = None,
    payee_account_number: str = "9999999999",
    payee_routing_number: str = "111000111",
) -> int:
    # ensure the account has at least `amount` so we pass the up-front
    # balance check on /recurring. Tests that need a different post-create
    # balance can deposit/withdraw separately.
    deposit_cash(client, account_id, amount)
    response = client.post(
        "/recurring",
        json={
            "from_account_id": account_id,
            "payee_account_number": payee_account_number,
            "payee_routing_number": payee_routing_number,
            "amount": amount,
            "frequency": frequency,
            "next_payment_date": next_payment_date or _future_date(),
        },
    )
    assert response.status_code == 200, response.text
    with Session(get_engine()) as session:
        row = session.exec(
            select(RecurringPayment)
            .where(RecurringPayment.from_account_id == account_id)
            .order_by(-RecurringPayment.recurring_payment_id)  # type: ignore
        ).first()
        assert row is not None
        return row.recurring_payment_id  # type: ignore


def test_list_recurring_payments_returns_owned_payments(client):
    register_user(client)
    account_id = create_account(client)
    recurring_id = _create_recurring(client, account_id, amount="7.25")

    response = client.get(f"/recurring/{account_id}")
    assert response.status_code == 200
    body = response.json()
    payload = body["recurring_payments"]
    assert len(payload) == 1
    assert payload[0]["recurring_payment_id"] == recurring_id
    assert payload[0]["status"] == "active"
    assert payload[0]["amount"] == "7.25"
    assert body["total_pages"] == 1


def test_list_recurring_payments_paginates(client):
    register_user(client)
    account_id = create_account(client)
    ids = [_create_recurring(client, account_id, amount="1.00") for _ in range(5)]

    first = client.get(f"/recurring/{account_id}?page=1&limit=2")
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["total_pages"] == 3
    assert [p["recurring_payment_id"] for p in first_body["recurring_payments"]] == [
        ids[-1],
        ids[-2],
    ]

    third = client.get(f"/recurring/{account_id}?page=3&limit=2")
    assert third.status_code == 200
    third_body = third.json()
    assert [p["recurring_payment_id"] for p in third_body["recurring_payments"]] == [
        ids[0]
    ]


def test_list_recurring_payments_rejects_invalid_pagination(client):
    register_user(client)
    account_id = create_account(client)

    assert client.get(f"/recurring/{account_id}?page=0").status_code == 400
    assert client.get(f"/recurring/{account_id}?limit=0").status_code == 400


def test_list_recurring_payments_rejects_other_users_account(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)
        _create_recurring(owner_client, account_id)

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.get(f"/recurring/{account_id}")

    assert response.status_code == 403


def test_list_recurring_payments_includes_canceled_and_completed(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "50.00")

    active_id = _create_recurring(client, account_id, amount="1.00")
    canceled_id = _create_recurring(client, account_id, amount="2.00")
    once_id = _create_recurring(
        client,
        account_id,
        amount="3.00",
        frequency="once",
        next_payment_date=date.today().isoformat(),
    )

    # cancel one
    assert client.post(f"/recurring/{canceled_id}/cancel").status_code == 200
    # fire scheduler to mark ONCE payment completed
    process_recurring_payments()

    response = client.get(f"/recurring/{account_id}")
    assert response.status_code == 200
    by_id = {
        p["recurring_payment_id"]: p for p in response.json()["recurring_payments"]
    }
    assert by_id[active_id]["status"] == "active"
    assert by_id[canceled_id]["status"] == "canceled"
    assert by_id[once_id]["status"] == "completed"


def test_cancel_recurring_payment_marks_canceled_and_skips_scheduler(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "50.00")
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="weekly",
        next_payment_date=date.today().isoformat(),
    )
    balance_before = get_account(client, account_id)["balance"]

    response = client.post(f"/recurring/{recurring_id}/cancel")
    assert response.status_code == 200
    assert response.json() == {"message": "Recurring payment canceled"}

    # Running the scheduler should NOT execute the canceled payment.
    process_recurring_payments()
    assert get_account(client, account_id)["balance"] == balance_before

    with Session(get_engine()) as session:
        row = session.get(RecurringPayment, recurring_id)
        assert row is not None
        assert row.canceled_at is not None


def test_cancel_recurring_payment_rejects_already_canceled(client):
    register_user(client)
    account_id = create_account(client)
    recurring_id = _create_recurring(client, account_id)

    assert client.post(f"/recurring/{recurring_id}/cancel").status_code == 200
    response = client.post(f"/recurring/{recurring_id}/cancel")
    assert response.status_code == 400
    assert response.json() == {"detail": "Recurring payment is already canceled"}


def test_cancel_recurring_payment_rejects_already_completed(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "20.00")
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="once",
        next_payment_date=date.today().isoformat(),
    )
    process_recurring_payments()

    response = client.post(f"/recurring/{recurring_id}/cancel")
    assert response.status_code == 400
    assert response.json() == {"detail": "Recurring payment is already completed"}


def test_cancel_recurring_payment_rejects_other_user(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)
        recurring_id = _create_recurring(owner_client, account_id)

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.post(f"/recurring/{recurring_id}/cancel")

    assert response.status_code == 403


def test_recurring_payment_transactions_are_empty_before_execution(client):
    register_user(client)
    account_id = create_account(client)
    recurring_id = _create_recurring(client, account_id)

    response = client.get(f"/recurring/{recurring_id}/transactions")
    assert response.status_code == 200
    assert response.json() == {"transactions": [], "total_pages": 0}


def test_recurring_payment_transactions_lists_executed_transfers(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "50.00")
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="weekly",
        next_payment_date=date.today().isoformat(),
    )

    process_recurring_payments()

    response = client.get(f"/recurring/{recurring_id}/transactions")
    assert response.status_code == 200
    body = response.json()
    txns = body["transactions"]
    assert len(txns) == 1
    assert txns[0]["amount"] == "5.00"
    assert txns[0]["ledger_type"] == "debit"
    assert txns[0]["transaction_type"] == "transfer"
    assert body["total_pages"] == 1


def test_recurring_payment_transactions_paginates(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "100.00")
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="1.00",
        frequency="weekly",
        next_payment_date=date.today().isoformat(),
    )

    # fire the scheduler three times to rack up three executions
    for _ in range(3):
        process_recurring_payments()
        # roll the date back so the next tick fires again
        with Session(get_engine()) as session:
            row = session.get(RecurringPayment, recurring_id)
            assert row is not None
            row.next_payment_date = date.today()
            session.add(row)
            session.commit()

    first = client.get(f"/recurring/{recurring_id}/transactions?page=1&limit=2")
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["total_pages"] == 2
    assert len(first_body["transactions"]) == 2

    second = client.get(f"/recurring/{recurring_id}/transactions?page=2&limit=2")
    assert second.status_code == 200
    assert len(second.json()["transactions"]) == 1


def test_recurring_payment_transactions_rejects_invalid_pagination(client):
    register_user(client)
    account_id = create_account(client)
    recurring_id = _create_recurring(client, account_id)

    assert (
        client.get(f"/recurring/{recurring_id}/transactions?page=0").status_code == 400
    )
    assert (
        client.get(f"/recurring/{recurring_id}/transactions?limit=0").status_code == 400
    )


def test_recurring_payment_transactions_rejects_other_user(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)
        recurring_id = _create_recurring(owner_client, account_id)

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.get(f"/recurring/{recurring_id}/transactions")

    assert response.status_code == 403


def test_scheduler_advances_weekly_recurring_payment_and_links_transfer(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "50.00")
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="weekly",
        next_payment_date=date.today().isoformat(),
    )

    process_recurring_payments()

    with Session(get_engine()) as session:
        payment = session.get(RecurringPayment, recurring_id)
        assert payment is not None
        assert payment.next_payment_date == date.today() + timedelta(days=7)
        assert payment.completed_at is None

        transfer = session.exec(
            select(Transfer).where(Transfer.recurring_payment_id == recurring_id)
        ).one()
        assert transfer.recurring_payment_id == recurring_id


def test_scheduler_records_failed_recurring_payment_when_funds_insufficient(client):
    register_user(client)
    account_id = create_account(client)
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="weekly",
        next_payment_date=date.today().isoformat(),
    )
    # drain the account so the scheduler hits "Insufficient funds" at fire
    # time. Up-front balance check on /recurring would reject this otherwise.
    withdraw_cash(client, account_id, "5.00")

    process_recurring_payments()

    # balance untouched by the (failed) scheduler run
    assert get_account(client, account_id)["balance"] == "0.00"

    # next_payment_date advanced even though the attempt failed
    with Session(get_engine()) as session:
        payment = session.get(RecurringPayment, recurring_id)
        assert payment is not None
        assert payment.next_payment_date == date.today() + timedelta(days=7)
        assert payment.completed_at is None

        # a FAILED transaction was recorded with the reason in the description
        txn = session.exec(
            select(Transaction).join(
                Transfer, Transfer.transaction_id == Transaction.transaction_id  # type: ignore[arg-type]
            ).where(Transfer.recurring_payment_id == recurring_id)
        ).one()
        assert txn.status == TransactionStatus.FAILED
        assert "Insufficient funds" in txn.description

    # the user sees the failed attempt in their transaction history
    history = client.get(f"/transactions/{account_id}")
    assert history.status_code == 200
    failed_txns = [
        t for t in history.json()["transactions"] if t["status"] == "failed"
    ]
    assert len(failed_txns) == 1
    assert failed_txns[0]["transaction_type"] == "transfer"
    assert failed_txns[0]["amount"] == "5.00"
    assert "Insufficient funds" in failed_txns[0]["description"]

    # the failed attempt also shows up in the recurring payment's transaction list
    recurring_history = client.get(f"/recurring/{recurring_id}/transactions")
    assert recurring_history.status_code == 200
    recurring_txns = recurring_history.json()["transactions"]
    assert len(recurring_txns) == 1
    assert recurring_txns[0]["status"] == "failed"


def test_scheduler_records_failed_recurring_payment_when_internal_payee_missing(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "50.00")
    # routing matches our internal routing, but account doesn't exist
    from constants import ROUTING_NUMBER

    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="weekly",
        next_payment_date=date.today().isoformat(),
        payee_account_number="0000000000",
        payee_routing_number=ROUTING_NUMBER,
    )
    balance_before = get_account(client, account_id)["balance"]

    process_recurring_payments()

    # balance untouched (process_transfer rolled back the speculative debit)
    assert get_account(client, account_id)["balance"] == balance_before

    with Session(get_engine()) as session:
        payment = session.get(RecurringPayment, recurring_id)
        assert payment is not None
        assert payment.next_payment_date == date.today() + timedelta(days=7)

        txn = session.exec(
            select(Transaction).join(
                Transfer, Transfer.transaction_id == Transaction.transaction_id  # type: ignore[arg-type]
            ).where(Transfer.recurring_payment_id == recurring_id)
        ).one()
        assert txn.status == TransactionStatus.FAILED
        assert "Payee account number not found" in txn.description


def test_scheduler_marks_failed_once_recurring_payment_completed(client):
    register_user(client)
    account_id = create_account(client)
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="once",
        next_payment_date=date.today().isoformat(),
    )
    # drain so the ONCE attempt fails when the scheduler fires
    withdraw_cash(client, account_id, "5.00")

    process_recurring_payments()

    with Session(get_engine()) as session:
        payment = session.get(RecurringPayment, recurring_id)
        assert payment is not None
        # ONCE payments are marked completed even when they fail, so the
        # scheduler doesn't keep re-firing them
        assert payment.completed_at is not None

        txn = session.exec(
            select(Transaction).join(
                Transfer, Transfer.transaction_id == Transaction.transaction_id  # type: ignore[arg-type]
            ).where(Transfer.recurring_payment_id == recurring_id)
        ).one()
        assert txn.status == TransactionStatus.FAILED


def test_scheduler_marks_once_recurring_payment_completed_preserves_row(client):
    register_user(client)
    account_id = create_account(client)
    deposit_cash(client, account_id, "20.00")
    recurring_id = _create_recurring(
        client,
        account_id,
        amount="5.00",
        frequency="once",
        next_payment_date=date.today().isoformat(),
    )

    process_recurring_payments()
    balance_after_first_run = get_account(client, account_id)["balance"]

    with Session(get_engine()) as session:
        payment = session.get(RecurringPayment, recurring_id)
        assert payment is not None, "ONCE recurring payment row should be preserved"
        assert payment.completed_at is not None
        assert payment.frequency == RecurringFrequency.ONCE

    # second scheduler tick should NOT re-fire a completed payment
    process_recurring_payments()
    assert get_account(client, account_id)["balance"] == balance_after_first_run
