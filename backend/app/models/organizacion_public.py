"""Modelos de respuesta de los módulos de consulta (no son tablas).

Cada modelo declara exactamente qué campos expone la API para cada caso de la
matriz de permisos (decisión S3).
"""

from datetime import date

from sqlmodel import SQLModel


class ColaboradorResumen(SQLModel):
    """Lo que ve un Colaborador de sus compañeros: datos de contacto y cargo."""

    colaborador_id: int
    nombre: str
    apellido: str
    correo: str
    cargo_id: int
    cargo: str


class ColaboradorFicha(ColaboradorResumen):
    """Ficha completa: la ven el Administrador y el Jefe de Departamento."""

    pais: str
    fecha_ingreso: date
    activo: bool
    nivel: str
    departamento_id: int
    departamento: str


class Perfil(ColaboradorFicha):
    """Perfil propio del usuario autenticado."""

    rol: str


class CargoFicha(SQLModel):
    cargo_id: int
    titulo: str
    nivel: str
    departamento_id: int
    departamento: str
    funciones: list[str]
