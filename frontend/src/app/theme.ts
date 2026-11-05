import { createTheme, type MantineColorsTuple } from '@mantine/core'

/** Colores de la marca. Usar siempre estas constantes o el tema, nunca valores sueltos. */
export const coloresMarca = {
  azulOscuro: '#00477F', // encabezado y acciones principales (botones, enlaces)
  azul: '#0081C5', // acentos: elemento activo, foco, detalles
  blanco: '#FFFFFF',
} as const

/**
 * Escala de 10 tonos que Mantine necesita para un color propio, construida a partir
 * de los dos azules de la marca: el índice 6 es #0081C5 y el 8 es #00477F.
 */
const marca: MantineColorsTuple = [
  '#e5f3fa',
  '#cce6f4',
  '#99cdea',
  '#66b3df',
  '#339ad4',
  '#1a8dcd',
  '#0081c5',
  '#0067a0',
  '#00477f',
  '#003a68',
]

export const theme = createTheme({
  colors: { marca },
  primaryColor: 'marca',
  // Botones y enlaces usan #00477F: con texto blanco tiene un contraste de 9,5:1.
  // #0081C5 con texto blanco queda en 4,2:1, por debajo del 4,5:1 que pide WCAG AA
  // para texto normal; por eso se reserva para acentos.
  primaryShade: 8,
  white: coloresMarca.blanco,
  defaultRadius: 'md',
})
