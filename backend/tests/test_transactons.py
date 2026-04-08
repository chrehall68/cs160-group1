from fastapi.testclient import TestClient

from tests.shared import (
    create_account,
    deposit_cash,
    login_admin,
    register_user,
    withdraw_cash,
)


def test_get_account_transactions_returns_empty_history_for_new_account(client):
    register_user(client)
    account_id = create_account(client)

    response = client.get(f"/transactions/{account_id}")

    assert response.status_code == 200
    assert response.json() == {"transactions": [], "total_pages": 0}


def test_get_account_transactions_returns_most_recent_first_with_pagination(client):
    register_user(client)
    account_id = create_account(client)

    deposit_cash(client, account_id, "100.00")
    withdraw_cash(client, account_id, "30.00")
    deposit_cash(client, account_id, "5.00")

    first_page = client.get(
        f"/transactions/{account_id}", params={"page": 1, "limit": 2}
    )
    second_page = client.get(
        f"/transactions/{account_id}", params={"page": 2, "limit": 2}
    )

    assert first_page.status_code == 200
    first_page_body = first_page.json()
    assert first_page_body["total_pages"] == 2
    assert len(first_page_body["transactions"]) == 2
    assert first_page_body["transactions"][0]["type"] == "credit"
    assert first_page_body["transactions"][0]["amount"] == "5.00"
    assert first_page_body["transactions"][1]["type"] == "debit"
    assert first_page_body["transactions"][1]["amount"] == "30.00"
    assert (
        first_page_body["transactions"][0]["transaction_id"]
        > first_page_body["transactions"][1]["transaction_id"]
    )

    assert second_page.status_code == 200
    second_page_body = second_page.json()
    assert second_page_body["total_pages"] == 2
    assert second_page_body["transactions"] == [
        {
            "transaction_id": second_page_body["transactions"][0]["transaction_id"],
            "type": "credit",
            "amount": "100.00",
            "currency": "USD",
            "created_at": second_page_body["transactions"][0]["created_at"],
        }
    ]


def test_get_account_transactions_rejects_invalid_pagination_arguments(client):
    register_user(client)
    account_id = create_account(client)

    zero_limit_response = client.get(f"/transactions/{account_id}", params={"limit": 0})
    zero_page_response = client.get(f"/transactions/{account_id}", params={"page": 0})

    assert zero_limit_response.status_code == 400
    assert zero_limit_response.json() == {"detail": "limit must be positive"}
    assert zero_page_response.status_code == 400
    assert zero_page_response.json() == {"detail": "page must be positive"}


def test_get_account_transactions_rejects_other_users_account(client):
    with TestClient(client.app, base_url="https://testserver") as owner_client:
        register_user(owner_client)
        account_id = create_account(owner_client)
        deposit_cash(owner_client, account_id, "50.00")

    with TestClient(client.app, base_url="https://testserver") as other_client:
        register_user(other_client)
        response = other_client.get(f"/transactions/{account_id}")

    assert response.status_code == 403
    assert response.json() == {"detail": "Account does not belong to user"}


def test_get_account_transactions_rejects_missing_account(client):
    register_user(client)

    response = client.get("/transactions/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Account not found"}


def test_manager_transactions_returns_newest_first_with_pagination_for_admin(client):
    register_user(client)
    account_id = create_account(client)

    deposit_cash(client, account_id, "100.00")
    withdraw_cash(client, account_id, "30.00")
    deposit_cash(client, account_id, "5.00")

    login_admin(client)

    first_page = client.get("/manager/transactions", params={"page": 1, "limit": 2})
    second_page = client.get("/manager/transactions", params={"page": 2, "limit": 2})

    assert first_page.status_code == 200
    first_page_body = first_page.json()
    assert first_page_body["page"] == 1
    assert first_page_body["total_pages"] == 2
    assert len(first_page_body["data"]) == 2
    assert first_page_body["data"][0]["amount"] == "5.00"
    assert first_page_body["data"][1]["amount"] == "30.00"
    assert (
        first_page_body["data"][0]["transaction_id"]
        > first_page_body["data"][1]["transaction_id"]
    )

    assert second_page.status_code == 200
    second_page_body = second_page.json()
    assert second_page_body["page"] == 2
    assert second_page_body["total_pages"] == 2
    assert len(second_page_body["data"]) == 1
    assert second_page_body["data"][0]["amount"] == "100.00"


def test_manager_transactions_rejects_invalid_pagination_arguments(client):
    login_admin(client)

    zero_limit_response = client.get("/manager/transactions", params={"limit": 0})
    zero_page_response = client.get("/manager/transactions", params={"page": 0})

    assert zero_limit_response.status_code == 400
    assert zero_limit_response.json() == {"detail": "limit must be positive"}
    assert zero_page_response.status_code == 400
    assert zero_page_response.json() == {"detail": "page must be positive"}


def test_manager_transactions_rejects_invalid_date_filters(client):
    login_admin(client)

    invalid_start_response = client.get(
        "/manager/transactions", params={"start_date": "not-a-date"}
    )
    invalid_end_response = client.get(
        "/manager/transactions", params={"end_date": "2026-13-01"}
    )

    assert invalid_start_response.status_code == 400
    assert invalid_start_response.json() == {
        "detail": "start_date must be a valid ISO 8601 date or datetime"
    }
    assert invalid_end_response.status_code == 400
    assert invalid_end_response.json() == {
        "detail": "end_date must be a valid ISO 8601 date or datetime"
    }


def test_manager_transactions_rejects_start_date_after_end_date(client):
    login_admin(client)

    response = client.get(
        "/manager/transactions",
        params={"start_date": "2026-04-10", "end_date": "2026-04-09"},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "start_date must be before or equal to end_date"
    }


def test_manager_transactions_rejects_non_admin(client):
    register_user(client)

    response = client.get("/manager/transactions")

    assert response.status_code == 403
    assert response.json() == {"detail": "Access denied. Admin privileges required."}
