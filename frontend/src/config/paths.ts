/**
 * Rutas del frontend en un solo lugar. Las páginas y los enlaces usan estas
 * constantes en lugar de escribir las URLs a mano.
 *
 * - `lista`, `nueva`…: URLs fijas.
 * - `detalle(id)`: arma la URL de un recurso concreto, para enlaces y navegación.
 * - `patronDetalle`: el patrón con su parámetro, solo para declarar la ruta en app/router.tsx.
 *   El nombre del parámetro es el que se lee con useParams (por ejemplo, `notaId`).
 */
export const paths = {
  inicio: '/',
  login: '/login',
  perfil: '/perfil',
  colaboradores: {
    lista: '/colaboradores',
    patronDetalle: '/colaboradores/:colaboradorId',
    detalle: (colaboradorId: number) => `/colaboradores/${colaboradorId}`,
  },
  cargos: {
    lista: '/cargos',
    patronDetalle: '/cargos/:cargoId',
    detalle: (cargoId: number) => `/cargos/${cargoId}`,
  },
  notasCredito: {
    lista: '/notas-credito',
    nueva: '/notas-credito/nueva',
    patronDetalle: '/notas-credito/:notaId',
    detalle: (notaId: number) => `/notas-credito/${notaId}`,
  },
} as const
