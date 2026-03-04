# template code from FastAPI documentation
from fastapi import FastAPI
from sqlalchemy import create_engine, text
import os

app = FastAPI()

# connect to postgres database
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_LOCATION = os.getenv("DB_LOCATION")
DB_NAME = os.getenv("DB_NAME")
print(f"DB_USER: {DB_USER}, DB_PASSWORD: {DB_PASSWORD}, DB_LOCATION: {DB_LOCATION}, DB_NAME: {DB_NAME}")
SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_LOCATION}/{DB_NAME}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/examples/{item_id}")
def read_item(item_id: int):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM example_table WHERE id = :item_id"), {"item_id": item_id}).fetchall()
        if not result:
            return {"error": "Item not found"}
        return {"id": result[0].id, "name": result[0].name, "value": result[0].value}
