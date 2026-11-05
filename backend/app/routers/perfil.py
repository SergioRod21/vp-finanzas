from fastapi import APIRouter

from app.core.db import SessionDep
from app.dependencies import CurrentUser
from app.models import Perfil
from app.services import organizacion_service

router = APIRouter(prefix="/api/perfil", tags=["perfil"])


@router.get("", response_model=Perfil)
def obtener_perfil(usuario: CurrentUser, session: SessionDep):
    """Ficha propia del usuario autenticado. Disponible para todos los roles."""
    return organizacion_service.obtener_perfil(session, usuario)
