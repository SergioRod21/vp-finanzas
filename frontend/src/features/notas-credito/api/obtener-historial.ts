import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesNotasCredito } from '@/features/notas-credito/api/keys'
import type { EventoHistorialNota } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/** GET /api/notas-credito/{id}/historial: eventos de auditoría en orden cronológico. */
export function obtenerHistorial(notaId: number, signal?: AbortSignal): Promise<EventoHistorialNota[]> {
  return api<EventoHistorialNota[]>(`/notas-credito/${notaId}/historial`, { signal })
}

export function historialQueryOptions(notaId: number) {
  return queryOptions({
    queryKey: clavesNotasCredito.historial(notaId),
    queryFn: ({ signal }) => obtenerHistorial(notaId, signal),
  })
}

export function useHistorialNota(notaId: number) {
  return useQuery(historialQueryOptions(notaId))
}
