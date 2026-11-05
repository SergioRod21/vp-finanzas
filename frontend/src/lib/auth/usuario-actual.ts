import { queryOptions, useQuery } from '@tanstack/react-query'
import { createContext, useContext } from 'react'

import { api, ApiError } from '@/lib/api-client'
import { clavesAuth } from '@/lib/auth/keys'
import type { UsuarioActual } from '@/lib/auth/types'

/**
 * GET /api/auth/me. Un 401 no es un error: significa "sin sesión" y se representa
 * como null. Cualquier otro error (por ejemplo, la API caída) sí se propaga.
 */
export async function obtenerUsuarioActual(signal?: AbortSignal): Promise<UsuarioActual | null> {
  try {
    return await api<UsuarioActual>('/auth/me', { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function usuarioActualQueryOptions() {
  return queryOptions({
    queryKey: clavesAuth.usuarioActual,
    queryFn: ({ signal }) => obtenerUsuarioActual(signal),
    // La sesión solo cambia con el login, el logout o un 401, y los tres actualizan
    // esta consulta: no hace falta volver a pedirla por tiempo.
    staleTime: Infinity,
  })
}

/** Estado de la sesión: data es el usuario, o null si no hay sesión. */
export function useUsuarioActual() {
  return useQuery(usuarioActualQueryOptions())
}

/** Usuario de la sesión para las pantallas protegidas. Lo provee RutaProtegida. */
export const ContextoUsuario = createContext<UsuarioActual | null>(null)

/**
 * Usuario autenticado, nunca null: para usar dentro de las rutas protegidas, donde
 * RutaProtegida ya garantizó que hay sesión.
 */
export function useUsuarioAutenticado(): UsuarioActual {
  const usuario = useContext(ContextoUsuario)
  if (usuario === null) {
    throw new Error('useUsuarioAutenticado solo se puede usar dentro de RutaProtegida')
  }
  return usuario
}
