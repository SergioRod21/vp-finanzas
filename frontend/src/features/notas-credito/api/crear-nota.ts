import { useMutation, useQueryClient } from '@tanstack/react-query'

import { sincronizarNotaModificada } from '@/features/notas-credito/api/sincronizar-cache'
import type { NotaCredito, NuevaNotaCredito } from '@/features/notas-credito/types'
import { api } from '@/lib/api-client'

/**
 * POST /api/notas-credito (Colaborador o Jefe de Departamento). La nota queda PENDIENTE y
 * para el departamento del solicitante: el departamento no se envía, lo decide el backend.
 */
export function crearNota(datos: NuevaNotaCredito): Promise<NotaCredito> {
  return api<NotaCredito>('/notas-credito', { method: 'POST', body: datos })
}

export function useCrearNota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearNota,
    onSuccess: (nota) => sincronizarNotaModificada(queryClient, nota),
  })
}
