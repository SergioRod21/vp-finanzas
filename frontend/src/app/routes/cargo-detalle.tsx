import { useParams } from 'react-router'

import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { DetalleCargo } from '@/features/cargos/components/detalle-cargo'
import { parsearId } from '@/utils/identificadores'

export function CargoDetalleRoute() {
  const { cargoId } = useParams()
  const id = parsearId(cargoId)

  // Un identificador inválido ("abc") no puede existir: 404 sin consultar la API.
  if (id === null) return <PaginaNoEncontrada />
  return <DetalleCargo cargoId={id} />
}
