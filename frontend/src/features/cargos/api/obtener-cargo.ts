import { queryOptions, useQuery } from '@tanstack/react-query'

import { clavesCargos } from '@/features/cargos/api/keys'
import type { CargoFicha } from '@/features/cargos/types'
import { api } from '@/lib/api-client'

/** GET /api/cargos/{id}: 404 si no existe o está fuera del alcance del usuario. */
export function obtenerCargo(cargoId: number, signal?: AbortSignal): Promise<CargoFicha> {
  return api<CargoFicha>(`/cargos/${cargoId}`, { signal })
}

export function cargoQueryOptions(cargoId: number) {
  return queryOptions({
    queryKey: clavesCargos.detalle(cargoId),
    queryFn: ({ signal }) => obtenerCargo(cargoId, signal),
  })
}

export function useCargo(cargoId: number) {
  return useQuery(cargoQueryOptions(cargoId))
}
