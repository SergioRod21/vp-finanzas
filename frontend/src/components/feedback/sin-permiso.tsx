import { MensajePagina } from '@/components/feedback/mensaje-pagina'

/**
 * Página 403: el rol del usuario no tiene acceso al módulo o a la acción. Sirve tanto
 * para las rutas protegidas por módulo como para un 403 que devuelva la API.
 */
export function SinPermiso() {
  return (
    <MensajePagina
      codigo="403"
      titulo="Sin permiso"
      descripcion="Tu rol no tiene acceso a esta sección del portal. Si crees que es un error, consulta con el administrador."
    />
  )
}
