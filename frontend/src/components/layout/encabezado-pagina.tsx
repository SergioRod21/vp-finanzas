import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

interface EncabezadoPaginaProps {
  titulo: string
  descripcion?: ReactNode
  /** Botones a la derecha del título, por ejemplo "Nueva solicitud". */
  acciones?: ReactNode
}

/** Título de una pantalla, con descripción y acciones opcionales. */
export function EncabezadoPagina({ titulo, descripcion, acciones }: EncabezadoPaginaProps) {
  return (
    <Group justify="space-between" align="flex-start" wrap="wrap">
      <Stack gap={4}>
        <Title order={2} c="marca.8">
          {titulo}
        </Title>
        {descripcion && <Text c="dimmed">{descripcion}</Text>}
      </Stack>
      {acciones && <Group>{acciones}</Group>}
    </Group>
  )
}
