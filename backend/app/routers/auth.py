from fastapi import APIRouter, HTTPException, Response, status

from app.core.config import SESSION_COOKIE_NAME, settings
from app.core.db import SessionDep
from app.core.security import create_access_token
from app.dependencies import CurrentUser
from app.models import LoginRequest, UsuarioActual
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Atributos de la cookie de sesión (decisión S2). delete_cookie debe usar los
# mismos path y flags para que el navegador la reconozca y la borre.
_COOKIE_ATTRS = {
    "httponly": True,          # JavaScript no puede leerla: protege contra XSS
    "samesite": "strict",      # no viaja en peticiones iniciadas por otros sitios: CSRF
    "secure": settings.cookie_secure,
    "path": "/api",
}


@router.post("/login", response_model=UsuarioActual)
def login(datos: LoginRequest, response: Response, session: SessionDep) -> UsuarioActual:
    usuario = auth_service.autenticar(session, datos.correo, datos.password)
    if usuario is None:
        # Mismo mensaje para cualquier motivo: no revela si el correo existe.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")

    response.set_cookie(
        SESSION_COOKIE_NAME,
        create_access_token(usuario.usuario_id),
        max_age=settings.jwt_expire_minutes * 60,
        **_COOKIE_ATTRS,
    )
    return usuario


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME, **_COOKIE_ATTRS)


@router.get("/me", response_model=UsuarioActual)
def me(usuario: CurrentUser) -> UsuarioActual:
    return usuario
