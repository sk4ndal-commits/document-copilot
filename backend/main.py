import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.postgres import init_db
from api.routes import search, documents, admin

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Knowledge Copilot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router,    prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(admin.router,     prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
