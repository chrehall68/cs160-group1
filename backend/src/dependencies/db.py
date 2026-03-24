import os
from fastapi import Depends
from typing_extensions import Annotated
from sqlalchemy import Engine, create_engine
from sqlmodel import SQLModel, Session, select
from models import *
from dependencies.auth import hash_password

# connect to postgres database
engine: Engine | None = None


def build_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_location = os.getenv("DB_LOCATION")
    db_name = os.getenv("DB_NAME")
    db_port = os.getenv("DB_PORT")

    missing = [
        env_name
        for env_name, env_value in (
            ("DB_USER", db_user),
            ("DB_PASSWORD", db_password),
            ("DB_LOCATION", db_location),
            ("DB_NAME", db_name),
        )
        if not env_value
    ]
    if missing:
        missing_envs = ", ".join(missing)
        raise RuntimeError(
            f"Database configuration is incomplete. Missing: {missing_envs}"
        )

    location = db_location
    if db_location and db_port and ":" not in db_location:
        location = f"{db_location}:{db_port}"

    return f"postgresql+psycopg://{db_user}:{db_password}@{location}/{db_name}"


def get_session():
    assert (
        engine is not None
    ), "Database engine is not initialized. Call create_db_and_tables() first."
    with Session(engine) as conn:
        yield conn


def create_admin_user():
    # hardcoded admin user
    with Session(engine) as session:
        if session.exec(
            select(User)
            .where(User.username == "admin")
            .where(User.role == UserRole.ADMIN)
        ).first():
            return
        admin_user = User(
            username="admin",
            role=UserRole.ADMIN,
            password_hash=hash_password("password"),
            customer_id=None,
        )
        session.add(admin_user)
        session.commit()


def create_db_and_tables(database_url: str | None = None) -> Engine:
    global engine
    if engine is None or database_url is not None:
        engine = create_engine(database_url or build_database_url())

    SQLModel.metadata.create_all(engine)
    create_admin_user()
    return engine


SessionDep = Annotated[Session, Depends(get_session)]
