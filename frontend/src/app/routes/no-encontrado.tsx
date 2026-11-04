import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

import { paths } from '@/config/paths'

export function NoEncontradoRoute() {
  return (
    <Container size="sm" py="xl">
      <Stack align="flex-start">
        <Title order={2}>Página no encontrada</Title>
        <Text c="dimmed">La dirección que buscas no existe.</Text>
        <Button component={Link} to={paths.inicio} variant="light">
          Volver al inicio
        </Button>
      </Stack>
    </Container>
  )
}
