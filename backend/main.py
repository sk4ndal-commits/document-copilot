import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.postgres import init_db
from api.routes import search, documents, admin, history, ai
from api.routes import connectors as connectors_router
from middleware.tenant import TenantMiddleware
from connectors.sync_scheduler import start_scheduler, stop_scheduler, register_tenant

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# In single-tenant / dev mode a DEFAULT_TENANT_ID env var is enough.
# In multi-tenant production, tenants are provisioned via the admin API and
# registered here at startup by reading the tenants table.
_DEFAULT_TENANT = os.getenv("DEFAULT_TENANT_ID")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Register default tenant for the scheduler (dev / single-tenant)
    if _DEFAULT_TENANT:
        register_tenant(_DEFAULT_TENANT)

    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Knowledge Copilot API", lifespan=lifespan)

# CORS must be added before TenantMiddleware so preflight OPTIONS requests
# are handled without requiring a tenant context.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TenantMiddleware)

app.include_router(search.router,              prefix="/api")
app.include_router(documents.router,           prefix="/api")
app.include_router(admin.router,               prefix="/api")
app.include_router(connectors_router.router,   prefix="/api")
app.include_router(history.router,             prefix="/api/history", tags=["history"])
app.include_router(ai.router,                  prefix="/api", tags=["ai"])


@app.get("/health")
async def health():
    return {"status": "ok"}
