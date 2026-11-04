from fastapi import APIRouter
from sqlalchemy import text

from app.core.db import SessionDep

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(session: SessionDep) -> dict[str, str]:
    """Verifica que la API está arriba y que puede consultar la base de datos.

    Si PostgreSQL no responde, el manejador global de errores devuelve 503.
    """
    session.exec(text("SELECT 1"))
    return {"status": "ok"}
