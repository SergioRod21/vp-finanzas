import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { paths } from '@/config/paths'

interface MensajePaginaProps {
  /** Código breve sobre el título, por ejemplo "404". */
  codigo?: string
  titulo: string
  descripcion: ReactNode
  /** Acciones adicionales junto a "Volver al inicio". */
  acciones?: ReactNode
}

/** Página de estado (no encontrada, sin permiso, error): título, explicación y salida al inicio. */
export function MensajePagina({ codigo, titulo, descripcion, acciones }: MensajePaginaProps) {
  return (
    <Container size="sm" py="xl">
      <Stack align="flex-start">
        {codigo && (
          <Text fw={700} c="marca.6" size="sm">
            {codigo}
          </Text>
        )}
        <Title order={2}>{titulo}</Title>
        <Text c="dimmed">{descripcion}</Text>
        <Group>
          <Button component={Link} to={paths.inicio} variant="light">
            Volver al inicio
          </Button>
          {acciones}
        </Group>
      </Stack>
    </Container>
  )
}
