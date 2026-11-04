import { ApiError } from '@/lib/api-client'

/**
 * Si el error de una consulta es un 404 de la API. El backend responde 404 tanto si el
 * recurso no existe como si está fuera del alcance del usuario (para no revelar que
 * existe): en ambos casos las pantallas de detalle muestran "Página no encontrada".
 */
export function esNoEncontrado(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404
}

/** Si el error es un 403 de la API: el rol del usuario no permite la acción o el recurso. */
export function esSinPermiso(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403
}
