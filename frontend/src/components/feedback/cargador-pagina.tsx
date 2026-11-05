import { Center, Loader } from '@mantine/core'

/** Indicador de carga para una página completa o el área de contenido. */
export function CargadorPagina() {
  return (
    <Center mih="50vh" role="status" aria-label="Cargando">
      <Loader />
    </Center>
  )
}
