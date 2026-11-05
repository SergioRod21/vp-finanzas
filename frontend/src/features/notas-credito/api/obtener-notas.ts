import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { clavesNotasCredito } from '@/features/notas-credito/api/keys'
import type { EstadoNota, NotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/**
 * GET /api/notas-credito, con el filtro opcional por estado. El backend decide el
 * alcance: el Administrador recibe todas; el Jefe, las de su departamento; el Colaborador, las suyas.
 */
export function obtenerNotas(estado: EstadoNota | null, signal?: AbortSignal): Promise<NotaCredito[]> {
  const consulta = estado ? `?${new URLSearchParams({ estado }).toString()}` : ''
  return api<NotaCredito[]>(`/notas-credito${consulta}`, { signal })
}

export function notasQueryOptions(estado: EstadoNota | null) {
  return queryOptions({
    queryKey: clavesNotasCredito.lista(estado),
    queryFn: ({ signal }) => obtenerNotas(estado, signal),
  })
}

/**
 * Lista de notas. Al cambiar el filtro se sigue mostrando la lista anterior hasta que
 * llega la nueva (isPlaceholderData), en lugar de vaciar la tabla.
 */
export function useNotas(estado: EstadoNota | null) {
  return useQuery({ ...notasQueryOptions(estado), placeholderData: keepPreviousData })
}
