"""Manejo de errores uniforme: toda respuesta de error es JSON con la forma {"detail": ...}.

- Errores de negocio (domain/errores.py) → su código HTTP, con un mensaje apto para el cliente.
- Violaciones de restricciones de la BD → 409 genérico. Son la segunda barrera: si llegan
  aquí, una regla se saltó en el backend, y se registra para investigarlo.
- Base de datos no disponible → 503. Cualquier otro error → 500.

Los detalles internos (trazas, mensajes de PostgreSQL) se registran en el log del
servidor y nunca se envían al cliente.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

from app.domain.errores import (
    AccesoDenegado,
    DatosInvalidos,
    ErrorDeNegocio,
    NoEncontrado,
    TransicionInvalida,
)

logger = logging.getLogger(__name__)

_CODIGOS_ERROR_DE_NEGOCIO: dict[type[ErrorDeNegocio], int] = {
    NoEncontrado: status.HTTP_404_NOT_FOUND,
    AccesoDenegado: status.HTTP_403_FORBIDDEN,
    TransicionInvalida: status.HTTP_409_CONFLICT,
    DatosInvalidos: status.HTTP_422_UNPROCESSABLE_CONTENT,
}


async def _error_de_negocio(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ErrorDeNegocio)
    codigo = _CODIGOS_ERROR_DE_NEGOCIO.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return JSONResponse(status_code=codigo, content={"detail": exc.mensaje})


async def _restriccion_violada(request: Request, exc: Exception) -> JSONResponse:
    restriccion = getattr(getattr(getattr(exc, "orig", None), "diag", None), "constraint_name", None)
    logger.warning("Restricción de la BD violada en %s %s: %s",
                   request.method, request.url.path, restriccion)
    return JSONResponse(status_code=status.HTTP_409_CONFLICT,
                        content={"detail": "La operación no cumple una regla del negocio"})


async def _database_unavailable(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Base de datos no disponible en %s %s: %s",
                 request.method, request.url.path, type(exc).__name__)
    return JSONResponse(status_code=503,
                        content={"detail": "Servicio no disponible temporalmente"})


async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ErrorDeNegocio, _error_de_negocio)
    app.add_exception_handler(IntegrityError, _restriccion_violada)
    # OperationalError: no se pudo conectar o la conexión se cortó.
    app.add_exception_handler(OperationalError, _database_unavailable)
    # Cualquier otro error inesperado.
    app.add_exception_handler(Exception, _unhandled)
