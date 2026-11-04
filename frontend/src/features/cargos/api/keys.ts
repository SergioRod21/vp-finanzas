const TODOS = ['cargos'] as const

/**
 * Query keys del módulo Cargos y funciones. Todas empiezan por `todos`, para poder
 * invalidar el módulo completo con una sola clave.
 */
export const clavesCargos = {
  todos: TODOS,
  /** Lista de cargos; departamentoId null es la lista sin filtrar. */
  lista: (departamentoId: number | null) => [...TODOS, 'lista', { departamentoId }] as const,
  detalle: (cargoId: number) => [...TODOS, 'detalle', cargoId] as const,
}
