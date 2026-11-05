import { notifications } from '@mantine/notifications'
import { hashKey, type QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api-client'
import { clavesAuth } from '@/lib/auth/keys'
import type { UsuarioActual } from '@/lib/auth/types'

/**
 * Marca la sesión como cerrada y borra todos los datos en caché del usuario anterior.
 *
 * Primero se pone el usuario en null (RutaProtegida reacciona y redirige a login) y
 * después se eliminan las demás consultas y mutaciones, para que otro usuario que
 * inicie sesión en el mismo navegador no vea datos ajenos.
 */
export function limpiarSesion(queryClient: QueryClient): void {
  queryClient.setQueryData<UsuarioActual | null>(clavesAuth.usuarioActual, null)
  const hashSesion = hashKey(clavesAuth.usuarioActual)
  queryClient.removeQueries({ predicate: (consulta) => consulta.queryHash !== hashSesion })
  queryClient.getMutationCache().clear()
}

/**
 * Manejo global del 401 (sesión expirada o invalidada en el servidor). Lo llaman
 * QueryCache y MutationCache para cualquier consulta o mutación.
 *
 * Solo actúa si había una sesión abierta. Así, el 401 de un login con credenciales
 * inválidas no hace nada (lo muestra el formulario) y no hay bucles en la página de login.
 */
export function manejarSesionExpirada(queryClient: QueryClient, error: Error): void {
  if (!(error instanceof ApiError) || error.status !== 401) return
  if (!queryClient.getQueryData<UsuarioActual | null>(clavesAuth.usuarioActual)) return

  limpiarSesion(queryClient)
  notifications.show({
    title: 'Tu sesión expiró',
    message: 'Vuelve a iniciar sesión para continuar donde estabas.',
  })
}
