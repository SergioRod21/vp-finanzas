"""Máquina de estados de las notas de crédito (reglas puras, sin base de datos)."""

import pytest

from app.domain.errores import TransicionInvalida
from app.domain.nota_credito import AccionNota, EstadoNota, siguiente_estado


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
