"""Reglas del proceso de notas de crédito (sección 3.4, decisión S3).

Funciones puras: no consultan la base de datos ni conocen HTTP.

Máquina de estados:

                 ┌── APROBAR  ──► APROBADA
    PENDIENTE ───┼── RECHAZAR ──► RECHAZADA
                 └── ANULAR   ──► ANULADA

Solo se puede actuar sobre una nota PENDIENTE; los otros tres estados son finales.
La misma tabla de transiciones existe como CHECK en nota_credito_historico
(db/03-notas-credito.sql): la base de datos es la segunda barrera.
"""

from enum import StrEnum

from app.domain.errores import TransicionInvalida


class EstadoNota(StrEnum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    ANULADA = "ANULADA"


class AccionNota(StrEnum):
    CREAR = "CREAR"
    APROBAR = "APROBAR"
    RECHAZAR = "RECHAZAR"
    ANULAR = "ANULAR"


# acción → (estado desde el que se permite, estado resultante)
TRANSICIONES: dict[AccionNota, tuple[EstadoNota, EstadoNota]] = {
    AccionNota.APROBAR: (EstadoNota.PENDIENTE, EstadoNota.APROBADA),
    AccionNota.RECHAZAR: (EstadoNota.PENDIENTE, EstadoNota.RECHAZADA),
    AccionNota.ANULAR: (EstadoNota.PENDIENTE, EstadoNota.ANULADA),
}

# Acciones que resuelven la nota: registran al usuario como resolutor.
ACCIONES_DE_RESOLUCION = {AccionNota.APROBAR, AccionNota.RECHAZAR}


def siguiente_estado(estado_actual: str, accion: AccionNota) -> EstadoNota:
    """Estado al que pasa la nota al aplicar la acción, o TransicionInvalida."""
    if accion not in TRANSICIONES:
        raise TransicionInvalida(f"La acción {accion} no es una transición de estado")
    desde, hacia = TRANSICIONES[accion]
    if estado_actual != desde:
        raise TransicionInvalida(
            f"No se puede {accion.lower()} una nota en estado {estado_actual}; "
            f"solo se permite desde {desde}"
        )
    return hacia
