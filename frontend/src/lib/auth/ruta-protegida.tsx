import { Container } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { paths } from '@/config/paths'
import { mensajeDeError } from '@/lib/api-client'
import { estadoConRutaDeOrigen } from '@/lib/auth/ruta-origen'
import { ContextoUsuario, useUsuarioActual } from '@/lib/auth/usuario-actual'

/**
 * Rutas que requieren sesión. Mientras se consulta la sesión muestra un cargador; sin
 * sesión, redirige a login guardando la ruta de origen para volver después.
 *
 * También cubre la sesión expirada: el manejo global del 401 pone el usuario en null
 * y este componente redirige.
 */
export function RutaProtegida() {
  const location = useLocation()
  const sesion = useUsuarioActual()

  if (sesion.data) {
    return (
      <ContextoUsuario value={sesion.data}>
        <Outlet />
      </ContextoUsuario>
    )
  }

  if (sesion.isPending) return <CargadorPagina />

  if (sesion.isError) {
    return (
      <Container size="sm" py="xl">
        <ErrorCarga
          titulo="No se pudo verificar la sesión"
          mensaje={mensajeDeError(sesion.error)}
          onReintentar={() => void sesion.refetch()}
        />
      </Container>
    )
  }

  return <Navigate to={paths.login} replace state={estadoConRutaDeOrigen(location)} />
}
