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
  departamento_id: number
}

/** Lo mínimo que la regla de cargos necesita del usuario. UsuarioActual lo cumple. */
export interface UsuarioConAlcance {
  rol: Rol
  cargo_id: number
  departamento_id: number
}

/** Un cargo a mostrar. El resumen de un colaborador no trae el departamento: null. */
export interface CargoAutorizable {
  cargo_id: number
  departamento_id: number | null
}

/** Rol que debe aprobar una nota, fijado al crearla según quién la solicitó. */
export type NivelAprobacion = 'JEFE_DEPARTAMENTO' | 'ADMINISTRADOR'

/** Lo mínimo que las reglas necesitan de una nota de crédito. NotaCreditoPublic lo cumple. */
export interface NotaAutorizable {
  solicitante_id: number
  estado: string
  nivel_aprobacion: NivelAprobacion
  departamento_id: number
}

/** Qué rol aprueba cada nivel: la nota de un Colaborador, su Jefe; la de un Jefe, el Administrador. */
const ROL_APROBADOR: Record<NivelAprobacion, Rol> = {
  JEFE_DEPARTAMENTO: ROLES.jefeDepartamento,
  ADMINISTRADOR: ROLES.administrador,
}

/** Único estado desde el que se permite actuar sobre una nota: los demás son finales. */
const ESTADO_PENDIENTE = 'PENDIENTE'

const MODULOS_POR_ROL: Record<Rol, readonly Modulo[]> = {
  [ROLES.administrador]: ['perfil', 'colaboradores', 'cargos', 'notasCredito'],
  [ROLES.jefeDepartamento]: ['perfil', 'colaboradores', 'cargos', 'notasCredito'],
  [ROLES.colaborador]: ['perfil', 'colaboradores', 'cargos', 'notasCredito'],
}

/** Si el rol puede ver el módulo. Un rol desconocido no ve ninguno. */
export function puedeVerModulo(rol: Rol, modulo: Modulo): boolean {
  return MODULOS_POR_ROL[rol]?.includes(modulo) ?? false
}

/**
 * Elegir el departamento en las consultas (colaboradores, cargos): solo el Administrador,
 * que ve todos. El Jefe y el Colaborador siempre ven el suyo.
 */
export function puedeFiltrarPorDepartamento(usuario: Pick<UsuarioAutorizable, 'rol'>): boolean {
  return usuario.rol === ROLES.administrador
}

/**
 * Ver el detalle de un cargo: el Administrador, todos; el Jefe, los de su departamento;
 * el Colaborador, solo el suyo.
 */
export function puedeVerCargo(usuario: UsuarioConAlcance, cargo: CargoAutorizable): boolean {
  if (usuario.rol === ROLES.administrador) return true
  if (usuario.rol === ROLES.colaborador) return cargo.cargo_id === usuario.cargo_id
  return cargo.departamento_id === usuario.departamento_id
}

/** Solicitar una nota de crédito: el Colaborador y el Jefe de Departamento, para su departamento. */
export function puedeCrearNota(usuario: Pick<UsuarioAutorizable, 'rol'>): boolean {
  return usuario.rol === ROLES.colaborador || usuario.rol === ROLES.jefeDepartamento
}

/**
 * Aprobar o rechazar: solo notas pendientes, nunca una propia (segregación de funciones)
 * y solo el rol que indica su nivel de aprobación. El Jefe, además, solo las de su departamento.
 */
export function puedeResolverNota(usuario: UsuarioAutorizable, nota: NotaAutorizable): boolean {
  if (nota.estado !== ESTADO_PENDIENTE || nota.solicitante_id === usuario.usuario_id) return false
  if (usuario.rol !== ROL_APROBADOR[nota.nivel_aprobacion]) return false
  return usuario.rol !== ROLES.jefeDepartamento || nota.departamento_id === usuario.departamento_id
}

/** Anular: solo quien la solicitó (Colaborador o Jefe), y solo mientras está pendiente. */
export function puedeAnularNota(usuario: UsuarioAutorizable, nota: NotaAutorizable): boolean {
  return nota.estado === ESTADO_PENDIENTE && nota.solicitante_id === usuario.usuario_id
}
