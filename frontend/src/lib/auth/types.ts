import type { Rol } from '@/types/rol'

/** Usuario autenticado, tal como lo devuelven POST /api/auth/login y GET /api/auth/me. */
export interface UsuarioActual {
  usuario_id: number
  colaborador_id: number
  correo: string
  nombre: string
  apellido: string
  rol: Rol
  cargo_id: number
  departamento_id: number
  departamento: string
}

/** Cuerpo de POST /api/auth/login. */
export interface CredencialesLogin {
  correo: string
  password: string
}
