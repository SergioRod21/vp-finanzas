"""Tablas de acceso (db/01-schema.sql)."""

from sqlmodel import Field, SQLModel


class Rol(SQLModel, table=True):
    rol_id: int | None = Field(default=None, primary_key=True)
    nombre: str


class Usuario(SQLModel, table=True):
    usuario_id: int | None = Field(default=None, primary_key=True)
    colaborador_id: int = Field(foreign_key="colaborador.colaborador_id")
    rol_id: int = Field(foreign_key="rol.rol_id")
    hashed_password: str
    activo: bool
