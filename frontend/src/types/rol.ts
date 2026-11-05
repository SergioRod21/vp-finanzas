/**
 * Roles del portal. Los valores coinciden con rol.nombre en la base de datos y con
 * RolNombre del backend (app/core/roles.py).
 */
export const ROLES = {
  administrador: 'Administrador',
  jefeDepartamento: 'Jefe de Departamento',
  colaborador: 'Colaborador',
} as const

export type Rol = (typeof ROLES)[keyof typeof ROLES]
