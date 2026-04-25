import os

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from testcontainers.postgres import PostgresContainer

# set env vars needed by app before importing
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "integration-test-secret-key-integration-test-secret-key",
)
import dependencies.db as db
from app import app as fastapi_app
from tests.shared import ensure_admin_user


@pytest.fixture(scope="session")
def database_url():
    with PostgresContainer(
        "postgres:17-alpine",
        driver="psycopg",
    ) as postgres:
        connection_url = postgres.get_connection_url(driver="psycopg")
        yield connection_url


# wipe the db before and after each test to ensure isolation
@pytest.fixture(scope="function")
def app(database_url):
    engine = db.create_db_and_tables(database_url)
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    ensure_admin_user(engine)

    yield fastapi_app

    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="function")
def client(app):
    # explicitly specify the base url since we need an https url
    # for our tests (our cookies are secure)
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client
