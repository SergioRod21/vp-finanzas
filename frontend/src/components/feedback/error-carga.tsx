import { Alert, Button, Stack, Text } from '@mantine/core'

interface ErrorCargaProps {
  titulo?: string
  mensaje: string
  /** Si se indica, muestra el botón "Reintentar". */
  onReintentar?: () => void
}

/** Error al cargar datos de la API, con la opción de reintentar. */
export function ErrorCarga({ titulo = 'No se pudo cargar la información', mensaje, onReintentar }: ErrorCargaProps) {
  return (
    <Alert color="red" title={titulo} role="alert">
      <Stack align="flex-start" gap="sm">
        <Text size="sm">{mensaje}</Text>
        {onReintentar && (
          <Button size="xs" variant="light" color="red" onClick={onReintentar}>
            Reintentar
          </Button>
        )}
      </Stack>
    </Alert>
  )
}
