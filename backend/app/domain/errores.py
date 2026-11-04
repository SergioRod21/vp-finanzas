"""Errores de negocio.

Los servicios los lanzan sin saber nada de HTTP; core/errors.py los traduce a
respuestas con el código de estado correspondiente.
"""


class ErrorDeNegocio(Exception):
    """Base de los errores de negocio. El mensaje es apto para mostrarse al cliente."""

    def __init__(self, mensaje: str):
        super().__init__(mensaje)
        self.mensaje = mensaje


class NoEncontrado(ErrorDeNegocio):
    """El recurso no existe o está fuera del alcance del usuario (404)."""


class AccesoDenegado(ErrorDeNegocio):
    """El usuario ve el recurso, pero no puede realizar esta acción sobre él (403)."""


class TransicionInvalida(ErrorDeNegocio):
    """La acción no es válida para el estado actual del recurso (409)."""


class DatosInvalidos(ErrorDeNegocio):
    """Los datos son correctos en formato, pero no tienen sentido para el negocio (422)."""
