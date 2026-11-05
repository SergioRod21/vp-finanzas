import { useMutation, useQueryClient } from '@tanstack/react-query'

import { refrescarNota, sincronizarNotaModificada } from '@/features/notas-credito/api/sincronizar-cache'
import type { NotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/**
 * POST /api/notas-credito/{id}/anular (solo quien la solicitó). El comentario es
 * opcional. 403 si no la solicitó él y 409 si la nota ya no está PENDIENTE.
 */
export function anularNota(notaId: number, comentario?: string): Promise<NotaCredito> {
  return api<NotaCredito>(`/notas-credito/${notaId}/anular`, {
    method: 'POST',
    body: comentario ? { comentario } : undefined,
  })
}

export function useAnularNota(notaId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comentario?: string) => anularNota(notaId, comentario),
    onSuccess: (nota) => sincronizarNotaModificada(queryClient, nota),
    onError: () => refrescarNota(queryClient, notaId),
  })
}
