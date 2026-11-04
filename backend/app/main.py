from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from app.db import get_session

app = FastAPI(title="VP Finanzas API")


@app.get("/api/health")
def health(session: Session = Depends(get_session)) -> dict[str, str]:
    """Verifica que la API está arriba y que puede consultar la base de datos."""
    try:
        session.exec(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Base de datos no disponible")
    return {"status": "ok"}
