import { SegmentedControl, useMatches } from '@mantine/core'

import { ESTADOS_NOTA, esEstadoNota, PRESENTACION_ESTADO, type EstadoNota } from '@/features/notas-credito/types'

/** Valor del control para "sin filtro". No es un estado: el backend no recibe el parámetro. */
const TODAS = 'TODAS'

const OPCIONES = [
  { value: TODAS, label: 'Todas' },
  ...ESTADOS_NOTA.map((estado) => ({ value: estado, label: PRESENTACION_ESTADO[estado].etiqueta })),
]

interface FiltroEstadoNotasProps {
  /** Estado seleccionado, o null para mostrar todas las notas. */
  estado: EstadoNota | null
  onCambiar: (estado: EstadoNota | null) => void
}

/** Filtro de la lista de notas por estado. */
export function FiltroEstadoNotas({ estado, onCambiar }: FiltroEstadoNotasProps) {
  // En pantallas angostas las cinco opciones no caben en una fila: se apilan.
  const orientacion = useMatches<'vertical' | 'horizontal'>({ base: 'vertical', xs: 'horizontal' })

  return (
    <SegmentedControl
      aria-label="Filtrar las notas por estado"
      data={OPCIONES}
      value={estado ?? TODAS}
      onChange={(valor) => onCambiar(esEstadoNota(valor) ? valor : null)}
      orientation={orientacion}
      fullWidth
      maw={640}
    />
  )
}
