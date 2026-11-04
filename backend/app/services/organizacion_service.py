"""Consultas de los módulos Colaboradores, Cargos y funciones, y Mi perfil.

Cada función aplica el alcance de la matriz de permisos (S3) en la propia consulta:
los datos fuera de alcance nunca se leen de la base de datos. Si el recurso no existe
o no está al alcance del usuario, lanza NoEncontrado (404) en ambos casos, para no
revelar que el recurso existe.
"""

from sqlmodel import Session, col, select

from app.domain.errores import NoEncontrado

from app.models import (
    Cargo,
    CargoFicha,
    CargoFuncion,
    Colaborador,
    ColaboradorFicha,
    ColaboradorResumen,
    Departamento,
    Funcion,
    Nivel,
    Pais,
    Perfil,
    UsuarioActual,
)
from app.services.acceso import (
    departamento_en_alcance,
    es_colaborador,
    resolver_filtro_departamento,
)

# --- Colaboradores ---------------------------------------------------------------


def _consulta_colaboradores():
    return (
        select(Colaborador, Cargo, Nivel, Departamento, Pais)
        .join(Cargo, Colaborador.cargo_id == Cargo.cargo_id)
        .join(Nivel, Cargo.nivel_id == Nivel.nivel_id)
        .join(Departamento, Cargo.departamento_id == Departamento.departamento_id)
        .join(Pais, Colaborador.pais_id == Pais.pais_id)
    )


def _a_ficha(colaborador, cargo, nivel, departamento, pais) -> ColaboradorFicha:
    return ColaboradorFicha(
        colaborador_id=colaborador.colaborador_id,
        nombre=colaborador.nombre,
        apellido=colaborador.apellido,
        correo=colaborador.correo,
        cargo=cargo.titulo,
        pais=pais.nombre,
        fecha_ingreso=colaborador.fecha_ingreso,
        activo=colaborador.activo,
        nivel=nivel.nombre,
        departamento_id=departamento.departamento_id,
        departamento=departamento.nombre,
    )


def _a_resumen(colaborador, cargo, *_) -> ColaboradorResumen:
    return ColaboradorResumen(
        colaborador_id=colaborador.colaborador_id,
        nombre=colaborador.nombre,
        apellido=colaborador.apellido,
        correo=colaborador.correo,
        cargo=cargo.titulo,
    )


def _aplicar_alcance_colaboradores(stmt, usuario: UsuarioActual):
    alcance = departamento_en_alcance(usuario)
    if alcance is not None:
        stmt = stmt.where(Cargo.departamento_id == alcance)
    if es_colaborador(usuario):
        # El Colaborador solo ve a sus compañeros activos.
        stmt = stmt.where(col(Colaborador.activo))
    return stmt


def listar_colaboradores(
    session: Session, usuario: UsuarioActual, departamento_id: int | None = None
) -> list[ColaboradorFicha] | list[ColaboradorResumen]:
    permitido, filtro = resolver_filtro_departamento(usuario, departamento_id)
    if not permitido:
        raise NoEncontrado("Departamento no encontrado")

    stmt = _aplicar_alcance_colaboradores(_consulta_colaboradores(), usuario)
    if filtro is not None:
        stmt = stmt.where(Cargo.departamento_id == filtro)
    stmt = stmt.order_by(Colaborador.apellido, Colaborador.nombre)

    convertir = _a_resumen if es_colaborador(usuario) else _a_ficha
    return [convertir(*fila) for fila in session.exec(stmt).all()]


def obtener_colaborador(
    session: Session, usuario: UsuarioActual, colaborador_id: int
) -> ColaboradorFicha | ColaboradorResumen:
    stmt = _aplicar_alcance_colaboradores(
        _consulta_colaboradores().where(Colaborador.colaborador_id == colaborador_id), usuario
    )
    fila = session.exec(stmt).first()
    if fila is None:
        raise NoEncontrado("Colaborador no encontrado")
    return _a_resumen(*fila) if es_colaborador(usuario) else _a_ficha(*fila)


# --- Cargos y funciones ------------------------------------------------------------


def _consulta_cargos():
    return (
        select(Cargo, Nivel, Departamento)
        .join(Nivel, Cargo.nivel_id == Nivel.nivel_id)
        .join(Departamento, Cargo.departamento_id == Departamento.departamento_id)
    )


def _aplicar_alcance_cargos(stmt, usuario: UsuarioActual):
    if es_colaborador(usuario):
        # El Colaborador solo ve su propio cargo.
        return stmt.where(Cargo.cargo_id == usuario.cargo_id)
    alcance = departamento_en_alcance(usuario)
    if alcance is not None:
        stmt = stmt.where(Cargo.departamento_id == alcance)
    return stmt


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


def _a_cargo_ficha(cargo, nivel, departamento, funciones: list[str]) -> CargoFicha:
    return CargoFicha(
        cargo_id=cargo.cargo_id,
        titulo=cargo.titulo,
        nivel=nivel.nombre,
        departamento_id=departamento.departamento_id,
        departamento=departamento.nombre,
        funciones=funciones,
    )


def listar_cargos(
    session: Session, usuario: UsuarioActual, departamento_id: int | None = None
) -> list[CargoFicha]:
    permitido, filtro = resolver_filtro_departamento(usuario, departamento_id)
    if not permitido:
        raise NoEncontrado("Departamento no encontrado")

    stmt = _aplicar_alcance_cargos(_consulta_cargos(), usuario)
    if filtro is not None:
        stmt = stmt.where(Cargo.departamento_id == filtro)
    filas = session.exec(stmt.order_by(Departamento.nombre, Cargo.titulo)).all()

    funciones = _funciones_por_cargo(session, [cargo.cargo_id for cargo, *_ in filas])
    return [
        _a_cargo_ficha(cargo, nivel, depto, funciones[cargo.cargo_id])
        for cargo, nivel, depto in filas
    ]


def obtener_cargo(session: Session, usuario: UsuarioActual, cargo_id: int) -> CargoFicha:
    stmt = _aplicar_alcance_cargos(_consulta_cargos().where(Cargo.cargo_id == cargo_id), usuario)
    fila = session.exec(stmt).first()
    if fila is None:
        raise NoEncontrado("Cargo no encontrado")
    cargo, nivel, departamento = fila
    funciones = _funciones_por_cargo(session, [cargo.cargo_id])
    return _a_cargo_ficha(cargo, nivel, departamento, funciones[cargo.cargo_id])


# --- Mi perfil ---------------------------------------------------------------------


def obtener_perfil(session: Session, usuario: UsuarioActual) -> Perfil:
    fila = session.exec(
        _consulta_colaboradores().where(Colaborador.colaborador_id == usuario.colaborador_id)
    ).first()
    if fila is None:
        raise NoEncontrado("Perfil no encontrado")
    return Perfil(**_a_ficha(*fila).model_dump(), rol=usuario.rol)
