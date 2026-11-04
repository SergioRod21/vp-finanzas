import { List, Text, type MantineSize } from '@mantine/core'

interface FuncionesCargoProps {
  funciones: readonly string[]
  size?: MantineSize
}

/** Lista de las funciones de un cargo, o un aviso si no tiene ninguna asignada. */
export function FuncionesCargo({ funciones, size = 'sm' }: FuncionesCargoProps) {
  if (funciones.length === 0) {
    return (
      <Text size={size} c="dimmed">
        Este cargo no tiene funciones asignadas.
      </Text>
    )
  }

  return (
    <List size={size} spacing={4} aria-label="Funciones del cargo">
      {funciones.map((funcion) => (
        <List.Item key={funcion}>{funcion}</List.Item>
      ))}
    </List>
  )
}
