import { Button, Stack } from '@mantine/core'
import { Link, useSearchParams } from 'react-router'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { paths } from '@/config/paths'
import { FiltroEstadoNotas } from '@/features/notas-credito/components/filtro-estado-notas'
import { TablaNotasCredito } from '@/features/notas-credito/components/tabla-notas-credito'
import { esEstadoNota, type EstadoNota } from '@/features/notas-credito/types'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeCrearNota } from '@/lib/authorization'
import { ROLES, type Rol } from '@/types/rol'

/** El listado ya llega filtrado por el backend según el rol; aquí solo se describe. */
const DESCRIPCION_SEGUN_ROL: Record<Rol, string> = {
  [ROLES.administrador]: 'Notas de crédito de todos los departamentos. Apruebas las que solicitan los Jefes.',
  [ROLES.jefeDepartamento]:
    'Notas de crédito de tu departamento. Apruebas las que solicitan tus colaboradores.',
  [ROLES.colaborador]: 'Las notas de crédito que solicitaste. Las aprueba el Jefe de tu departamento.',
}

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
        titulo={usuario.rol === ROLES.colaborador ? 'Mis notas de crédito' : 'Notas de crédito'}
        descripcion={DESCRIPCION_SEGUN_ROL[usuario.rol]}
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
