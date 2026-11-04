"""Roles del portal. Los valores coinciden con rol.nombre en la base de datos (02-seed.sql)."""

from enum import StrEnum


class RolNombre(StrEnum):
    ADMINISTRADOR = "Administrador"
    JEFE_DEPARTAMENTO = "Jefe de Departamento"
    COLABORADOR = "Colaborador"
