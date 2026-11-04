from fastapi import FastAPI

from app.core.errors import register_exception_handlers
from app.routers import health

app = FastAPI(title="VP Finanzas API")

register_exception_handlers(app)

app.include_router(health.router)
