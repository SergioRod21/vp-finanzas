import { useParams } from 'react-router'

import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { EnlaceCargo } from '@/features/cargos/components/enlace-cargo'
import { DetalleColaborador } from '@/features/colaboradores/components/detalle-colaborador'
import { parsearId } from '@/utils/identificadores'

/**
 * Las features no se importan entre sí: esta pantalla compone el detalle del colaborador
 * con el enlace al cargo, que pertenece a la feature de cargos.
 */
export function ColaboradorDetalleRoute() {
  const { colaboradorId } = useParams()
  const id = parsearId(colaboradorId)

  // Un identificador inválido ("abc") no puede existir: 404 sin consultar la API.
  if (id === null) return <PaginaNoEncontrada />
  return <DetalleColaborador colaboradorId={id} renderCargo={(cargo) => <EnlaceCargo {...cargo} />} />
}
