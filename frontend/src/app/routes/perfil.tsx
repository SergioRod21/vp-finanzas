import { Stack } from '@mantine/core'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { FichaPerfil } from '@/features/perfil/components/ficha-perfil'

export function PerfilRoute() {
  return (
    <Stack>
      <EncabezadoPagina titulo="Mi perfil" descripcion="Tus datos laborales y tu rol en el portal." />
      <FichaPerfil />
    </Stack>
  )
}
