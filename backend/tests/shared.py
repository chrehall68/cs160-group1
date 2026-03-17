from uuid import uuid4


def make_register_payload(username: str | None = None) -> dict:
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


def register_user(client, username: str | None = None) -> dict:
    payload = make_register_payload(username=username)
    response = client.post("/user", json=payload)
    assert response.status_code == 200
    return payload
