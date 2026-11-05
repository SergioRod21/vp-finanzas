import { Badge, type BadgeProps } from '@mantine/core'

import { PRESENTACION_ESTADO, type EstadoNota } from '@/features/notas-credito/types'

interface BadgeEstadoNotaProps extends Omit<BadgeProps, 'color' | 'children'> {
  estado: EstadoNota
}

/** Estado de una nota, con la etiqueta y el color definidos en PRESENTACION_ESTADO. */
export function BadgeEstadoNota({ estado, ...props }: BadgeEstadoNotaProps) {
  const { etiqueta, color } = PRESENTACION_ESTADO[estado]
  return (
    <Badge variant="light" color={color} {...props}>
      {etiqueta}
    </Badge>
  )
}
