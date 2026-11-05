"""Máquina de estados de las notas de crédito (reglas puras, sin base de datos)."""

import pytest

from app.core.roles import RolNombre
from app.domain.errores import AccesoDenegado, TransicionInvalida
from app.domain.nota_credito import (
    AccionNota,
    EstadoNota,
    NivelAprobacion,
    nivel_aprobacion_para,
    puede_resolver,
    siguiente_estado,
)


@pytest.mark.parametrize(
    "accion, esperado",
    [
        (AccionNota.APROBAR, EstadoNota.APROBADA),
        (AccionNota.RECHAZAR, EstadoNota.RECHAZADA),
        (AccionNota.ANULAR, EstadoNota.ANULADA),
    ],
)
def test_desde_pendiente_se_permiten_las_tres_acciones(accion, esperado):
    assert siguiente_estado(EstadoNota.PENDIENTE, accion) == esperado


@pytest.mark.parametrize("estado_final", [EstadoNota.APROBADA, EstadoNota.RECHAZADA, EstadoNota.ANULADA])
@pytest.mark.parametrize("accion", [AccionNota.APROBAR, AccionNota.RECHAZAR, AccionNota.ANULAR])
def test_los_estados_finales_no_admiten_ninguna_accion(estado_final, accion):
    with pytest.raises(TransicionInvalida, match="solo se permite desde PENDIENTE"):
        siguiente_estado(estado_final, accion)


def test_crear_no_es_una_transicion():
    with pytest.raises(TransicionInvalida):
        siguiente_estado(EstadoNota.PENDIENTE, AccionNota.CREAR)


# --- Quién aprueba según quién solicita ----------------------------------------------

@pytest.mark.parametrize(
    "rol_solicitante, nivel",
    [
        (RolNombre.COLABORADOR, NivelAprobacion.JEFE_DEPARTAMENTO),
        (RolNombre.JEFE_DEPARTAMENTO, NivelAprobacion.ADMINISTRADOR),
    ],
)
def test_nivel_de_aprobacion_segun_el_rol_del_solicitante(rol_solicitante, nivel):
    assert nivel_aprobacion_para(rol_solicitante) == nivel


def test_el_administrador_no_puede_solicitar():
    with pytest.raises(AccesoDenegado):
        nivel_aprobacion_para(RolNombre.ADMINISTRADOR)


@pytest.mark.parametrize(
    "rol, nivel, esperado",
    [
        (RolNombre.JEFE_DEPARTAMENTO, NivelAprobacion.JEFE_DEPARTAMENTO, True),
        (RolNombre.ADMINISTRADOR, NivelAprobacion.JEFE_DEPARTAMENTO, False),
        (RolNombre.ADMINISTRADOR, NivelAprobacion.ADMINISTRADOR, True),
        (RolNombre.JEFE_DEPARTAMENTO, NivelAprobacion.ADMINISTRADOR, False),
        (RolNombre.COLABORADOR, NivelAprobacion.JEFE_DEPARTAMENTO, False),
    ],
)
def test_solo_el_rol_que_corresponde_puede_resolver(rol, nivel, esperado):
    assert puede_resolver(rol, nivel) is esperado
