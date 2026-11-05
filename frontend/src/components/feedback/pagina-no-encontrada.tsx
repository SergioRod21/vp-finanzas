import { MensajePagina } from '@/components/feedback/mensaje-pagina'

/** Página 404: la dirección no corresponde a ninguna ruta del portal. */
export function PaginaNoEncontrada() {
  return <MensajePagina codigo="404" titulo="Página no encontrada" descripcion="La dirección que buscas no existe." />
}
