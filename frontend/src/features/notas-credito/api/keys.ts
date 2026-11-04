import type { EstadoNota } from '@/features/notas-credito/types'

/**
 * Query keys del módulo. Todas empiezan por 'notas-credito', y las listas comparten el
 * prefijo `listas`: así una mutación invalida todas las listas (con y sin filtro) a la vez.
 */
export const clavesNotasCredito = {
  todas: ['notas-credito'] as const,
  motivos: ['notas-credito', 'motivos'] as const,
  listas: ['notas-credito', 'lista'] as const,
  lista: (estado: EstadoNota | null) => ['notas-credito', 'lista', { estado }] as const,
  detalle: (notaId: number) => ['notas-credito', 'detalle', notaId] as const,
  historial: (notaId: number) => ['notas-credito', 'historial', notaId] as const,
}
