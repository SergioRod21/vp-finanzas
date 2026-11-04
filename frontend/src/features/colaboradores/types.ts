/**
 * Lo que la API devuelve de un colaborador depende del rol (matriz S3):
 * - Administrador y Jefe de Departamento reciben la ficha completa.
 * - El Colaborador recibe el resumen: solo datos de contacto y cargo de sus compañeros.
 */

/** Datos de contacto y cargo (ColaboradorResumen del backend). */
export interface ColaboradorResumen {
  colaborador_id: number
  nombre: string
  apellido: string
  correo: string
  cargo_id: number
  cargo: string
}

/** Ficha completa (ColaboradorFicha del backend): el resumen más los datos laborales. */
export interface ColaboradorFicha extends ColaboradorResumen {
  pais: string
  /** Fecha sin hora, "YYYY-MM-DD". */
  fecha_ingreso: string
  activo: boolean
  nivel: string
  departamento_id: number
  departamento: string
}

/** Respuesta de GET /api/colaboradores/{id}: ficha o resumen, según el rol. */
export type Colaborador = ColaboradorFicha | ColaboradorResumen

/** Respuesta de GET /api/colaboradores: la lista es toda de fichas o toda de resúmenes. */
export type ListaColaboradores = ColaboradorFicha[] | ColaboradorResumen[]

/** El cargo de un colaborador, para enlazarlo. El resumen no trae el departamento: null. */
export interface CargoDelColaborador {
  cargoId: number
  titulo: string
  departamentoId: number | null
}

/**
 * Guarda de tipos: si el colaborador es la ficha completa. Basta un campo que solo tiene
 * la ficha; el resto de los datos laborales viene siempre con él.
 */
export function esColaboradorFicha(colaborador: Colaborador): colaborador is ColaboradorFicha {
  return 'departamento_id' in colaborador
}

/** Guarda de tipos para la lista: si son fichas completas. Una lista vacía cuenta como fichas. */
export function sonFichas(lista: ListaColaboradores): lista is ColaboradorFicha[] {
  const elementos: readonly Colaborador[] = lista
  return elementos.every(esColaboradorFicha)
}
