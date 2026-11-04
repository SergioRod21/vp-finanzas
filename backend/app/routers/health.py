from fastapi import APIRouter

from app.core.db import SessionDep, verificar_conexion

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(session: SessionDep) -> dict[str, str]:
    """Verifica que la API está arriba y que puede consultar la base de datos.

    Si PostgreSQL no responde, el manejador global de errores devuelve 503.
    """
    verificar_conexion(session)
    return {"status": "ok"}
