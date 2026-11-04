"""Dependencias compartidas por los routers."""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from app.core.config import SESSION_COOKIE_NAME
from app.core.db import SessionDep
from app.core.security import decode_access_token
from app.models import UsuarioActual
from app.services import auth_service


def get_current_user(
    session: SessionDep,
    token: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> UsuarioActual:
    """Resuelve el usuario autenticado a partir de la cookie de sesión.

    Responde 401 si no hay cookie, si el token es inválido o expiró, o si el
    usuario ya no tiene acceso.
    """
    no_autenticado = HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    if not token:
        raise no_autenticado
    usuario_id = decode_access_token(token)
    if usuario_id is None:
        raise no_autenticado
    usuario = auth_service.obtener_usuario_activo(session, usuario_id)
    if usuario is None:
        raise no_autenticado
    return usuario


# Uso en los endpoints protegidos:  def endpoint(usuario: CurrentUser): ...
CurrentUser = Annotated[UsuarioActual, Depends(get_current_user)]
