import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesNotasCredito } from '@/features/notas-credito/api/keys'
import type { MotivoNotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/** GET /api/motivos-nota-credito: catálogo de motivos para el formulario de solicitud. */
export function obtenerMotivos(signal?: AbortSignal): Promise<MotivoNotaCredito[]> {
  return api<MotivoNotaCredito[]>('/motivos-nota-credito', { signal })
}

export function motivosQueryOptions() {
  return queryOptions({
    queryKey: clavesNotasCredito.motivos,
    queryFn: ({ signal }) => obtenerMotivos(signal),
    // Es un catálogo que solo cambia por base de datos: no hace falta volver a pedirlo.
    staleTime: Infinity,
  })
}

export function useMotivos() {
  return useQuery(motivosQueryOptions())
}
