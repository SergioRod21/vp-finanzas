import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api-client'

export const queryClient = new QueryClient({
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
