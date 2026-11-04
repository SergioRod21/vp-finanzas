"""Configuración de la aplicación, leída solo de variables de entorno.

La configuración se valida al arrancar: si falta una variable o un valor es
inseguro, la aplicación no inicia (mejor fallar al desplegar que en producción).
"""

import os
from collections.abc import Mapping
from dataclasses import dataclass

ENTORNOS_VALIDOS = {"development", "production"}

# Los valores de ejemplo de .env.example contienen esta marca (decisión S4).
MARCA_VALOR_DE_EJEMPLO = "local_only"

JWT_SECRET_LONGITUD_MINIMA = 32

# Nombre de la cookie de sesión (decisión S2).
SESSION_COOKIE_NAME = "vpf_session"


@dataclass(frozen=True)
class Settings:
    app_env: str
    # Ejemplo: postgresql+psycopg://vp_app:<password>@db:5432/vp_finanzas
    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cookie_secure(self) -> bool:
        # En producción la cookie solo viaja por HTTPS. En desarrollo local se usa HTTP.
        return self.is_production


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno {name}")
    return value


def load_settings(env: Mapping[str, str]) -> Settings:
    app_env = env.get("APP_ENV", "development")
    if app_env not in ENTORNOS_VALIDOS:
        raise RuntimeError(f"APP_ENV debe ser uno de {sorted(ENTORNOS_VALIDOS)}")

    jwt_secret = _required(env, "JWT_SECRET")
    if len(jwt_secret) < JWT_SECRET_LONGITUD_MINIMA:
        raise RuntimeError(
            f"JWT_SECRET debe tener al menos {JWT_SECRET_LONGITUD_MINIMA} caracteres"
        )
    # Salvaguarda de la decisión S4: el secreto de ejemplo es público.
    if app_env == "production" and MARCA_VALOR_DE_EJEMPLO in jwt_secret:
        raise RuntimeError(
            "JWT_SECRET usa el valor de ejemplo de .env.example: no se permite en producción"
        )

    try:
        jwt_expire_minutes = int(env.get("JWT_EXPIRE_MINUTES", "60"))
    except ValueError:
        raise RuntimeError("JWT_EXPIRE_MINUTES debe ser un número entero de minutos") from None
    if not 5 <= jwt_expire_minutes <= 1440:
        raise RuntimeError("JWT_EXPIRE_MINUTES debe estar entre 5 y 1440")

    return Settings(
        app_env=app_env,
        database_url=_required(env, "DATABASE_URL"),
        jwt_secret=jwt_secret,
        jwt_expire_minutes=jwt_expire_minutes,
    )


settings = load_settings(os.environ)
