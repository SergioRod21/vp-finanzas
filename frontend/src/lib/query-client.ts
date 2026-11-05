import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api-client'
import { manejarSesionExpirada } from '@/lib/auth/sesion'

export const queryClient: QueryClient = new QueryClient({
  // Un 401 en cualquier consulta o mutación significa que la sesión expiró: se maneja
  // aquí, una sola vez para toda la aplicación, y no en cada pantalla.
  queryCache: new QueryCache({
    onError: (error) => manejarSesionExpirada(queryClient, error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => manejarSesionExpirada(queryClient, error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Los errores 4xx son definitivos (sin sesión, sin permiso, no existe): no se reintentan.
      retry: (intentos, error) =>
        !(error instanceof ApiError && error.status < 500) && intentos < 1,
    },
  },
})
