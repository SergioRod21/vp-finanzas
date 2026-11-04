"""Modelos de entrada y salida de la API de notas de crédito (no son tablas)."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from app.domain.nota_credito import AccionNota, EstadoNota

TextoObligatorio = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
TextoOpcional = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


# --- Entrada -----------------------------------------------------------------------

class NotaCreditoCrear(SQLModel):
    """Datos para solicitar una nota. El departamento NO se recibe: sale del solicitante."""

    motivo_nota_credito_id: int
    monto: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    detalle: TextoObligatorio


class AccionConComentario(SQLModel):
    """Aprobar o anular: el comentario es opcional."""

    comentario: TextoOpcional | None = None


class RechazoNota(SQLModel):
    """Rechazar: el motivo del rechazo es obligatorio, para que quede en la auditoría."""

    comentario: TextoObligatorio


# --- Salida ------------------------------------------------------------------------

class MotivoPublic(SQLModel):
    motivo_nota_credito_id: int
    descripcion: str


class NotaCreditoPublic(SQLModel):
    nota_credito_id: int
    numero: str
    monto: Decimal
    detalle: str
    estado: EstadoNota
    motivo_nota_credito_id: int
    motivo: str
    departamento_id: int
    departamento: str
    solicitante_id: int
    solicitante: str
    resolutor_id: int | None
    resolutor: str | None
    creada_en: datetime
    actualizada_en: datetime


class EventoHistorialPublic(SQLModel):
    accion: AccionNota
    estado_anterior: EstadoNota | None
    estado_nuevo: EstadoNota
    usuario_id: int
    usuario: str
    comentario: str | None
    ocurrido_en: datetime
