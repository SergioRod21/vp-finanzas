from fastapi import FastAPI

from app.core.errors import register_exception_handlers
from app.routers import auth, cargos, colaboradores, health, perfil

app = FastAPI(title="VP Finanzas API")

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(perfil.router)
app.include_router(colaboradores.router)
app.include_router(cargos.router)
