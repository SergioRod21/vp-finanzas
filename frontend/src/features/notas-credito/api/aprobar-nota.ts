import { useMutation, useQueryClient } from '@tanstack/react-query'

import { refrescarNota, sincronizarNotaModificada } from '@/features/notas-credito/api/sincronizar-cache'
import type { NotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/**
 * POST /api/notas-credito/{id}/aprobar (solo el Administrador). El comentario es
 * opcional: si no hay, no se envía cuerpo. 409 si la nota ya no está PENDIENTE y 403 si
 * la solicitó el mismo usuario.
 */
export function aprobarNota(notaId: number, comentario?: string): Promise<NotaCredito> {
  return api<NotaCredito>(`/notas-credito/${notaId}/aprobar`, {
    method: 'POST',
    body: comentario ? { comentario } : undefined,
  })
}

export function useAprobarNota(notaId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comentario?: string) => aprobarNota(notaId, comentario),
    onSuccess: (nota) => sincronizarNotaModificada(queryClient, nota),
    onError: () => refrescarNota(queryClient, notaId),
  })
}
