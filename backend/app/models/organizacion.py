"""Tablas de la estructura organizacional (db/01-schema.sql).

Solo mapean las tablas existentes: el schema lo define el SQL, nunca create_all().
"""

from datetime import date

from sqlmodel import Field, SQLModel


class Pais(SQLModel, table=True):
    pais_id: int | None = Field(default=None, primary_key=True)
    codigo_iso: str
    nombre: str


class Departamento(SQLModel, table=True):
    departamento_id: int | None = Field(default=None, primary_key=True)
    nombre: str


class Nivel(SQLModel, table=True):
    nivel_id: int | None = Field(default=None, primary_key=True)
    nombre: str


class Cargo(SQLModel, table=True):
    cargo_id: int | None = Field(default=None, primary_key=True)
    departamento_id: int = Field(foreign_key="departamento.departamento_id")
    nivel_id: int = Field(foreign_key="nivel.nivel_id")
    titulo: str


class Funcion(SQLModel, table=True):
    funcion_id: int | None = Field(default=None, primary_key=True)
    descripcion: str


class CargoFuncion(SQLModel, table=True):
    __tablename__ = "cargo_funcion"

    cargo_id: int = Field(foreign_key="cargo.cargo_id", primary_key=True)
    funcion_id: int = Field(foreign_key="funcion.funcion_id", primary_key=True)


class Colaborador(SQLModel, table=True):
    colaborador_id: int | None = Field(default=None, primary_key=True)
    pais_id: int = Field(foreign_key="pais.pais_id")
    cargo_id: int = Field(foreign_key="cargo.cargo_id")
    correo: str
    nombre: str
    apellido: str
    fecha_ingreso: date
    activo: bool
