import { Badge, Card, Container, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

/** Pantalla temporal: comprueba que el frontend llega a la API a través del proxy. */
export function InicioRoute() {
  const salud = useQuery({
    queryKey: ['health'],
    queryFn: () => api<{ status: string }>('/health'),
  })

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>VP Finanzas</Title>
        <Card withBorder>
          <Group justify="space-between">
            <Text>Conexión con la API</Text>
            {salud.isPending && <Loader size="sm" />}
            {salud.isSuccess && <Badge color="teal">Disponible</Badge>}
            {salud.isError && <Badge color="red">No disponible</Badge>}
          </Group>
        </Card>
      </Stack>
    </Container>
  )
}
