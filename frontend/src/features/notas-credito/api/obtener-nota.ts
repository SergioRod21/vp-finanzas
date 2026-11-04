import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesNotasCredito } from '@/features/notas-credito/api/keys'
import type { NotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/** GET /api/notas-credito/{id}. Responde 404 si no existe o es de otro departamento. */
export function obtenerNota(notaId: number, signal?: AbortSignal): Promise<NotaCredito> {
  return api<NotaCredito>(`/notas-credito/${notaId}`, { signal })
}

export function notaQueryOptions(notaId: number) {
  return queryOptions({
    queryKey: clavesNotasCredito.detalle(notaId),
    queryFn: ({ signal }) => obtenerNota(notaId, signal),
  })
}

export function useNota(notaId: number) {
  return useQuery(notaQueryOptions(notaId))
}
