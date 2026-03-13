# template code from FastAPI documentation
from fastapi import FastAPI
from dependencies.db import create_db_and_tables
from contextlib import asynccontextmanager
from routes.users import router as users_router
from routes import transactions
from scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()

    print("Starting APScheduler...")
    scheduler.start()
    
    yield


app = FastAPI(lifespan=lifespan)

# routers
app.include_router(users_router)

app.include_router(transactions.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}


# for debugging
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
