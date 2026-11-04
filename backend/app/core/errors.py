"""Manejo de errores uniforme: toda respuesta de error es JSON con la forma {"detail": ...}.

Los detalles internos (trazas, mensajes de PostgreSQL) se registran en el log del
servidor y nunca se envían al cliente.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)


async def _database_unavailable(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Base de datos no disponible en %s %s: %s",
                 request.method, request.url.path, type(exc).__name__)
    return JSONResponse(status_code=503,
                        content={"detail": "Servicio no disponible temporalmente"})


async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


def register_exception_handlers(app: FastAPI) -> None:
    # OperationalError: no se pudo conectar o la conexión se cortó.
    app.add_exception_handler(OperationalError, _database_unavailable)
    # Cualquier otro error inesperado.
    app.add_exception_handler(Exception, _unhandled)
