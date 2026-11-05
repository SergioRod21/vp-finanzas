const TODOS = ['colaboradores'] as const

/**
 * Query keys del módulo Colaboradores. Todas empiezan por `todos`, para poder invalidar
 * el módulo completo con una sola clave.
 */
export const clavesColaboradores = {
  todos: TODOS,
  /** Lista de colaboradores; departamentoId null es la lista sin filtrar. */
  lista: (departamentoId: number | null) => [...TODOS, 'lista', { departamentoId }] as const,
  detalle: (colaboradorId: number) => [...TODOS, 'detalle', colaboradorId] as const,
}
