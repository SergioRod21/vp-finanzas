"""Tablas de la estructura organizacional (db/01-schema.sql).

Solo mapean las tablas existentes: el schema lo define el SQL, nunca create_all().
"""

from datetime import date

from sqlmodel import Field, SQLModel


class Departamento(SQLModel, table=True):
    departamento_id: int | None = Field(default=None, primary_key=True)
    nombre: str


class Cargo(SQLModel, table=True):
    cargo_id: int | None = Field(default=None, primary_key=True)
    departamento_id: int = Field(foreign_key="departamento.departamento_id")
    nivel_id: int
    titulo: str


class Colaborador(SQLModel, table=True):
    colaborador_id: int | None = Field(default=None, primary_key=True)
    pais_id: int
    cargo_id: int = Field(foreign_key="cargo.cargo_id")
    correo: str
    nombre: str
    apellido: str
    fecha_ingreso: date
    activo: bool
