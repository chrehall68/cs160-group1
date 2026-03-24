from fastapi.testclient import TestClient

from tests.shared import create_account, register_user, withdraw_cash, deposit_cash


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
