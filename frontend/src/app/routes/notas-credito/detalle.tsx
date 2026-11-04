import { useParams } from 'react-router'

import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { DetalleNotaCredito } from '@/features/notas-credito/components/detalle-nota-credito'

/**
 * Un id válido es un entero positivo de hasta 9 dígitos (cabe en el INTEGER de la base de
 * datos): "/notas-credito/abc" o un número enorme no llegan a consultar la API.
 */
const ID_VALIDO = /^[1-9]\d{0,8}$/

export function DetalleNotaCreditoRoute() {
  const { notaId = '' } = useParams()
  if (!ID_VALIDO.test(notaId)) return <PaginaNoEncontrada />

  const id = Number(notaId)
  // key: al pasar de una nota a otra, el estado de la pantalla (modales, errores) empieza de cero.
  return <DetalleNotaCredito key={id} notaId={id} />
}
