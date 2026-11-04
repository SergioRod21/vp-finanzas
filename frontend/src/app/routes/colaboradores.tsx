import { Stack } from '@mantine/core'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { ListaColaboradores } from '@/features/colaboradores/components/lista-colaboradores'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { ROLES, type Rol } from '@/types/rol'

const DESCRIPCION_POR_ROL: Record<Rol, string> = {
  [ROLES.administrador]: 'Las personas que trabajan en la Vicepresidencia, en todos los departamentos.',
  [ROLES.jefeDepartamento]: 'Las personas que trabajan en tu departamento.',
  [ROLES.colaborador]: 'Los datos de contacto de tus compañeros de departamento.',
}

export function ColaboradoresRoute() {
  const usuario = useUsuarioAutenticado()

  return (
    <Stack>
      <EncabezadoPagina titulo="Colaboradores" descripcion={DESCRIPCION_POR_ROL[usuario.rol]} />
      <ListaColaboradores />
    </Stack>
  )
}
