from uuid import uuid4
from datetime import date
from fastapi.testclient import TestClient


def _register_payload(username: str | None = None) -> dict:
    suffix = uuid4().hex[:8]
    return {
        "username": username or f"user_{suffix}",
        "password": "StrongPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "date_of_birth": "2000-01-01",
        "email": f"user_{suffix}@example.com",
        "phone": "5551234567",
        "address": {
            "street": "1 Integration Way",
            "unit": "10A",
            "city": "San Diego",
            "state": "CA",
            "zipcode": "92101",
            "country": "USA",
        },
        "ssn": f"{uuid4().int % 1_000_000_000:09d}",
    }


def test_register_creates_user_and_sets_cookie(client):
    response = client.post("/user", json=_register_payload())

    assert response.status_code == 200

    body = response.json()
    assert body["role"] == "user"
    assert isinstance(body["user_id"], int)
    assert body["access_token"]
    assert "access_token=" in response.headers["set-cookie"]


def test_register_rejects_duplicate_username(client):
    payload = _register_payload(username="duplicate_user")

    first_response = client.post("/user", json=payload)
    second_response = client.post("/user", json={**payload, "email": "new@example.com"})

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json() == {"detail": "Username already exists"}


def test_register_rejects_user_younger_than_18(client):
    payload = _register_payload()
    today = date.today()
    underage_dob = today.replace(year=today.year - 17).isoformat()

    response = client.post("/user", json={**payload, "date_of_birth": underage_dob})

    assert response.status_code == 422

    body = response.json()
    assert body["detail"][0]["loc"] == ["body", "date_of_birth"]
    assert body["detail"][0]["msg"] == "Value error, User must be at least 18 years old"


def test_register_rejects_phone_number_with_wrong_length(client):
    payload = _register_payload()

    response = client.post("/user", json={**payload, "phone": "555123456"})

    assert response.status_code == 422

    body = response.json()
    assert body["detail"][0]["loc"] == ["body", "phone"]
    assert body["detail"][0]["msg"] == "Value error, Phone number must be 10 digits"


def test_register_rejects_ssn_with_wrong_length(client):
    payload = _register_payload()

    response = client.post("/user", json={**payload, "ssn": "12345678"})

    assert response.status_code == 422

    body = response.json()
    assert body["detail"][0]["loc"] == ["body", "ssn"]
    assert body["detail"][0]["msg"] == "Value error, SSN must be 9 digits"


def test_login_returns_token_for_existing_user(client):
    payload = _register_payload()
    register_response = client.post("/user", json=payload)

    assert register_response.status_code == 200

    login_response = client.post(
        "/login",
        json={"username": payload["username"], "password": payload["password"]},
    )

    assert login_response.status_code == 200

    body = login_response.json()
    assert body["role"] == "user"
    assert body["access_token"]
    assert "access_token=" in login_response.headers["set-cookie"]


def test_login_rejects_invalid_username_or_password(client):
    payload = _register_payload()
    register_response = client.post("/user", json=payload)

    assert register_response.status_code == 200

    invalid_username_response = client.post(
        "/login",
        json={"username": f'{payload["username"]}_wrong', "password": payload["password"]},
    )
    invalid_password_response = client.post(
        "/login",
        json={"username": payload["username"], "password": "WrongPassword123!"},
    )

    assert invalid_username_response.status_code == 400
    assert invalid_username_response.json() == {
        "detail": "Invalid username or password"
    }
    assert "set-cookie" not in invalid_username_response.headers

    assert invalid_password_response.status_code == 400
    assert invalid_password_response.json() == {
        "detail": "Invalid username or password"
    }
    assert "set-cookie" not in invalid_password_response.headers


def test_delete_user_allows_authenticated_owner_without_open_accounts(client):
    payload = _register_payload()
    register_response = client.post("/user", json=payload)

    assert register_response.status_code == 200

    user_id = register_response.json()["user_id"]
    delete_response = client.delete(f"/user/{user_id}")

    assert delete_response.status_code == 200
    assert delete_response.json() == {}

    login_response = client.post(
        "/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    assert login_response.status_code == 400
    assert login_response.json() == {"detail": "Invalid username or password"}


def test_logout_requires_existing_cookie(client):
    response = client.post("/logout")

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}

def test_logout_clears_cookie_and_blocks_protected(client):
    # register sets the auth cookie
    r = client.post("/user", json=_register_payload())
    assert r.status_code == 200

    # logout should remove the cookie and return an empty body
    logout = client.post("/logout")
    assert logout.status_code == 200
    assert logout.json() == {}

    # protected endpoint should now require auth
    protected = client.get("/customer")
    assert protected.status_code == 401


def test_get_customer_returns_registered_info(client):
    payload = _register_payload()
    r = client.post("/user", json=payload)
    assert r.status_code == 200

    info = client.get("/customer")
    assert info.status_code == 200
    body = info.json()
    assert body["first_name"] == payload["first_name"]
    assert body["last_name"] == payload["last_name"]
    assert body["email"] == payload["email"]
    assert body["phone"] == payload["phone"]


def test_cannot_delete_another_user(client):
    a = _register_payload()
    b = _register_payload()

    # create user A using an isolated TestClient instance
    with TestClient(client.app, base_url="https://testserver") as tc_a:
        resp_a = tc_a.post("/user", json=a)
        assert resp_a.status_code == 200
        user_id_a = resp_a.json()["user_id"]

        # create user B in a separate TestClient so cookies don't collide
        with TestClient(client.app, base_url="https://testserver") as tc_b:
            resp_b = tc_b.post("/user", json=b)
            assert resp_b.status_code == 200
            user_id_b = resp_b.json()["user_id"]

        # attempt to delete user B while authenticated as A
        delete_resp = tc_a.delete(f"/user/{user_id_b}")
        assert delete_resp.status_code == 403
        assert delete_resp.json() == {"detail": "Cannot delete another user's account"}

def test_create_account_and_prevent_user_delete(client):
    # register a user and get the assigned user id
    payload = _register_payload()
    reg = client.post("/user", json=payload)
    assert reg.status_code == 200
    user_id = reg.json()["user_id"]

    # create an account for the logged-in user
    acct_resp = client.post("/accounts/create", json={"account_type": "checking"})
    assert acct_resp.status_code == 200
    assert "account_id" in acct_resp.json()

    # attempt to delete the user who now has an active account
    delete_resp = client.delete(f"/user/{user_id}")
    assert delete_resp.status_code == 400
    assert delete_resp.json() == {"detail": "Cannot delete user with open accounts"}


def test_account_creation_requires_auth(client):
    # create a separate TestClient without cookies to simulate unauthenticated request
    #from fastapi.testclient import TestClient

    with TestClient(client.app, base_url="https://testserver") as unauth:
        resp = unauth.post("/accounts/create", json={"account_type": "checking"})
        # should be unauthorized because no cookie is present
        assert resp.status_code == 401
