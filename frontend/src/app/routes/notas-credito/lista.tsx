import { Button, Stack } from '@mantine/core'
import { Link, useSearchParams } from 'react-router'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { paths } from '@/config/paths'
import { FiltroEstadoNotas } from '@/features/notas-credito/components/filtro-estado-notas'
import { TablaNotasCredito } from '@/features/notas-credito/components/tabla-notas-credito'
import { esEstadoNota, type EstadoNota } from '@/features/notas-credito/types'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeCrearNota } from '@/lib/authorization'

/** Parámetro de la URL con el filtro: el mismo nombre que usa el backend (?estado=). */
const PARAMETRO_ESTADO = 'estado'

export function NotasCreditoRoute() {
  const usuario = useUsuarioAutenticado()
  // El filtro vive en la URL: se conserva al recargar y se puede compartir el enlace.
  // Un valor desconocido en la URL equivale a no filtrar.
  const [parametros, setParametros] = useSearchParams()
  const valorParametro = parametros.get(PARAMETRO_ESTADO)
  const estado = esEstadoNota(valorParametro) ? valorParametro : null

  const cambiarEstado = (nuevoEstado: EstadoNota | null) =>
    setParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (nuevoEstado) nuevos.set(PARAMETRO_ESTADO, nuevoEstado)
        else nuevos.delete(PARAMETRO_ESTADO)
        return nuevos
      },
      { replace: true },
    )

  return (
    <Stack gap="lg">
      <EncabezadoPagina
        titulo="Notas de crédito"
        descripcion="Solicitudes de notas de crédito, su estado y quién las resolvió."
        acciones={
          puedeCrearNota(usuario) ? (
            <Button component={Link} to={paths.notasCredito.nueva}>
              Nueva nota de crédito
            </Button>
          ) : undefined
        }
      />
      <FiltroEstadoNotas estado={estado} onCambiar={cambiarEstado} />
      <TablaNotasCredito estado={estado} onVerTodas={() => cambiarEstado(null)} />
    </Stack>
  )
}
