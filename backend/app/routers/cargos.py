from fastapi import APIRouter, HTTPException, status

from app.core.db import SessionDep
from app.dependencies import CurrentUser
from app.models import CargoFicha
from app.services import organizacion_service

router = APIRouter(prefix="/api/cargos", tags=["cargos"])


@router.get("", response_model=list[CargoFicha])
def listar_cargos(usuario: CurrentUser, session: SessionDep, departamento_id: int | None = None):
    """Administrador: todos (filtro opcional por departamento). Jefe: los de su
    departamento. Colaborador: solo su propio cargo."""
    cargos = organizacion_service.listar_cargos(session, usuario, departamento_id)
    if cargos is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Departamento no encontrado")
    return cargos


@router.get("/{cargo_id}", response_model=CargoFicha)
def obtener_cargo(cargo_id: int, usuario: CurrentUser, session: SessionDep):
    cargo = organizacion_service.obtener_cargo(session, usuario, cargo_id)
    if cargo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cargo no encontrado")
    return cargo
