"""Tablas del módulo de notas de crédito (db/03-notas-credito.sql).

Solo mapean las tablas para leerlas. Las inserciones y actualizaciones se hacen
con sentencias explícitas en el repositorio, para que la base de datos asigne sus
valores por defecto (numero, fechas) y aplique todos sus CHECK.
"""

from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class MotivoNotaCredito(SQLModel, table=True):
    __tablename__ = "motivo_nota_credito"

    motivo_nota_credito_id: int | None = Field(default=None, primary_key=True)
    descripcion: str


class NotaCredito(SQLModel, table=True):
    __tablename__ = "nota_credito"

    nota_credito_id: int | None = Field(default=None, primary_key=True)
    solicitante_id: int = Field(foreign_key="usuario.usuario_id")
    resolutor_id: int | None = Field(default=None, foreign_key="usuario.usuario_id")
    departamento_id: int = Field(foreign_key="departamento.departamento_id")
    motivo_nota_credito_id: int = Field(foreign_key="motivo_nota_credito.motivo_nota_credito_id")
    numero: str
    monto: Decimal
    detalle: str
    estado_actual: str
    nivel_aprobacion: str
    creada_en: datetime
    actualizada_en: datetime


class NotaCreditoHistorico(SQLModel, table=True):
    __tablename__ = "nota_credito_historico"

    nota_credito_historico_id: int | None = Field(default=None, primary_key=True)
    nota_credito_id: int = Field(foreign_key="nota_credito.nota_credito_id")
    usuario_id: int = Field(foreign_key="usuario.usuario_id")
    accion: str
    estado_anterior: str | None = None
    estado_nuevo: str
    comentario: str | None = None
    ocurrido_en: datetime
