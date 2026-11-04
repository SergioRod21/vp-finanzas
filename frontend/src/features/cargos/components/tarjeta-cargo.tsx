import { Anchor, Badge, Card, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'

import { paths } from '@/config/paths'
import { FuncionesCargo } from '@/features/cargos/components/funciones-cargo'
import type { CargoFicha } from '@/features/cargos/types'

/** Tarjeta de un cargo en la lista: título con enlace al detalle, nivel, departamento y funciones. */
export function TarjetaCargo({ cargo }: { cargo: CargoFicha }) {
  return (
    <Card withBorder padding="lg" component="article" aria-label={cargo.titulo}>
      <Stack gap="sm">
        <Anchor component={Link} to={paths.cargos.detalle(cargo.cargo_id)} fw={600} size="lg">
          {cargo.titulo}
        </Anchor>
        <Group gap="xs">
          <Badge variant="light">{cargo.nivel}</Badge>
          <Badge variant="outline">{cargo.departamento}</Badge>
        </Group>
        <Stack gap={4}>
          <Text size="sm" fw={600}>
            Funciones
          </Text>
          <FuncionesCargo funciones={cargo.funciones} />
        </Stack>
      </Stack>
    </Card>
  )
}
