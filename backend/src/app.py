# template code from FastAPI documentation
from fastapi import FastAPI
from dependencies.db import create_db_and_tables
from contextlib import asynccontextmanager
from routes.users import router as users_router
from routes import transactions
from routes.atm import router as atm_router
from scheduler import scheduler
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()

    print("Starting APScheduler...")
    scheduler.start()
    
    yield


app = FastAPI(lifespan=lifespan)


#by pass CORS error, allow requests from localhost:8081
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routers
app.include_router(users_router)

app.include_router(transactions.router)
app.include_router(atm_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}


# for debugging
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
