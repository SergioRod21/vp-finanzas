"""Reglas de alcance de la matriz de permisos (decisión S3).

Funciones puras: deciden QUÉ puede ver cada usuario, sin consultar la base de datos.
Los servicios las usan para filtrar sus consultas.
"""

from app.core.roles import RolNombre
from app.models import UsuarioActual


def es_administrador(usuario: UsuarioActual) -> bool:
    return usuario.rol == RolNombre.ADMINISTRADOR


def es_colaborador(usuario: UsuarioActual) -> bool:
    return usuario.rol == RolNombre.COLABORADOR


def departamento_en_alcance(usuario: UsuarioActual) -> int | None:
    """Departamento al que se limita el usuario; None si puede ver todos (Administrador)."""
    return None if es_administrador(usuario) else usuario.departamento_id


def resolver_filtro_departamento(
    usuario: UsuarioActual, departamento_solicitado: int | None
) -> tuple[bool, int | None]:
    """Combina el filtro pedido por el cliente con el alcance del usuario.

    Devuelve (permitido, departamento_a_filtrar):
      - Administrador: usa el filtro pedido, o ninguno.
      - Jefe y Colaborador: siempre su departamento. Si piden otro, no está permitido.
    """
    alcance = departamento_en_alcance(usuario)
    if alcance is None:
        return True, departamento_solicitado
    if departamento_solicitado not in (None, alcance):
        return False, None
    return True, alcance
