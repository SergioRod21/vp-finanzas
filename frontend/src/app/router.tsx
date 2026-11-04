import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { InicioRoute } from '@/app/routes/inicio'
import { NoEncontradoRoute } from '@/app/routes/no-encontrado'
import { paths } from '@/config/paths'

/** Todas las rutas de la aplicación, en un solo lugar. */
const router = createBrowserRouter([
  { path: paths.inicio, element: <InicioRoute /> },
  { path: '*', element: <NoEncontradoRoute /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
