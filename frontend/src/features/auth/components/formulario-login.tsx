import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { hasLength, isEmail, isNotEmpty, useForm } from '@mantine/form'

import { mensajeDeError } from '@/lib/api-client'
import { useIniciarSesion } from '@/lib/auth/login'
import type { CredencialesLogin, UsuarioActual } from '@/lib/auth/types'

// Mismos límites que LoginRequest en el backend (app/models/auth.py).
const MAX_CORREO = 254
const MAX_PASSWORD = 128

interface FormularioLoginProps {
  /** Se llama con el usuario después de un login correcto, para navegar. */
  onExito: (usuario: UsuarioActual) => void
}

export function FormularioLogin({ onExito }: FormularioLoginProps) {
  const iniciarSesion = useIniciarSesion()

  const form = useForm<CredencialesLogin>({
    mode: 'uncontrolled',
    initialValues: { correo: '', password: '' },
    validate: {
      correo: (valor) =>
        isNotEmpty('Ingresa tu correo')(valor.trim()) ??
        isEmail('Ingresa un correo con un formato válido')(valor.trim()) ??
        hasLength({ max: MAX_CORREO }, `El correo admite hasta ${MAX_CORREO} caracteres`)(valor.trim()),
      password: (valor) =>
        isNotEmpty('Ingresa tu contraseña')(valor) ??
        hasLength({ max: MAX_PASSWORD }, `La contraseña admite hasta ${MAX_PASSWORD} caracteres`)(valor),
    },
    transformValues: (valores) => ({ ...valores, correo: valores.correo.trim() }),
  })

  return (
    <form onSubmit={form.onSubmit((credenciales) => iniciarSesion.mutate(credenciales, { onSuccess: onExito }))} noValidate>
      <Stack>
        {iniciarSesion.isError && (
          <Alert color="red" title="No se pudo iniciar sesión" role="alert">
            {mensajeDeError(iniciarSesion.error)}
          </Alert>
        )}
        <TextInput
          label="Correo electrónico"
          type="email"
          autoComplete="username"
          withAsterisk
          key={form.key('correo')}
          {...form.getInputProps('correo')}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          withAsterisk
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <Button type="submit" fullWidth loading={iniciarSesion.isPending}>
          Iniciar sesión
        </Button>
      </Stack>
    </form>
  )
}
