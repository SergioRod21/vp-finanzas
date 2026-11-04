import { Alert, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

import { useAnularNota } from '@/features/notas-credito/api/anular-nota'
import { useAprobarNota } from '@/features/notas-credito/api/aprobar-nota'
import { useRechazarNota } from '@/features/notas-credito/api/rechazar-nota'
import { ModalAccionNota } from '@/features/notas-credito/components/modal-accion-nota'
import { PRESENTACION_ESTADO, type EstadoNota, type NotaCredito } from '@/features/notas-credito/types'
import { mensajeDeError } from '@/lib/api-client'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeAnularNota, puedeResolverNota } from '@/lib/authorization'
import { formatearMonto } from '@/utils/formatos'

type Accion = 'aprobar' | 'rechazar' | 'anular'

/** Textos de cada acción y el estado al que lleva la nota (de ahí sale su color). */
const ACCIONES: Record<
  Accion,
  { etiqueta: string; infinitivo: string; estadoDestino: EstadoNota; comentarioObligatorio: boolean }
> = {
  aprobar: { etiqueta: 'Aprobar', infinitivo: 'aprobar', estadoDestino: 'APROBADA', comentarioObligatorio: false },
  rechazar: { etiqueta: 'Rechazar', infinitivo: 'rechazar', estadoDestino: 'RECHAZADA', comentarioObligatorio: true },
  anular: { etiqueta: 'Anular', infinitivo: 'anular', estadoDestino: 'ANULADA', comentarioObligatorio: false },
}

function descripcionDeAccion(accion: Accion, nota: NotaCredito): string {
  const resumen = `la nota ${nota.numero} por ${formatearMonto(nota.monto)}`
  switch (accion) {
    case 'aprobar':
      return `Vas a aprobar ${resumen}. Pasará a estado Aprobada y ya no admitirá cambios.`
    case 'rechazar':
      return `Vas a rechazar ${resumen}. Pasará a estado Rechazada y ya no admitirá cambios.`
    case 'anular':
      return `Vas a anular tu solicitud: ${resumen}. Pasará a estado Anulada y ya no se podrá aprobar ni rechazar.`
  }
}

interface ErrorDeAccion {
  titulo: string
  mensaje: string
}

/**
 * Acciones disponibles sobre la nota para el usuario actual, según lib/authorization.
 * Si no tiene ninguna (por ejemplo, la nota ya está en un estado final), no muestra nada,
 * salvo el error de la última acción fallida.
 *
 * Cada acción se confirma en un modal. Si la API la rechaza (por ejemplo, un 409 porque
 * otra persona ya resolvió la nota), se muestra su mensaje y la nota ya llega refrescada
 * desde la mutación.
 */
export function AccionesNotaCredito({ nota }: { nota: NotaCredito }) {
  const usuario = useUsuarioAutenticado()
  const aprobar = useAprobarNota(nota.nota_credito_id)
  const rechazar = useRechazarNota(nota.nota_credito_id)
  const anular = useAnularNota(nota.nota_credito_id)

  const [modalAbierto, modal] = useDisclosure()
  const [accion, setAccion] = useState<Accion>('aprobar')
  const [error, setError] = useState<ErrorDeAccion | null>(null)

  const puedeResolver = puedeResolverNota(usuario, nota)
  const puedeAnular = puedeAnularNota(usuario, nota)
  const enviando = aprobar.isPending || rechazar.isPending || anular.isPending

  const abrir = (nueva: Accion) => {
    setAccion(nueva)
    setError(null)
    modal.open()
  }

  const confirmar = (comentario: string) => {
    // El botón ya queda deshabilitado mientras carga; esto cubre cualquier otro envío del formulario.
    if (enviando) return
    const { estadoDestino, infinitivo } = ACCIONES[accion]
    const callbacks = {
      onSuccess: (actualizada: NotaCredito) => {
        modal.close()
        notifications.show({
          color: PRESENTACION_ESTADO[estadoDestino].color,
          title: `Nota ${actualizada.numero} ${PRESENTACION_ESTADO[actualizada.estado].etiqueta.toLowerCase()}`,
          message: 'El cambio quedó registrado en el historial.',
        })
      },
      onError: (causa: Error) => {
        modal.close()
        setError({ titulo: `No se pudo ${infinitivo} la nota ${nota.numero}`, mensaje: mensajeDeError(causa) })
      },
    }
    // Sin comentario, aprobar y anular no envían cuerpo.
    const comentarioOpcional = comentario === '' ? undefined : comentario
    if (accion === 'aprobar') aprobar.mutate(comentarioOpcional, callbacks)
    else if (accion === 'rechazar') rechazar.mutate(comentario, callbacks)
    else anular.mutate(comentarioOpcional, callbacks)
  }

  const botones: Accion[] = []
  if (puedeResolver) botones.push('aprobar', 'rechazar')
  if (puedeAnular) botones.push('anular')

  if (botones.length === 0 && !error) return null

  const configuracion = ACCIONES[accion]

  return (
    <Stack gap="sm">
      {error && (
        <Alert color="red" title={error.titulo} role="alert" withCloseButton onClose={() => setError(null)}>
          <Text size="sm">{error.mensaje}</Text>
          <Text size="sm" mt={4}>
            La nota se actualizó con su estado actual.
          </Text>
        </Alert>
      )}

      {botones.length > 0 && (
        <Paper withBorder p="md">
          <Group justify="space-between" gap="sm">
            <Text size="sm">
              {puedeResolver
                ? 'Esta nota está pendiente de tu aprobación.'
                : 'Puedes anular tu solicitud mientras siga pendiente.'}
            </Text>
            <Group gap="sm">
              {botones.map((boton) => (
                <Button
                  key={boton}
                  color={PRESENTACION_ESTADO[ACCIONES[boton].estadoDestino].color}
                  variant={boton === 'aprobar' ? 'filled' : 'outline'}
                  autoContrast
                  disabled={enviando}
                  onClick={() => abrir(boton)}
                >
                  {ACCIONES[boton].etiqueta}
                </Button>
              ))}
            </Group>
          </Group>
        </Paper>
      )}

      <ModalAccionNota
        abierto={modalAbierto}
        onCerrar={modal.close}
        titulo={`${configuracion.etiqueta} la nota ${nota.numero}`}
        descripcion={descripcionDeAccion(accion, nota)}
        etiquetaConfirmar={configuracion.etiqueta}
        colorConfirmar={PRESENTACION_ESTADO[configuracion.estadoDestino].color}
        comentarioObligatorio={configuracion.comentarioObligatorio}
        enviando={enviando}
        onConfirmar={confirmar}
      />
    </Stack>
  )
}
