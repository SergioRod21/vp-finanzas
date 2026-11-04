import { Anchor } from '@mantine/core'
import { Link } from 'react-router'

import { paths } from '@/config/paths'
import { useCargos } from '@/features/cargos/api/listar-cargos'
import type { CargoFicha } from '@/features/cargos/types'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeVerModulo } from '@/lib/authorization'

interface EnlaceCargoProps {
  /** Título del cargo, tal como lo muestran otras pantallas (por ejemplo, la ficha de un colaborador). */
  titulo: string
  /** Departamento del cargo, si se conoce; null si no (el resumen de un colaborador no lo trae). */
  departamentoId: number | null
}

/**
 * El cargo que coincide con el título (y el departamento, si se conoce) entre los que el
 * usuario puede ver. Solo hay enlace si hay exactamente una coincidencia: el título no es
 * único en la base de datos, y ante la duda es mejor no enlazar a un cargo equivocado.
 */
function buscarCargo(cargos: readonly CargoFicha[], { titulo, departamentoId }: EnlaceCargoProps): CargoFicha | null {
  const coincidencias = cargos.filter(
    (cargo) => cargo.titulo === titulo && (departamentoId === null || cargo.departamento_id === departamentoId),
  )
  return coincidencias.length === 1 ? coincidencias[0] : null
}

function EnlaceSiEsVisible(props: EnlaceCargoProps) {
  // La lista sin filtrar es exactamente lo que el usuario puede ver según su rol.
  const cargos = useCargos(null)
  const cargo = cargos.data ? buscarCargo(cargos.data, props) : null
  if (!cargo) return props.titulo

  return (
    <Anchor component={Link} to={paths.cargos.detalle(cargo.cargo_id)}>
      {props.titulo}
    </Anchor>
  )
}

/**
 * Título de un cargo con enlace a su detalle, si el usuario puede verlo. Mientras se
 * cargan los cargos, o si no está a su alcance, muestra solo el título.
 *
 * La API de colaboradores no envía el cargo_id, así que el cargo se busca por título
 * entre los que devuelve GET /api/cargos.
 */
export function EnlaceCargo(props: EnlaceCargoProps) {
  const usuario = useUsuarioAutenticado()
  if (!puedeVerModulo(usuario.rol, 'cargos')) return props.titulo
  return <EnlaceSiEsVisible {...props} />
}
