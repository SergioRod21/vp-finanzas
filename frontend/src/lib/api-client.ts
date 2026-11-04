/**
 * Cliente HTTP único de la aplicación. Ninguna otra parte del código llama a fetch.
 *
 * - Rutas relativas (/api/...): el mismo código funciona con el proxy de Vite y con nginx.
 * - credentials 'same-origin': el navegador envía la cookie de sesión httpOnly.
 * - Toda respuesta de error se convierte en ApiError, con el mensaje de {"detail"} del backend.
 */

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface OpcionesApi {
  method?: Metodo
  body?: unknown
  signal?: AbortSignal
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso no existe o no está disponible.',
  503: 'El servicio no está disponible. Intenta nuevamente en unos minutos.',
}

/** Extrae un mensaje legible del cuerpo de error de FastAPI ({"detail": string | lista}). */
function mensajeDelCuerpo(cuerpo: unknown, status: number): string {
  const detalle = (cuerpo as { detail?: unknown } | null)?.detail
  if (typeof detalle === 'string') return detalle
  if (Array.isArray(detalle) && detalle.length > 0) return 'Los datos enviados no son válidos.'
  return MENSAJES_POR_ESTADO[status] ?? 'Ocurrió un error inesperado.'
}

/**
 * Mensaje para mostrar al usuario a partir de cualquier error de una consulta o mutación:
 * el de la API si es un ApiError; si no, el fetch no llegó al servidor (red o proxy caídos).
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.'
}

export async function api<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const { method = 'GET', body, signal } = opciones

  const respuesta = await fetch(`/api${ruta}`, {
    method,
    signal,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (respuesta.status === 204) return undefined as T

  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw new ApiError(respuesta.status, mensajeDelCuerpo(cuerpo, respuesta.status))
  return cuerpo as T
}
