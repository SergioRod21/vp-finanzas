import { Anchor, AppShell, Box, Burger, Button, Group, Stack, Text, Title, type BoxProps } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link, Outlet } from 'react-router'

import { NavegacionLateral } from '@/components/layout/navegacion-lateral'
import { paths } from '@/config/paths'
import { useCerrarSesion } from '@/lib/auth/logout'
import type { UsuarioActual } from '@/lib/auth/types'
import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'

/** Nombre, rol y departamento del usuario de la sesión. */
function DatosUsuario({ usuario, ...props }: { usuario: UsuarioActual } & BoxProps) {
  return (
    <Box {...props}>
      <Text size="sm" fw={600} lh={1.3}>
        {usuario.nombre} {usuario.apellido}
      </Text>
      <Text size="xs" lh={1.3} opacity={0.85}>
        {usuario.rol} · {usuario.departamento}
      </Text>
    </Box>
  )
}

/**
 * Estructura de las pantallas con sesión: encabezado con el portal, el usuario y el
 * botón de cerrar sesión; menú lateral con los módulos del rol (hamburguesa en
 * pantallas pequeñas); y el contenido de la ruta actual.
 */
export function LayoutPrincipal() {
  const usuario = useUsuarioAutenticado()
  const cerrarSesion = useCerrarSesion()
  const [menuAbierto, { toggle: alternarMenu, close: cerrarMenu }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !menuAbierto } }}
      padding="md"
    >
      <AppShell.Header bg="marca.8" c="white" withBorder={false}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={menuAbierto}
              onClick={alternarMenu}
              hiddenFrom="sm"
              size="sm"
              color="white"
              aria-label={menuAbierto ? 'Cerrar el menú' : 'Abrir el menú'}
            />
            <Anchor component={Link} to={paths.inicio} c="white" underline="never" onClick={cerrarMenu}>
              <Title order={1} size="h3">
                VP Finanzas
              </Title>
            </Anchor>
          </Group>
          <Group gap="md" wrap="nowrap">
            <DatosUsuario usuario={usuario} ta="right" visibleFrom="sm" />
            <Button
              variant="white"
              size="xs"
              loading={cerrarSesion.isPending}
              onClick={() => cerrarSesion.mutate()}
            >
              Cerrar sesión
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="md">
          {/* En pantallas pequeñas el encabezado no tiene espacio para los datos del usuario. */}
          <DatosUsuario usuario={usuario} hiddenFrom="sm" />
          <NavegacionLateral rol={usuario.rol} onNavegar={cerrarMenu} />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
