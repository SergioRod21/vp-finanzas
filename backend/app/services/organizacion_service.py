"""Reglas de los módulos Colaboradores, Cargos y funciones, y Mi perfil.

Aplica la matriz de permisos (S3): decide qué filtros corresponden a cada usuario
y se los pasa al repositorio, que los aplica dentro de la consulta. Así, los datos
fuera de alcance nunca se leen de la base de datos.

Si el recurso no existe o no está al alcance del usuario, lanza NoEncontrado (404)
en ambos casos, para no revelar que el recurso existe.
"""

from sqlmodel import Session

from app.domain.errores import NoEncontrado
from app.models import (
    CargoFicha,
    ColaboradorFicha,
    ColaboradorResumen,
    Perfil,
    UsuarioActual,
)
from app.repositories import organizacion_repository as repo
from app.repositories.organizacion_repository import CargoConDetalle, ColaboradorConDetalle
from app.services.acceso import (
    departamento_en_alcance,
    es_colaborador,
    resolver_filtro_departamento,
)

# --- Conversión a modelos de respuesta ------------------------------------------------


def _a_ficha(c: ColaboradorConDetalle) -> ColaboradorFicha:
    return ColaboradorFicha(
        colaborador_id=c.colaborador.colaborador_id,
        nombre=c.colaborador.nombre,
        apellido=c.colaborador.apellido,
        correo=c.colaborador.correo,
        cargo=c.cargo.titulo,
        pais=c.pais.nombre,
        fecha_ingreso=c.colaborador.fecha_ingreso,
        activo=c.colaborador.activo,
        nivel=c.nivel.nombre,
        departamento_id=c.departamento.departamento_id,
        departamento=c.departamento.nombre,
    )


def _a_resumen(c: ColaboradorConDetalle) -> ColaboradorResumen:
    return ColaboradorResumen(
        colaborador_id=c.colaborador.colaborador_id,
        nombre=c.colaborador.nombre,
        apellido=c.colaborador.apellido,
        correo=c.colaborador.correo,
        cargo=c.cargo.titulo,
    )


def _a_cargo_ficha(c: CargoConDetalle) -> CargoFicha:
    return CargoFicha(
        cargo_id=c.cargo.cargo_id,
        titulo=c.cargo.titulo,
        nivel=c.nivel.nombre,
        departamento_id=c.departamento.departamento_id,
        departamento=c.departamento.nombre,
        funciones=c.funciones,
    )


def _convertir_colaborador(usuario: UsuarioActual):
    # El Colaborador recibe solo datos de contacto; el resto, la ficha completa.
    return _a_resumen if es_colaborador(usuario) else _a_ficha


# --- Colaboradores ---------------------------------------------------------------------


def listar_colaboradores(
    session: Session, usuario: UsuarioActual, departamento_id: int | None = None
) -> list[ColaboradorFicha] | list[ColaboradorResumen]:
    permitido, filtro = resolver_filtro_departamento(usuario, departamento_id)
    if not permitido:
        raise NoEncontrado("Departamento no encontrado")

    colaboradores = repo.listar_colaboradores(
        session,
        departamento_id=filtro,
        solo_activos=es_colaborador(usuario),  # el Colaborador solo ve compañeros activos
    )
    convertir = _convertir_colaborador(usuario)
    return [convertir(c) for c in colaboradores]


def obtener_colaborador(
    session: Session, usuario: UsuarioActual, colaborador_id: int
) -> ColaboradorFicha | ColaboradorResumen:
    colaborador = repo.obtener_colaborador(
        session,
        colaborador_id,
        departamento_id=departamento_en_alcance(usuario),
        solo_activos=es_colaborador(usuario),
    )
    if colaborador is None:
        raise NoEncontrado("Colaborador no encontrado")
    return _convertir_colaborador(usuario)(colaborador)


# --- Cargos y funciones ------------------------------------------------------------------


def listar_cargos(
    session: Session, usuario: UsuarioActual, departamento_id: int | None = None
) -> list[CargoFicha]:
    permitido, filtro = resolver_filtro_departamento(usuario, departamento_id)
    if not permitido:
        raise NoEncontrado("Departamento no encontrado")

    cargos = repo.listar_cargos(
        session,
        departamento_id=filtro,
        # El Colaborador solo ve su propio cargo.
        cargo_id=usuario.cargo_id if es_colaborador(usuario) else None,
    )
    return [_a_cargo_ficha(c) for c in cargos]


def obtener_cargo(session: Session, usuario: UsuarioActual, cargo_id: int) -> CargoFicha:
    if es_colaborador(usuario) and cargo_id != usuario.cargo_id:
        raise NoEncontrado("Cargo no encontrado")

    cargo = repo.obtener_cargo(session, cargo_id, departamento_id=departamento_en_alcance(usuario))
    if cargo is None:
        raise NoEncontrado("Cargo no encontrado")
    return _a_cargo_ficha(cargo)


# --- Mi perfil ---------------------------------------------------------------------------


def obtener_perfil(session: Session, usuario: UsuarioActual) -> Perfil:
    colaborador = repo.obtener_colaborador(session, usuario.colaborador_id)
    if colaborador is None:
        raise NoEncontrado("Perfil no encontrado")
    return Perfil(**_a_ficha(colaborador).model_dump(), rol=usuario.rol)
