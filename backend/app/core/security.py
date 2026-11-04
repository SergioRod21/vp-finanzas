"""Primitivas de seguridad: verificación de contraseñas y tokens de sesión.

Funciones puras, sin dependencias de HTTP ni de la base de datos.
"""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed_password.encode())
    except ValueError:
        # bcrypt rechaza contraseñas de más de 72 bytes o hashes mal formados.
        return False


def create_access_token(usuario_id: int) -> str:
    """Firma un JWT que solo identifica al usuario (decisión S2).

    No incluye el rol ni el departamento: se leen de la base de datos en cada
    petición, para que un cambio de rol o una desactivación se apliquen al instante.
    """
    ahora = datetime.now(UTC)
    payload = {
        "sub": str(usuario_id),
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Devuelve el usuario_id si el token es válido y no expiró; si no, None."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[JWT_ALGORITHM],  # lista explícita: rechaza "none" y otros algoritmos
            options={"require": ["sub", "exp", "iat"]},
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError):
        return None
