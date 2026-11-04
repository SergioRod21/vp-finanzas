import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesPerfil } from '@/features/perfil/api/keys'
import type { Perfil } from '@/features/perfil/types'
import { api } from '@/lib/api-client'

/** GET /api/perfil: la ficha del usuario autenticado. Disponible para los tres roles. */
export function obtenerPerfil(signal?: AbortSignal): Promise<Perfil> {
  return api<Perfil>('/perfil', { signal })
}

export function perfilQueryOptions() {
  return queryOptions({
    queryKey: clavesPerfil.propio,
    queryFn: ({ signal }) => obtenerPerfil(signal),
  })
}

export function usePerfil() {
  return useQuery(perfilQueryOptions())
}
