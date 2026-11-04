import { Navigate, Outlet } from 'react-router'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { useRutaDeOrigen } from '@/lib/auth/ruta-origen'
import { useUsuarioActual } from '@/lib/auth/usuario-actual'

/**
 * Rutas solo para quien no tiene sesión (login). Si ya hay sesión, redirige a la ruta
 * de origen, o al inicio si se entró directo a /login.
 *
 * Si la consulta de la sesión falla (API caída), muestra la página igualmente: el
 * formulario de login informará el error al intentar entrar.
 */
export function RutaPublica() {
  const sesion = useUsuarioActual()
  const rutaDeOrigen = useRutaDeOrigen()

  if (sesion.isPending) return <CargadorPagina />
  if (sesion.data) return <Navigate to={rutaDeOrigen} replace />
  return <Outlet />
}
