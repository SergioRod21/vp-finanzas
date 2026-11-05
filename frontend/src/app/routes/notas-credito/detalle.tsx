import { useParams } from 'react-router'

import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { DetalleNotaCredito } from '@/features/notas-credito/components/detalle-nota-credito'
import { parsearId } from '@/utils/identificadores'

export function DetalleNotaCreditoRoute() {
  const { notaId } = useParams()
  const id = parsearId(notaId)

  // Un identificador inválido ("abc") no puede existir: 404 sin consultar la API.
  if (id === null) return <PaginaNoEncontrada />
  // key: al pasar de una nota a otra, el estado de la pantalla (modales, errores) empieza de cero.
  return <DetalleNotaCredito key={id} notaId={id} />
}
