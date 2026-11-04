import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'
import { clavesAuth } from '@/lib/auth/keys'
import type { CredencialesLogin, UsuarioActual } from '@/lib/auth/types'

/** POST /api/auth/login: valida las credenciales y el backend deja la cookie de sesión. */
export function iniciarSesion(credenciales: CredencialesLogin): Promise<UsuarioActual> {
  return api<UsuarioActual>('/auth/login', { method: 'POST', body: credenciales })
}

/**
 * Mutación de login. La respuesta ya es el usuario actual: se guarda en la caché de la
 * sesión, sin pedir de nuevo GET /api/auth/me.
 */
export function useIniciarSesion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: iniciarSesion,
    onSuccess: (usuario) => {
      queryClient.setQueryData<UsuarioActual | null>(clavesAuth.usuarioActual, usuario)
    },
  })
}
