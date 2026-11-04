import { Button, Group, Modal, Stack, Text, type MantineColor } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { ReactNode } from 'react'

import { TextareaConContador } from '@/features/notas-credito/components/textarea-con-contador'
import { validarTextoObligatorio, validarTextoOpcional } from '@/features/notas-credito/validacion'

interface ModalAccionNotaProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion: ReactNode
  etiquetaConfirmar: string
  colorConfirmar: MantineColor
  /** Rechazar exige un comentario; aprobar y anular lo admiten como opcional. */
  comentarioObligatorio: boolean
  /** Mientras la acción está en curso no se puede cerrar ni volver a confirmar. */
  enviando: boolean
  /** Recibe el comentario sin espacios al inicio ni al final; vacío si no se escribió. */
  onConfirmar: (comentario: string) => void
}

/** Confirmación de una acción sobre una nota, con su comentario para el historial. */
export function ModalAccionNota({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  etiquetaConfirmar,
  colorConfirmar,
  comentarioObligatorio,
  enviando,
  onConfirmar,
}: ModalAccionNotaProps) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { comentario: '' },
    validate: {
      comentario: (valor: string) =>
        comentarioObligatorio
          ? validarTextoObligatorio(valor, 'Indica el motivo del rechazo: quedará registrado en el historial')
          : validarTextoOpcional(valor),
    },
    transformValues: (valores) => valores.comentario.trim(),
  })
  const comentario = form.useWatchValue('comentario')

  return (
    <Modal
      opened={abierto}
      onClose={onCerrar}
      title={titulo}
      centered
      closeOnClickOutside={!enviando}
      closeOnEscape={!enviando}
      withCloseButton={!enviando}
      // El formulario vuelve a quedar vacío al cerrar, para la siguiente acción.
      onExitTransitionEnd={form.reset}
    >
      <form onSubmit={form.onSubmit(onConfirmar)} noValidate>
        <Stack>
          <Text size="sm">{descripcion}</Text>
          <TextareaConContador
            label={comentarioObligatorio ? 'Motivo del rechazo' : 'Comentario (opcional)'}
            withAsterisk={comentarioObligatorio}
            data-autofocus
            longitud={comentario.length}
            readOnly={enviando}
            key={form.key('comentario')}
            {...form.getInputProps('comentario')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" color={colorConfirmar} autoContrast loading={enviando}>
              {etiquetaConfirmar}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
