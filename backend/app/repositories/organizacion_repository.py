"""Acceso a datos de la estructura organizacional (Colaboradores, Cargos y funciones).

Único lugar con el SQL de estos módulos. No decide reglas de negocio: el servicio
le indica qué filtros aplicar (departamento, solo activos, cargo). Así el alcance
de la matriz de permisos se sigue aplicando dentro de la consulta.
"""

from dataclasses import dataclass

from sqlmodel import Session, col, select

from app.models import (
    Cargo,
    CargoFuncion,
    Colaborador,
    Departamento,
    Funcion,
    Nivel,
    Pais,
)


@dataclass(frozen=True)
class ColaboradorConDetalle:
    colaborador: Colaborador
    cargo: Cargo
    nivel: Nivel
    departamento: Departamento
    pais: Pais


@dataclass(frozen=True)
class CargoConDetalle:
    cargo: Cargo
    nivel: Nivel
    departamento: Departamento
    funciones: list[str]


# --- Colaboradores ---------------------------------------------------------------------

def _consulta_colaboradores(departamento_id: int | None, solo_activos: bool):
    stmt = (
        select(Colaborador, Cargo, Nivel, Departamento, Pais)
        .join(Cargo, Colaborador.cargo_id == Cargo.cargo_id)
        .join(Nivel, Cargo.nivel_id == Nivel.nivel_id)
        .join(Departamento, Cargo.departamento_id == Departamento.departamento_id)
        .join(Pais, Colaborador.pais_id == Pais.pais_id)
    )
    if departamento_id is not None:
        stmt = stmt.where(Cargo.departamento_id == departamento_id)
    if solo_activos:
        stmt = stmt.where(col(Colaborador.activo))
    return stmt


def listar_colaboradores(
    session: Session, *, departamento_id: int | None, solo_activos: bool
) -> list[ColaboradorConDetalle]:
    """departamento_id=None: todos los departamentos."""
    stmt = _consulta_colaboradores(departamento_id, solo_activos).order_by(
        Colaborador.apellido, Colaborador.nombre
    )
    return [ColaboradorConDetalle(*fila) for fila in session.exec(stmt).all()]


def obtener_colaborador(
    session: Session,
    colaborador_id: int,
    *,
    departamento_id: int | None = None,
    solo_activos: bool = False,
) -> ColaboradorConDetalle | None:
    stmt = _consulta_colaboradores(departamento_id, solo_activos).where(
        Colaborador.colaborador_id == colaborador_id
    )
    fila = session.exec(stmt).first()
    return ColaboradorConDetalle(*fila) if fila else None


# --- Cargos y funciones -----------------------------------------------------------------

def _funciones_por_cargo(session: Session, cargo_ids: list[int]) -> dict[int, list[str]]:
    funciones: dict[int, list[str]] = {cargo_id: [] for cargo_id in cargo_ids}
    if not cargo_ids:
        return funciones
    stmt = (
        select(CargoFuncion.cargo_id, Funcion.descripcion)
        .join(Funcion, CargoFuncion.funcion_id == Funcion.funcion_id)
        .where(col(CargoFuncion.cargo_id).in_(cargo_ids))
        .order_by(Funcion.descripcion)
    )
    for cargo_id, descripcion in session.exec(stmt).all():
        funciones[cargo_id].append(descripcion)
    return funciones


def listar_cargos(
    session: Session, *, departamento_id: int | None, cargo_id: int | None = None
) -> list[CargoConDetalle]:
    """departamento_id=None: todos los departamentos. cargo_id: limita a un único cargo."""
    stmt = (
        select(Cargo, Nivel, Departamento)
        .join(Nivel, Cargo.nivel_id == Nivel.nivel_id)
        .join(Departamento, Cargo.departamento_id == Departamento.departamento_id)
    )
    if departamento_id is not None:
        stmt = stmt.where(Cargo.departamento_id == departamento_id)
    if cargo_id is not None:
        stmt = stmt.where(Cargo.cargo_id == cargo_id)
    filas = session.exec(stmt.order_by(Departamento.nombre, Cargo.titulo)).all()

    funciones = _funciones_por_cargo(session, [cargo.cargo_id for cargo, *_ in filas])
    return [
        CargoConDetalle(cargo, nivel, departamento, funciones[cargo.cargo_id])
        for cargo, nivel, departamento in filas
    ]


def obtener_cargo(
    session: Session, cargo_id: int, *, departamento_id: int | None = None
) -> CargoConDetalle | None:
    cargos = listar_cargos(session, departamento_id=departamento_id, cargo_id=cargo_id)
    return cargos[0] if cargos else None
