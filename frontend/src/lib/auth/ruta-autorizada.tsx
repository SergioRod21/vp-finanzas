import { Outlet } from 'react-router'

import { SinPermiso } from '@/components/feedback/sin-permiso'
import type { UsuarioActual } from '@/lib/auth/types'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeVerModulo, type Modulo } from '@/lib/authorization'

/**
 * Rutas que exigen un permiso concreto, por ejemplo `permitido={puedeCrearNota}`. Si el
 * usuario no lo tiene, muestra "Sin permiso" (403) en lugar del contenido.
 * Va dentro de RutaProtegida.
 */
export function RutaAutorizada({ permitido }: { permitido: (usuario: UsuarioActual) => boolean }) {
  const usuario = useUsuarioAutenticado()
  return permitido(usuario) ? <Outlet /> : <SinPermiso />
}

/** Rutas de un módulo: solo para los roles que lo ven según lib/authorization.ts. */
export function RutaModulo({ modulo }: { modulo: Modulo }) {
  return <RutaAutorizada permitido={(usuario) => puedeVerModulo(usuario.rol, modulo)} />
}
