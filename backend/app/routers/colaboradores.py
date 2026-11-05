from fastapi import APIRouter

from app.core.db import SessionDep
from app.dependencies import CurrentUser
from app.models import ColaboradorFicha, ColaboradorResumen
from app.services import organizacion_service

router = APIRouter(prefix="/api/colaboradores", tags=["colaboradores"])

# Según el rol, la respuesta es la ficha completa o el resumen (matriz S3).
RespuestaLista = list[ColaboradorFicha] | list[ColaboradorResumen]


@router.get("", response_model=RespuestaLista)
def listar_colaboradores(
    usuario: CurrentUser, session: SessionDep, departamento_id: int | None = None
):
    """Administrador: todos (filtro opcional por departamento). Jefe: su departamento.
    Colaborador: compañeros activos de su departamento, solo datos de contacto."""
    return organizacion_service.listar_colaboradores(session, usuario, departamento_id)


@router.get("/{colaborador_id}", response_model=ColaboradorFicha | ColaboradorResumen)
def obtener_colaborador(colaborador_id: int, usuario: CurrentUser, session: SessionDep):
    return organizacion_service.obtener_colaborador(session, usuario, colaborador_id)
