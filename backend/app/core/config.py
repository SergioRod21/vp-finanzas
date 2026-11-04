"""Configuración de la aplicación, leída solo de variables de entorno."""

import os
from dataclasses import dataclass


def _required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        # Falla al arrancar, con un mensaje claro, en lugar de fallar en la primera petición.
        raise RuntimeError(f"Falta la variable de entorno {name}")
    return value


@dataclass(frozen=True)
class Settings:
    # Ejemplo: postgresql+psycopg://vp_app:<password>@db:5432/vp_finanzas
    database_url: str


settings = Settings(database_url=_required("DATABASE_URL"))
