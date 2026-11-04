from fastapi import APIRouter

from app.core.db import SessionDep
from app.dependencies import CurrentUser
from app.models import CargoFicha
from app.services import organizacion_service

router = APIRouter(prefix="/api/cargos", tags=["cargos"])


@router.get("", response_model=list[CargoFicha])
def listar_cargos(usuario: CurrentUser, session: SessionDep, departamento_id: int | None = None):
    """Administrador: todos (filtro opcional por departamento). Jefe: los de su
    departamento. Colaborador: solo su propio cargo."""
    return organizacion_service.listar_cargos(session, usuario, departamento_id)


@router.get("/{cargo_id}", response_model=CargoFicha)
def obtener_cargo(cargo_id: int, usuario: CurrentUser, session: SessionDep):
    return organizacion_service.obtener_cargo(session, usuario, cargo_id)
