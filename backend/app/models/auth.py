"""Modelos de la API de autenticación (no son tablas)."""

from sqlmodel import Field, SQLModel


class LoginRequest(SQLModel):
    correo: str = Field(min_length=3, max_length=254)
    # bcrypt solo considera 72 bytes; el límite evita entradas desmesuradas.
    password: str = Field(min_length=1, max_length=128)


class UsuarioActual(SQLModel):
    """Usuario autenticado: lo que la API expone y lo que usa el control de acceso.

    Nunca incluye hashed_password.
    """

    usuario_id: int
    colaborador_id: int
    correo: str
    nombre: str
    apellido: str
    rol: str
    cargo_id: int
    departamento_id: int
    departamento: str
