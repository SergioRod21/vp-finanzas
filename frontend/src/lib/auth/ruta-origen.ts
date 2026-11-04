import { useLocation, type Location } from 'react-router'

import { paths } from '@/config/paths'

/**
 * Ruta de origen: cuando RutaProtegida manda a login, guarda en el state de la
 * navegación la página que se quería abrir, para volver a ella después del login.
 */
interface EstadoConOrigen {
  desde: Pick<Location, 'pathname' | 'search' | 'hash'>
}

/** State que RutaProtegida pasa a la navegación hacia login. */
export function estadoConRutaDeOrigen(location: Location): EstadoConOrigen {
  const { pathname, search, hash } = location
  return { desde: { pathname, search, hash } }
}

function esEstadoConOrigen(estado: unknown): estado is EstadoConOrigen {
  const desde = (estado as { desde?: Record<string, unknown> } | null)?.desde
  return (
    typeof desde?.pathname === 'string' &&
    typeof desde.search === 'string' &&
    typeof desde.hash === 'string'
  )
}

/**
 * Adónde ir después del login: la ruta de origen si existe, o el inicio. El state del
 * historial lo puede alterar cualquiera, así que se valida antes de usarlo.
 */
export function useRutaDeOrigen(): string {
  const { state } = useLocation()
  if (!esEstadoConOrigen(state)) return paths.inicio

  const { pathname, search, hash } = state.desde
  // Solo rutas internas: evita volver a login y URLs como "//otro-sitio.com".
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname === paths.login) {
    return paths.inicio
  }
  return `${pathname}${search}${hash}`
}
