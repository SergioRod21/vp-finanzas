import { Button } from '@mantine/core'
import { isRouteErrorResponse, useRouteError } from 'react-router'

import { MensajePagina } from '@/components/feedback/mensaje-pagina'
import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'

/**
 * errorElement del router: se muestra si una pantalla lanza un error inesperado al
 * renderizar. El detalle técnico solo va a la consola, no a la pantalla.
 */
export function ErrorRuta() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PaginaNoEncontrada />
  }

  console.error(error)
  return (
    <MensajePagina
      titulo="Ocurrió un error inesperado"
      descripcion="La página no se pudo mostrar. Recarga la página o vuelve al inicio; si el problema continúa, avisa al equipo de soporte."
      acciones={
        <Button variant="subtle" onClick={() => window.location.reload()}>
          Recargar la página
        </Button>
      }
    />
  )
}
