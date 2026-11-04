import { Anchor } from '@mantine/core'
import { Link } from 'react-router'

import { paths } from '@/config/paths'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeVerCargo, puedeVerModulo } from '@/lib/authorization'

interface EnlaceCargoProps {
  cargoId: number
  titulo: string
  /** Departamento del cargo, si se conoce; null si no (el resumen de un colaborador no lo trae). */
  departamentoId: number | null
}

/**
 * Título de un cargo con enlace a su detalle, si el usuario puede verlo según la matriz
 * de permisos; si no, solo el título.
 */
export function EnlaceCargo({ cargoId, titulo, departamentoId }: EnlaceCargoProps) {
  const usuario = useUsuarioAutenticado()
  const visible =
    puedeVerModulo(usuario.rol, 'cargos') &&
    puedeVerCargo(usuario, { cargo_id: cargoId, departamento_id: departamentoId })
  if (!visible) return titulo

  return (
    <Anchor component={Link} to={paths.cargos.detalle(cargoId)}>
      {titulo}
    </Anchor>
  )
}
