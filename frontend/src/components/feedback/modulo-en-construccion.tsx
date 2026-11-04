import { Alert, Stack } from '@mantine/core'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'

/**
 * Contenido provisional de una pantalla que todavía no está implementada. En
 * app/router.tsx se reemplaza por la pantalla real cambiando solo el element de la ruta.
 */
export function ModuloEnConstruccion({ titulo }: { titulo: string }) {
  return (
    <Stack>
      <EncabezadoPagina titulo={titulo} />
      <Alert title="Módulo en construcción">
        Esta pantalla todavía no está disponible. Muy pronto podrás usarla desde aquí.
      </Alert>
    </Stack>
  )
}
