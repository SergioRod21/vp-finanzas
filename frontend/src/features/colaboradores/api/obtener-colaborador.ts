import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesColaboradores } from '@/features/colaboradores/api/keys'
import type { Colaborador } from '@/features/colaboradores/types'
import { api } from '@/lib/api-client'

/** GET /api/colaboradores/{id}: ficha o resumen según el rol; 404 si está fuera de su alcance. */
export function obtenerColaborador(colaboradorId: number, signal?: AbortSignal): Promise<Colaborador> {
  return api<Colaborador>(`/colaboradores/${colaboradorId}`, { signal })
}

export function colaboradorQueryOptions(colaboradorId: number) {
  return queryOptions({
    queryKey: clavesColaboradores.detalle(colaboradorId),
    queryFn: ({ signal }) => obtenerColaborador(colaboradorId, signal),
  })
}

export function useColaborador(colaboradorId: number) {
  return useQuery(colaboradorQueryOptions(colaboradorId))
}
