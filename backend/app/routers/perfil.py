from fastapi import APIRouter, HTTPException, status

from app.core.db import SessionDep
from app.dependencies import CurrentUser
from app.models import Perfil
from app.services import organizacion_service

router = APIRouter(prefix="/api/perfil", tags=["perfil"])


@router.get("", response_model=Perfil)
def obtener_perfil(usuario: CurrentUser, session: SessionDep):
    """Ficha propia del usuario autenticado. Disponible para todos los roles."""
    perfil = organizacion_service.obtener_perfil(session, usuario)
    if perfil is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Perfil no encontrado")
    return perfil
