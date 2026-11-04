import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesCargos } from '@/features/cargos/api/keys'
import type { CargoFicha } from '@/features/cargos/types'
import { api } from '@/lib/api-client'

/**
 * GET /api/cargos. Administrador: todos, o los del departamento indicado. Jefe: los de su
 * departamento. Colaborador: solo su propio cargo. Al Jefe y al Colaborador no se les
 * envía departamento_id: si pidieran otro departamento, la API respondería 404.
 */
export function listarCargos(departamentoId: number | null, signal?: AbortSignal): Promise<CargoFicha[]> {
  const consulta = departamentoId === null ? '' : `?${new URLSearchParams({ departamento_id: String(departamentoId) })}`
  return api<CargoFicha[]>(`/cargos${consulta}`, { signal })
}

export function cargosQueryOptions(departamentoId: number | null) {
  return queryOptions({
    queryKey: clavesCargos.lista(departamentoId),
    queryFn: ({ signal }) => listarCargos(departamentoId, signal),
  })
}

/** Cargos que el usuario puede ver; departamentoId null es la lista sin filtrar. */
export function useCargos(departamentoId: number | null) {
  return useQuery(cargosQueryOptions(departamentoId))
}
