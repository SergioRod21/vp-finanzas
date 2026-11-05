import type { Rol } from '@/types/rol'

/** Ficha propia del usuario autenticado, tal como la devuelve GET /api/perfil. */
export interface Perfil {
  colaborador_id: number
  nombre: string
  apellido: string
  correo: string
  cargo: string
  pais: string
  /** Fecha sin hora, "YYYY-MM-DD". */
  fecha_ingreso: string
  activo: boolean
  nivel: string
  departamento_id: number
  departamento: string
  rol: Rol
}
