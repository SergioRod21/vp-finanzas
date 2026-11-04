"""Acceso a datos de usuarios: los lee con su colaborador, rol y departamento.

No decide si un usuario puede entrar: eso lo hace services/auth_service.py.
"""

from dataclasses import dataclass

from sqlmodel import Session, col, select

from app.models import Cargo, Colaborador, Departamento, Rol, Usuario


@dataclass(frozen=True)
class UsuarioConDetalle:
    usuario: Usuario
    colaborador: Colaborador
    rol: Rol
    departamento: Departamento


def _consulta_usuario():
    """Usuario con su colaborador, rol y departamento (colaborador → cargo → departamento)."""
    return (
        select(Usuario, Colaborador, Rol, Departamento)
        .join(Colaborador, Usuario.colaborador_id == Colaborador.colaborador_id)
        .join(Rol, Usuario.rol_id == Rol.rol_id)
        .join(Cargo, Colaborador.cargo_id == Cargo.cargo_id)
        .join(Departamento, Cargo.departamento_id == Departamento.departamento_id)
    )


def buscar_por_correo(session: Session, correo: str) -> UsuarioConDetalle | None:
    """Busca por correo exacto, sin filtrar por estado: el servicio decide qué hacer."""
    fila = session.exec(_consulta_usuario().where(Colaborador.correo == correo)).first()
    return UsuarioConDetalle(*fila) if fila else None


def obtener_activo(session: Session, usuario_id: int) -> UsuarioConDetalle | None:
    """El usuario solo si él y su colaborador siguen activos."""
    fila = session.exec(
        _consulta_usuario().where(
            Usuario.usuario_id == usuario_id,
            col(Usuario.activo),
            col(Colaborador.activo),
        )
    ).first()
    return UsuarioConDetalle(*fila) if fila else None
