import { Group, Skeleton, Stack, Text, Timeline, VisuallyHidden } from '@mantine/core'

import { ErrorCarga } from '@/components/feedback/error-carga'
import { useHistorialNota } from '@/features/notas-credito/api/obtener-historial'
import { BadgeEstadoNota } from '@/features/notas-credito/components/badge-estado-nota'
import { ETIQUETA_ACCION, PRESENTACION_ESTADO, type EventoHistorialNota } from '@/features/notas-credito/types'
import { mensajeDeError } from '@/lib/api-client'
import { formatearFechaHora } from '@/utils/formatos'

/** Estado anterior → estado nuevo. En la creación solo hay estado nuevo. */
function TransicionEstado({ evento }: { evento: EventoHistorialNota }) {
  return (
    <Group gap={6} wrap="nowrap">
      {evento.estado_anterior && (
        <>
          <BadgeEstadoNota estado={evento.estado_anterior} size="sm" />
          <Text span size="sm" c="dimmed" aria-hidden>
            →
          </Text>
          <VisuallyHidden>pasó a</VisuallyHidden>
        </>
      )}
      <BadgeEstadoNota estado={evento.estado_nuevo} size="sm" />
    </Group>
  )
}

/** Historial de auditoría de una nota: quién hizo qué, cuándo y con qué comentario. */
export function HistorialNotaCredito({ notaId }: { notaId: number }) {
  const historial = useHistorialNota(notaId)

  if (historial.isPending) {
    return (
      <Stack gap="sm" role="status" aria-label="Cargando el historial">
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width="40%" />
        <Skeleton height={16} width="60%" mt="md" />
        <Skeleton height={12} width="40%" />
      </Stack>
    )
  }

  if (historial.isError) {
    return (
      <ErrorCarga
        titulo="No se pudo cargar el historial"
        mensaje={mensajeDeError(historial.error)}
        onReintentar={() => void historial.refetch()}
      />
    )
  }

  if (historial.data.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Esta nota todavía no tiene eventos registrados.
      </Text>
    )
  }

  return (
    <Timeline active={historial.data.length - 1} bulletSize={16} lineWidth={2}>
      {historial.data.map((evento) => (
        <Timeline.Item
          key={`${evento.accion}-${evento.ocurrido_en}`}
          title={ETIQUETA_ACCION[evento.accion]}
          color={PRESENTACION_ESTADO[evento.estado_nuevo].color}
        >
          <Stack gap={6} mt={4}>
            <Text size="sm">
              {evento.usuario}
              <Text span size="sm" c="dimmed">
                {' · '}
                <time dateTime={evento.ocurrido_en}>{formatearFechaHora(evento.ocurrido_en)}</time>
              </Text>
            </Text>
            <TransicionEstado evento={evento} />
            {evento.comentario && (
              <Text size="sm" fs="italic" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                «{evento.comentario}»
              </Text>
            )}
          </Stack>
        </Timeline.Item>
      ))}
    </Timeline>
  )
}
