import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { paths } from '@/config/paths'
import { api, mensajeDeError } from '@/lib/api-client'
import { limpiarSesion } from '@/lib/auth/sesion'

/** POST /api/auth/logout: el backend borra la cookie de sesión (204). */
export function cerrarSesion(): Promise<void> {
  return api<void>('/auth/logout', { method: 'POST' })
}

/** Mutación de logout: limpia toda la caché y vuelve a la página de login. */
export function useCerrarSesion() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: cerrarSesion,
    onSuccess: () => {
      limpiarSesion(queryClient)
      // flushSync: la navegación se aplica de inmediato, antes de que RutaProtegida
      // reaccione a la sesión en null y redirija a login conservando la ruta actual.
      // Tras un logout, el siguiente login debe empezar en el inicio.
      void navigate(paths.login, { replace: true, flushSync: true })
    },
    onError: (error) => {
      notifications.show({
        color: 'red',
        title: 'No se pudo cerrar la sesión',
        message: mensajeDeError(error),
      })
    },
  })
}
