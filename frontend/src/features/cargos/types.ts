/** Un cargo con sus funciones, tal como lo devuelven GET /api/cargos y GET /api/cargos/{id}. */
export interface CargoFicha {
  cargo_id: number
  titulo: string
  nivel: string
  departamento_id: number
  departamento: string
  funciones: string[]
}
