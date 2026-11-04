import { Anchor, Avatar, Badge, Card, DataList, Divider, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

import { EstadoActivo } from '@/components/datos/estado-activo'
import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { paths } from '@/config/paths'
import { usePerfil } from '@/features/perfil/api/obtener-perfil'
import type { Perfil } from '@/features/perfil/types'
import { mensajeDeError } from '@/lib/api-client'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeVerModulo } from '@/lib/authorization'
import { formatearFecha } from '@/utils/formatos'

/** El cargo, con enlace a su detalle si el rol puede ver el módulo de cargos. */
function CargoPropio({ perfil }: { perfil: Perfil }) {
  const usuario = useUsuarioAutenticado()
  if (!puedeVerModulo(usuario.rol, 'cargos')) return perfil.cargo
  return (
    <Anchor component={Link} to={paths.cargos.detalle(usuario.cargo_id)}>
      {perfil.cargo}
    </Anchor>
  )
}

function DatosPerfil({ perfil }: { perfil: Perfil }) {
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`

  return (
    <Card withBorder padding="xl">
      <Stack gap="lg">
        <Group gap="md" wrap="nowrap" align="flex-start">
          <Avatar name={nombreCompleto} color="marca" size="lg" />
          <Stack gap={4}>
            <Title order={3}>{nombreCompleto}</Title>
            <Text c="dimmed">{perfil.correo}</Text>
            <Group gap="xs">
              <Badge variant="filled">{perfil.rol}</Badge>
              <EstadoActivo activo={perfil.activo} />
            </Group>
          </Stack>
        </Group>

        <Divider />

        <DataList labelWidth={160} withDivider>
          <DataList.Item>
            <DataList.ItemLabel>Cargo</DataList.ItemLabel>
            <DataList.ItemValue>
              <CargoPropio perfil={perfil} />
            </DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Nivel</DataList.ItemLabel>
            <DataList.ItemValue>{perfil.nivel}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Departamento</DataList.ItemLabel>
            <DataList.ItemValue>{perfil.departamento}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>País</DataList.ItemLabel>
            <DataList.ItemValue>{perfil.pais}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Fecha de ingreso</DataList.ItemLabel>
            <DataList.ItemValue>{formatearFecha(perfil.fecha_ingreso)}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Rol en el portal</DataList.ItemLabel>
            <DataList.ItemValue>{perfil.rol}</DataList.ItemValue>
          </DataList.Item>
        </DataList>
      </Stack>
    </Card>
  )
}

/** Ficha del usuario autenticado, con sus estados de carga y de error. */
export function FichaPerfil() {
  const perfil = usePerfil()

  if (perfil.isPending) return <CargadorPagina />
  if (perfil.isError) {
    return (
      <ErrorCarga
        titulo="No se pudo cargar tu perfil"
        mensaje={mensajeDeError(perfil.error)}
        onReintentar={() => void perfil.refetch()}
      />
    )
  }
  return <DatosPerfil perfil={perfil.data} />
}
