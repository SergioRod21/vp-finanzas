import { Anchor, Grid, Group, Paper, Stack, Title } from '@mantine/core'
import { Link } from 'react-router'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { SinPermiso } from '@/components/feedback/sin-permiso'
import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { paths } from '@/config/paths'
import { useNota } from '@/features/notas-credito/api/obtener-nota'
import { AccionesNotaCredito } from '@/features/notas-credito/components/acciones-nota-credito'
import { BadgeEstadoNota } from '@/features/notas-credito/components/badge-estado-nota'
import { DatosNotaCredito } from '@/features/notas-credito/components/datos-nota-credito'
import { HistorialNotaCredito } from '@/features/notas-credito/components/historial-nota-credito'
import { mensajeDeError } from '@/lib/api-client'
import { esNoEncontrado, esSinPermiso } from '@/lib/errores-api'
import { formatearFecha } from '@/utils/formatos'

/**
 * Detalle de una nota: sus datos, las acciones que el usuario puede realizar y el
 * historial. Una nota que no existe o es de otro departamento (404) se muestra como
 * página no encontrada, igual que una dirección inexistente.
 */
export function DetalleNotaCredito({ notaId }: { notaId: number }) {
  const consulta = useNota(notaId)
  const nota = consulta.data

  // Si la nota ya está en pantalla, un error al refrescarla no la oculta.
  if (!nota) {
    if (!consulta.isError) return <CargadorPagina />
    if (esNoEncontrado(consulta.error)) return <PaginaNoEncontrada />
    if (esSinPermiso(consulta.error)) return <SinPermiso />
    return (
      <ErrorCarga
        titulo="No se pudo cargar la nota de crédito"
        mensaje={mensajeDeError(consulta.error)}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  return (
    <Stack gap="lg">
      <Anchor component={Link} to={paths.notasCredito.lista} size="sm">
        ← Volver a las notas de crédito
      </Anchor>

      <Group justify="space-between" align="flex-start">
        <EncabezadoPagina
          titulo={`Nota de crédito ${nota.numero}`}
          descripcion={`Solicitada por ${nota.solicitante} el ${formatearFecha(nota.creada_en)} · ${nota.departamento}`}
        />
        <BadgeEstadoNota estado={nota.estado} size="lg" />
      </Group>

      <AccionesNotaCredito nota={nota} />

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="lg" h="100%">
            <Stack>
              <Title order={3} size="h4">
                Datos de la solicitud
              </Title>
              <DatosNotaCredito nota={nota} />
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="lg" h="100%">
            <Stack>
              <Title order={3} size="h4">
                Historial
              </Title>
              <HistorialNotaCredito notaId={nota.nota_credito_id} />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
