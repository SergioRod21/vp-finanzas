import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { entradasVisibles } from '@/config/modulos'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'

export function InicioRoute() {
  const usuario = useUsuarioAutenticado()

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <EncabezadoPagina titulo={`Hola, ${usuario.nombre}`} descripcion="Te damos la bienvenida al portal de la Vicepresidencia de Finanzas." />
        <Group gap="xs">
          <Badge variant="light">{usuario.rol}</Badge>
          <Badge variant="outline">{usuario.departamento}</Badge>
        </Group>
      </Stack>

      <Stack gap="sm">
        <Title order={3} size="h4">
          Accesos directos
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {entradasVisibles(usuario.rol).map((entrada) => (
            <Card key={entrada.modulo} component={Link} to={entrada.ruta} withBorder padding="lg">
              <Text fw={600} c="marca.8">
                {entrada.etiqueta}
              </Text>
              <Text size="sm" c="dimmed">
                {entrada.descripcion}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  )
}
