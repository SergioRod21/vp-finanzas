import { useMutation, useQueryClient } from '@tanstack/react-query'

import { refrescarNota, sincronizarNotaModificada } from '@/features/notas-credito/api/sincronizar-cache'
import type { NotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/**
 * POST /api/notas-credito/{id}/rechazar (solo el Administrador). El comentario es
 * obligatorio: queda en la auditoría como motivo del rechazo. 409 si la nota ya no está
 * PENDIENTE.
 */
export function rechazarNota(notaId: number, comentario: string): Promise<NotaCredito> {
  return api<NotaCredito>(`/notas-credito/${notaId}/rechazar`, { method: 'POST', body: { comentario } })
}

export function useRechazarNota(notaId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comentario: string) => rechazarNota(notaId, comentario),
    onSuccess: (nota) => sincronizarNotaModificada(queryClient, nota),
    onError: () => refrescarNota(queryClient, notaId),
  })
}
