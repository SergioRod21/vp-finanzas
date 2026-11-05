import { Anchor, Box, Button, EmptyState, LoadingOverlay, Table, Text } from '@mantine/core'
import { Link, useNavigate } from 'react-router'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { paths } from '@/config/paths'
import { useNotas } from '@/features/notas-credito/api/obtener-notas'
import { BadgeEstadoNota } from '@/features/notas-credito/components/badge-estado-nota'
import { PRESENTACION_ESTADO, type EstadoNota } from '@/features/notas-credito/types'
import { mensajeDeError } from '@/lib/api-client'
import { formatearFecha, formatearMonto } from '@/utils/formatos'

interface TablaNotasCreditoProps {
  /** Filtro por estado, o null para todas. */
  estado: EstadoNota | null
  /** Quita el filtro: se ofrece cuando el filtro no devuelve ninguna nota. */
  onVerTodas: () => void
}

/**
 * Lista de notas de crédito en una tabla. Cada fila lleva al detalle: el número es un
 * enlace (accesible con el teclado) y, con el mouse, sirve toda la fila.
 */
export function TablaNotasCredito({ estado, onVerTodas }: TablaNotasCreditoProps) {
  const navigate = useNavigate()
  const notas = useNotas(estado)

  if (notas.isPending) return <CargadorPagina />

  if (notas.isError) {
    return (
      <ErrorCarga
        titulo="No se pudieron cargar las notas de crédito"
        mensaje={mensajeDeError(notas.error)}
        onReintentar={() => void notas.refetch()}
      />
    )
  }

  if (notas.data.length === 0) {
    return estado ? (
      <EmptyState
        title="No hay notas con este estado"
        description={`Ninguna nota de crédito está en estado «${PRESENTACION_ESTADO[estado].etiqueta}».`}
        py="xl"
      >
        <EmptyState.Actions>
          <Button variant="light" onClick={onVerTodas}>
            Ver todas las notas
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    ) : (
      <EmptyState
        title="Todavía no hay notas de crédito"
        description="Cuando se solicite una nota de crédito, aparecerá en esta lista."
        py="xl"
      />
    )
  }

  return (
    <Box pos="relative">
      {/* Al cambiar el filtro se ve la lista anterior, atenuada, hasta que llega la nueva. */}
      <LoadingOverlay visible={notas.isPlaceholderData} overlayProps={{ blur: 1 }} />
      <Table.ScrollContainer minWidth={960}>
        <Table highlightOnHover verticalSpacing="sm" tabularNums>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Número</Table.Th>
              <Table.Th>Fecha de creación</Table.Th>
              <Table.Th>Departamento</Table.Th>
              <Table.Th>Motivo</Table.Th>
              <Table.Th ta="right">Monto</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Solicitante</Table.Th>
              <Table.Th>Resolutor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {notas.data.map((nota) => {
              const rutaDetalle = paths.notasCredito.detalle(nota.nota_credito_id)
              return (
                <Table.Tr
                  key={nota.nota_credito_id}
                  onClick={() => void navigate(rutaDetalle)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Anchor
                      component={Link}
                      to={rutaDetalle}
                      fw={600}
                      style={{ whiteSpace: 'nowrap' }}
                      // La fila también navega: se evita una segunda navegación.
                      onClick={(evento) => evento.stopPropagation()}
                    >
                      {nota.numero}
                    </Anchor>
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatearFecha(nota.creada_en)}</Table.Td>
                  <Table.Td>{nota.departamento}</Table.Td>
                  <Table.Td>{nota.motivo}</Table.Td>
                  <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                    {formatearMonto(nota.monto)}
                  </Table.Td>
                  <Table.Td>
                    <BadgeEstadoNota estado={nota.estado} />
                  </Table.Td>
                  <Table.Td>{nota.solicitante}</Table.Td>
                  <Table.Td>
                    {nota.resolutor ?? (
                      <Text span c="dimmed" size="sm">
                        —
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Box>
  )
}
