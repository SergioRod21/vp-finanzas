import type { QueryClient } from '@tanstack/react-query'

import { clavesNotasCredito } from '@/features/notas-credito/api/keys'
import type { NotaCredito } from '@/features/notas-credito/types'

/**
 * Actualiza la caché después de crear una nota o de cambiar su estado. La respuesta de
 * la API ya es la nota actualizada: se guarda como detalle sin pedirla de nuevo. El
 * historial y las listas sí cambian y se invalidan (las listas, con cualquier filtro).
 */
export function sincronizarNotaModificada(queryClient: QueryClient, nota: NotaCredito): Promise<void> {
  queryClient.setQueryData(clavesNotasCredito.detalle(nota.nota_credito_id), nota)
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: clavesNotasCredito.historial(nota.nota_credito_id) }),
    queryClient.invalidateQueries({ queryKey: clavesNotasCredito.listas }),
  ]).then(() => undefined)
}

/**
 * Tras una acción fallida, vuelve a pedir la nota, su historial y las listas. Si otra
 * persona ya la resolvió (409), el usuario ve enseguida el estado real.
 */
export function refrescarNota(queryClient: QueryClient, notaId: number): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: clavesNotasCredito.detalle(notaId) }),
    queryClient.invalidateQueries({ queryKey: clavesNotasCredito.historial(notaId) }),
    queryClient.invalidateQueries({ queryKey: clavesNotasCredito.listas }),
  ]).then(() => undefined)
}
