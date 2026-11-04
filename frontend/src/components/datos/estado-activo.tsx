import { Badge } from '@mantine/core'

/** Badge con el estado de un colaborador: activo o inactivo. Nunca se recorta, ni en una tabla estrecha. */
export function EstadoActivo({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge color="teal" variant="light" miw="max-content">
      Activo
    </Badge>
  ) : (
    <Badge color="gray" variant="light" miw="max-content">
      Inactivo
    </Badge>
  )
}
