"""Usuarios de ejemplo para los tests unitarios, uno por rol."""

from app.core.roles import RolNombre
from app.models import UsuarioActual


def usuario(rol: RolNombre, departamento_id: int = 2, cargo_id: int = 5) -> UsuarioActual:
    return UsuarioActual(
        usuario_id=1, colaborador_id=1, correo="x@vpfinanzas.example", nombre="N", apellido="A",
        rol=rol, cargo_id=cargo_id, departamento_id=departamento_id, departamento="Tesorería",
    )


ADMIN = usuario(RolNombre.ADMINISTRADOR, departamento_id=1)
JEFE = usuario(RolNombre.JEFE_DEPARTAMENTO)
COLABORADOR = usuario(RolNombre.COLABORADOR)
