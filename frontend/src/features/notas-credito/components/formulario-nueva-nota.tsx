import { Alert, Button, Group, NumberInput, Select, Stack, Text } from '@mantine/core'
import { isNotEmpty, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Link } from 'react-router'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { paths } from '@/config/paths'
import { useCrearNota } from '@/features/notas-credito/api/crear-nota'
import { useMotivos } from '@/features/notas-credito/api/obtener-motivos'
import { TextareaConContador } from '@/features/notas-credito/components/textarea-con-contador'
import { PRESENTACION_ESTADO, type NotaCredito, type NuevaNotaCredito } from '@/features/notas-credito/types'
import {
  DECIMALES_MONTO,
  montoComoTexto,
  validarMonto,
  validarTextoObligatorio,
} from '@/features/notas-credito/validacion'
import { mensajeDeError } from '@/lib/api-client'
import { formatearMonto } from '@/utils/formatos'

interface ValoresFormulario {
  /** El Select trabaja con texto: el id se convierte a number al enviar. */
  motivo: string | null
  /** NumberInput entrega number, o string si está vacío o tiene muchos dígitos. */
  monto: number | string
  detalle: string
}

interface FormularioNuevaNotaProps {
  /** Se llama con la nota creada, para navegar a su detalle. */
  onCreada: (nota: NotaCredito) => void
}

/** Solicitud de una nota de crédito. La validación refleja las reglas del backend. */
export function FormularioNuevaNota({ onCreada }: FormularioNuevaNotaProps) {
  const motivos = useMotivos()
  const crearNota = useCrearNota()

  const form = useForm<ValoresFormulario, NuevaNotaCredito>({
    mode: 'uncontrolled',
    initialValues: { motivo: null, monto: '', detalle: '' },
    validate: {
      motivo: isNotEmpty('Selecciona el motivo de la nota'),
      monto: validarMonto,
      detalle: (valor) => validarTextoObligatorio(valor, 'Describe el detalle de la nota'),
    },
    transformValues: (valores) => ({
      motivo_nota_credito_id: Number(valores.motivo),
      // Como texto, para no perder precisión en montos grandes.
      monto: montoComoTexto(valores.monto),
      detalle: valores.detalle.trim(),
    }),
  })

  // Valores observados para el contador de caracteres y la vista previa del monto.
  const detalle = form.useWatchValue('detalle')
  const monto = form.useWatchValue('monto')
  const montoValido = validarMonto(monto) === null

  if (motivos.isPending) return <CargadorPagina />

  if (motivos.isError) {
    return (
      <ErrorCarga
        titulo="No se pudieron cargar los motivos"
        mensaje={mensajeDeError(motivos.error)}
        onReintentar={() => void motivos.refetch()}
      />
    )
  }

  const enviar = (datos: NuevaNotaCredito) =>
    crearNota.mutate(datos, {
      onSuccess: (nota) => {
        notifications.show({
          color: PRESENTACION_ESTADO[nota.estado].color,
          title: 'Solicitud creada',
          message: `La nota ${nota.numero} quedó pendiente de aprobación.`,
        })
        onCreada(nota)
      },
    })

  return (
    <form onSubmit={form.onSubmit(enviar)} noValidate>
      <Stack>
        {crearNota.isError && (
          <Alert color="red" title="No se pudo crear la solicitud" role="alert">
            {mensajeDeError(crearNota.error)}
          </Alert>
        )}

        <Select
          label="Motivo"
          placeholder="Selecciona un motivo"
          data={motivos.data.map((motivo) => ({
            value: String(motivo.motivo_nota_credito_id),
            label: motivo.descripcion,
          }))}
          searchable
          nothingFoundMessage="Ningún motivo coincide con la búsqueda"
          withAsterisk
          key={form.key('motivo')}
          {...form.getInputProps('motivo')}
        />

        <NumberInput
          label="Monto"
          placeholder="0,00"
          decimalScale={DECIMALES_MONTO}
          decimalSeparator=","
          thousandSeparator="."
          allowNegative={false}
          hideControls
          inputMode="decimal"
          withAsterisk
          description={montoValido ? `Se registrará como ${formatearMonto(montoComoTexto(monto))}` : undefined}
          inputWrapperOrder={['label', 'input', 'description', 'error']}
          key={form.key('monto')}
          {...form.getInputProps('monto')}
        />

        <TextareaConContador
          label="Detalle"
          placeholder="Cliente, factura afectada y razón de la nota de crédito"
          withAsterisk
          longitud={detalle.length}
          key={form.key('detalle')}
          {...form.getInputProps('detalle')}
        />

        <Text size="sm" c="dimmed">
          La solicitud se registra para tu departamento y queda pendiente hasta que el Administrador la apruebe
          o la rechace.
        </Text>

        <Group justify="flex-end">
          <Button component={Link} to={paths.notasCredito.lista} variant="default">
            Cancelar
          </Button>
          <Button type="submit" loading={crearNota.isPending}>
            Solicitar nota de crédito
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
