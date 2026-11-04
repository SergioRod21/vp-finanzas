"""Lógica de autenticación: validar credenciales y cargar al usuario de la sesión."""

from sqlmodel import Session, select

from app.core.security import hash_password, verify_password
from app.models import Cargo, Colaborador, Departamento, Rol, Usuario, UsuarioActual

# Hash de referencia para cuando el correo no existe: verificar contra él tarda lo
# mismo que con un usuario real, así el tiempo de respuesta no revela qué correos existen.
_HASH_DE_REFERENCIA = hash_password("contraseña-de-referencia-para-tiempo-constante")


def _consulta_usuario():
    """Usuario con su colaborador, rol y departamento (colaborador → cargo → departamento)."""
    return (
        select(Usuario, Colaborador, Rol, Departamento)
        .join(Colaborador, Usuario.colaborador_id == Colaborador.colaborador_id)
        .join(Rol, Usuario.rol_id == Rol.rol_id)
        .join(Cargo, Colaborador.cargo_id == Cargo.cargo_id)
        .join(Departamento, Cargo.departamento_id == Departamento.departamento_id)
    )


def _a_usuario_actual(
    usuario: Usuario, colaborador: Colaborador, rol: Rol, departamento: Departamento
) -> UsuarioActual:
    return UsuarioActual(
        usuario_id=usuario.usuario_id,
        correo=colaborador.correo,
        nombre=colaborador.nombre,
        apellido=colaborador.apellido,
        rol=rol.nombre,
        departamento_id=departamento.departamento_id,
        departamento=departamento.nombre,
    )


def autenticar(session: Session, correo: str, password: str) -> UsuarioActual | None:
    """Devuelve el usuario si las credenciales son válidas y tiene acceso; si no, None.

    Todos los motivos de rechazo (correo inexistente, contraseña incorrecta, usuario
    o colaborador inactivo) devuelven None, para que la API responda con el mismo
    mensaje y no revele cuál fue el motivo.
    """
    fila = session.exec(
        _consulta_usuario().where(Colaborador.correo == correo.strip().lower())
    ).first()

    if fila is None:
        verify_password(password, _HASH_DE_REFERENCIA)
        return None

    usuario, colaborador, rol, departamento = fila
    if not verify_password(password, usuario.hashed_password):
        return None
    if not (usuario.activo and colaborador.activo):
        return None
    return _a_usuario_actual(usuario, colaborador, rol, departamento)


def obtener_usuario_activo(session: Session, usuario_id: int) -> UsuarioActual | None:
    """Carga al usuario de la sesión; None si no existe o ya no tiene acceso.

    Se ejecuta en cada petición autenticada (decisión S2): una desactivación del
    usuario o del colaborador corta el acceso de inmediato.
    """
    fila = session.exec(
        _consulta_usuario().where(
            Usuario.usuario_id == usuario_id,
            Usuario.activo,
            Colaborador.activo,
        )
    ).first()
    return _a_usuario_actual(*fila) if fila else None
