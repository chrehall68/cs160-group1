import os
from fastapi import Depends
from typing_extensions import Annotated
from sqlalchemy import Engine, create_engine
from sqlmodel import Session
from models import *

# connect to postgres database
engine: Engine | None = None


def get_session():
    assert (
        engine is not None
    ), "Database engine is not initialized. Call create_db_and_tables() first."
    with Session(engine) as conn:
        yield conn


def create_db_and_tables():
    global engine
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_LOCATION = os.getenv("DB_LOCATION")
    DB_NAME = os.getenv("DB_NAME")
    print(
        f"DB_USER: {DB_USER}, DB_PASSWORD: {DB_PASSWORD}, DB_LOCATION: {DB_LOCATION}, DB_NAME: {DB_NAME}"
    )
    SQLALCHEMY_DATABASE_URL = (
        f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_LOCATION}/{DB_NAME}"
    )
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SQLModel.metadata.create_all(engine)


SessionDep = Annotated[Session, Depends(get_session)]
