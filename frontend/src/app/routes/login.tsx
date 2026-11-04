import { Box, Center, Paper, Stack, Text, Title } from '@mantine/core'
import { useNavigate } from 'react-router'

import { FormularioLogin } from '@/features/auth/components/formulario-login'
import { useRutaDeOrigen } from '@/lib/auth/ruta-origen'

export function LoginRoute() {
  const navigate = useNavigate()
  const rutaDeOrigen = useRutaDeOrigen()

  return (
    <Center mih="100vh" p="md" bg="gray.0">
      <Paper withBorder shadow="sm" radius="md" w="100%" maw={420} style={{ overflow: 'hidden' }}>
        <Box bg="marca.8" c="white" px="xl" py="lg">
          <Title order={1} size="h2">
            VP Finanzas
          </Title>
          <Text size="sm" opacity={0.85}>
            Portal de la Vicepresidencia de Finanzas
          </Text>
        </Box>
        <Stack p="xl">
          <Text fw={600}>Inicia sesión con tu correo corporativo</Text>
          {/* flushSync: la navegación se aplica antes de que RutaPublica reaccione a la nueva sesión. */}
          <FormularioLogin onExito={() => void navigate(rutaDeOrigen, { replace: true, flushSync: true })} />
        </Stack>
      </Paper>
    </Center>
  )
}
