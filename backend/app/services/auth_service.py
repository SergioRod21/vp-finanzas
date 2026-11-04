"""Lógica de autenticación: validar credenciales y cargar al usuario de la sesión."""

from sqlmodel import Session

from app.core.security import hash_password, verify_password
from app.models import UsuarioActual
from app.repositories import usuario_repository as repo
from app.repositories.usuario_repository import UsuarioConDetalle

# Hash de referencia para cuando el correo no existe: verificar contra él tarda lo
# mismo que con un usuario real, así el tiempo de respuesta no revela qué correos existen.
_HASH_DE_REFERENCIA = hash_password("contraseña-de-referencia-para-tiempo-constante")


def _a_usuario_actual(u: UsuarioConDetalle) -> UsuarioActual:
    return UsuarioActual(
        usuario_id=u.usuario.usuario_id,
        colaborador_id=u.colaborador.colaborador_id,
        correo=u.colaborador.correo,
        nombre=u.colaborador.nombre,
        apellido=u.colaborador.apellido,
        rol=u.rol.nombre,
        cargo_id=u.colaborador.cargo_id,
        departamento_id=u.departamento.departamento_id,
        departamento=u.departamento.nombre,
    )


def autenticar(session: Session, correo: str, password: str) -> UsuarioActual | None:
    """Devuelve el usuario si las credenciales son válidas y tiene acceso; si no, None.

    Todos los motivos de rechazo (correo inexistente, contraseña incorrecta, usuario
    o colaborador inactivo) devuelven None, para que la API responda con el mismo
    mensaje y no revele cuál fue el motivo.
    """
    encontrado = repo.buscar_por_correo(session, correo.strip().lower())

    if encontrado is None:
        verify_password(password, _HASH_DE_REFERENCIA)
        return None
    if not verify_password(password, encontrado.usuario.hashed_password):
        return None
    if not (encontrado.usuario.activo and encontrado.colaborador.activo):
        return None
    return _a_usuario_actual(encontrado)


def obtener_usuario_activo(session: Session, usuario_id: int) -> UsuarioActual | None:
    """Carga al usuario de la sesión; None si no existe o ya no tiene acceso.

    Se ejecuta en cada petición autenticada (decisión S2): una desactivación del
    usuario o del colaborador corta el acceso de inmediato.
    """
    encontrado = repo.obtener_activo(session, usuario_id)
    return _a_usuario_actual(encontrado) if encontrado else None
