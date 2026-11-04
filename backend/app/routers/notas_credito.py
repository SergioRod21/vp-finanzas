"""Endpoints del módulo de notas de crédito.

Responsabilidad del router: verificar el ROL con require_roles (403) y delegar.
Las reglas que dependen de la nota (alcance, autoría, estado) están en el servicio,
y sus errores se traducen a HTTP en core/errors.py.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.db import SessionDep
from app.core.roles import RolNombre
from app.dependencies import require_roles
from app.domain.nota_credito import EstadoNota
from app.models import UsuarioActual
from app.models.nota_credito_public import (
    AccionConComentario,
    EventoHistorialPublic,
    MotivoPublic,
    NotaCreditoCrear,
    NotaCreditoPublic,
    RechazoNota,
)
from app.services import nota_credito_service

# Roles con acceso al módulo (matriz S3): el Colaborador no lo ve.
UsuarioDelModulo = Annotated[
    UsuarioActual,
    Depends(require_roles(RolNombre.ADMINISTRADOR, RolNombre.JEFE_DEPARTAMENTO)),
]
Jefe = Annotated[UsuarioActual, Depends(require_roles(RolNombre.JEFE_DEPARTAMENTO))]
Administrador = Annotated[UsuarioActual, Depends(require_roles(RolNombre.ADMINISTRADOR))]

router = APIRouter(prefix="/api/notas-credito", tags=["notas de crédito"])
router_motivos = APIRouter(prefix="/api/motivos-nota-credito", tags=["notas de crédito"])


@router_motivos.get("", response_model=list[MotivoPublic])
def listar_motivos(usuario: UsuarioDelModulo, session: SessionDep):
    return nota_credito_service.listar_motivos(session)


@router.get("", response_model=list[NotaCreditoPublic])
def listar_notas(usuario: UsuarioDelModulo, session: SessionDep, estado: EstadoNota | None = None):
    """Administrador: todas. Jefe: las de su departamento. Filtro opcional por estado."""
    return nota_credito_service.listar(session, usuario, estado)


@router.post("", response_model=NotaCreditoPublic, status_code=status.HTTP_201_CREATED)
def crear_nota(datos: NotaCreditoCrear, usuario: Jefe, session: SessionDep):
    """Solicita una nota para el departamento del Jefe."""
    return nota_credito_service.crear(session, usuario, datos)


@router.get("/{nota_id}", response_model=NotaCreditoPublic)
def obtener_nota(nota_id: int, usuario: UsuarioDelModulo, session: SessionDep):
    return nota_credito_service.obtener(session, usuario, nota_id)


@router.get("/{nota_id}/historial", response_model=list[EventoHistorialPublic])
def historial_nota(nota_id: int, usuario: UsuarioDelModulo, session: SessionDep):
    return nota_credito_service.historial(session, usuario, nota_id)


@router.post("/{nota_id}/aprobar", response_model=NotaCreditoPublic)
def aprobar_nota(
    nota_id: int, usuario: Administrador, session: SessionDep,
    datos: AccionConComentario | None = None,
):
    comentario = datos.comentario if datos else None
    return nota_credito_service.aprobar(session, usuario, nota_id, comentario)


@router.post("/{nota_id}/rechazar", response_model=NotaCreditoPublic)
def rechazar_nota(nota_id: int, datos: RechazoNota, usuario: Administrador, session: SessionDep):
    return nota_credito_service.rechazar(session, usuario, nota_id, datos.comentario)


@router.post("/{nota_id}/anular", response_model=NotaCreditoPublic)
def anular_nota(
    nota_id: int, usuario: Jefe, session: SessionDep,
    datos: AccionConComentario | None = None,
):
    """Solo el solicitante, mientras la nota está pendiente."""
    comentario = datos.comentario if datos else None
    return nota_credito_service.anular(session, usuario, nota_id, comentario)
