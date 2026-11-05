import { Stack } from '@mantine/core'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { ListaCargos } from '@/features/cargos/components/lista-cargos'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { ROLES, type Rol } from '@/types/rol'

const DESCRIPCION_POR_ROL: Record<Rol, string> = {
  [ROLES.administrador]: 'Los cargos de cada departamento y las funciones que tienen asignadas.',
  [ROLES.jefeDepartamento]: 'Los cargos de tu departamento y las funciones que tienen asignadas.',
  [ROLES.colaborador]: 'Tu cargo y las funciones que tiene asignadas.',
}

export function CargosRoute() {
  const usuario = useUsuarioAutenticado()

  return (
    <Stack>
      <EncabezadoPagina titulo="Cargos y funciones" descripcion={DESCRIPCION_POR_ROL[usuario.rol]} />
      <ListaCargos />
    </Stack>
  )
}
