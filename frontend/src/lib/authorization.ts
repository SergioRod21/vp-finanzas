/**
 * Matriz de permisos del portal (decisión S3 en docs/decisiones-tecnicas.md), en un solo lugar.
 *
 * Funciones puras: no consultan la API ni conocen React. El frontend las usa para ocultar
 * lo que no corresponde al rol, solo como experiencia de usuario: la seguridad real está
 * en el backend, que verifica la misma matriz en cada endpoint.
 */
import { ROLES, type Rol } from '@/types/rol'

/** Módulos del portal (sección 3.3). */
export type Modulo = 'perfil' | 'colaboradores' | 'cargos' | 'notasCredito'

/** Lo mínimo que las reglas necesitan del usuario. UsuarioActual lo cumple. */
export interface UsuarioAutorizable {
  usuario_id: number
  rol: Rol
}

/** Lo mínimo que las reglas necesitan de una nota de crédito. NotaCreditoPublic lo cumple. */
export interface NotaAutorizable {
  solicitante_id: number
  estado: string
}

/** Único estado desde el que se permite actuar sobre una nota: los demás son finales. */
const ESTADO_PENDIENTE = 'PENDIENTE'

const MODULOS_POR_ROL: Record<Rol, readonly Modulo[]> = {
  [ROLES.administrador]: ['perfil', 'colaboradores', 'cargos', 'notasCredito'],
  [ROLES.jefeDepartamento]: ['perfil', 'colaboradores', 'cargos', 'notasCredito'],
  [ROLES.colaborador]: ['perfil', 'colaboradores', 'cargos'],
}

/** Si el rol puede ver el módulo. Un rol desconocido no ve ninguno. */
export function puedeVerModulo(rol: Rol, modulo: Modulo): boolean {
  return MODULOS_POR_ROL[rol]?.includes(modulo) ?? false
}

/** Crear una solicitud de nota de crédito: solo el Jefe de Departamento, para su departamento. */
export function puedeCrearNota(usuario: Pick<UsuarioAutorizable, 'rol'>): boolean {
  return usuario.rol === ROLES.jefeDepartamento
}

/**
 * Aprobar o rechazar: solo el Administrador, solo notas pendientes y nunca una que él
 * mismo solicitó (segregación de funciones).
 */
export function puedeResolverNota(usuario: UsuarioAutorizable, nota: NotaAutorizable): boolean {
  return (
    usuario.rol === ROLES.administrador &&
    nota.estado === ESTADO_PENDIENTE &&
    nota.solicitante_id !== usuario.usuario_id
  )
}

/** Anular: solo el Jefe de Departamento que la solicitó, y solo mientras está pendiente. */
export function puedeAnularNota(usuario: UsuarioAutorizable, nota: NotaAutorizable): boolean {
  return (
    usuario.rol === ROLES.jefeDepartamento &&
    nota.estado === ESTADO_PENDIENTE &&
    nota.solicitante_id === usuario.usuario_id
  )
}
