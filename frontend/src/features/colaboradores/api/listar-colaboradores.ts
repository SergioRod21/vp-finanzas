import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesColaboradores } from '@/features/colaboradores/api/keys'
import type { ListaColaboradores } from '@/features/colaboradores/types'
import { api } from '@/lib/api-client'

/**
 * GET /api/colaboradores. Administrador: todos, o los del departamento indicado. Jefe: los
 * de su departamento. Colaborador: sus compañeros activos, en resumen. Al Jefe y al
 * Colaborador no se les envía departamento_id: si pidieran otro, la API respondería 404.
 */
export function listarColaboradores(departamentoId: number | null, signal?: AbortSignal): Promise<ListaColaboradores> {
  const consulta = departamentoId === null ? '' : `?${new URLSearchParams({ departamento_id: String(departamentoId) })}`
  return api<ListaColaboradores>(`/colaboradores${consulta}`, { signal })
}

export function colaboradoresQueryOptions(departamentoId: number | null) {
  return queryOptions({
    queryKey: clavesColaboradores.lista(departamentoId),
    queryFn: ({ signal }) => listarColaboradores(departamentoId, signal),
  })
}

/** Colaboradores que el usuario puede ver; departamentoId null es la lista sin filtrar. */
export function useColaboradores(departamentoId: number | null) {
  return useQuery(colaboradoresQueryOptions(departamentoId))
}
