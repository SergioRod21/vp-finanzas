import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { CargoDetalleRoute } from '@/app/routes/cargo-detalle'
import { CargosRoute } from '@/app/routes/cargos'
import { ColaboradorDetalleRoute } from '@/app/routes/colaborador-detalle'
import { ColaboradoresRoute } from '@/app/routes/colaboradores'
import { InicioRoute } from '@/app/routes/inicio'
import { LoginRoute } from '@/app/routes/login'
import { NoEncontradoRoute } from '@/app/routes/no-encontrado'
import { DetalleNotaCreditoRoute } from '@/app/routes/notas-credito/detalle'
import { NotasCreditoRoute } from '@/app/routes/notas-credito/lista'
import { NuevaNotaCreditoRoute } from '@/app/routes/notas-credito/nueva'
import { PerfilRoute } from '@/app/routes/perfil'
import { ErrorRuta } from '@/components/feedback/error-ruta'
import { LayoutPrincipal } from '@/components/layout/layout-principal'
import { paths } from '@/config/paths'
import { RutaAutorizada, RutaModulo } from '@/lib/auth/ruta-autorizada'
import { RutaProtegida } from '@/lib/auth/ruta-protegida'
import { RutaPublica } from '@/lib/auth/ruta-publica'
import { puedeCrearNota } from '@/lib/authorization'

/**
 * Todas las rutas de la aplicación, en un solo lugar.
 *
 * Las rutas sin path solo agrupan: RutaProtegida exige sesión, LayoutPrincipal pone el
 * encabezado y el menú, y RutaModulo / RutaAutorizada exigen el permiso del rol.
 * Para implementar una pantalla provisional, cambia solo su `element`.
 */
const router = createBrowserRouter([
  {
    // Errores fuera del layout (por ejemplo, en los guardias de sesión).
    errorElement: <ErrorRuta />,
    children: [
      {
        element: <RutaPublica />,
        children: [{ path: paths.login, element: <LoginRoute /> }],
      },
      {
        element: <RutaProtegida />,
        children: [
          {
            element: <LayoutPrincipal />,
            children: [
              {
                // Errores de una pantalla: se muestran dentro del layout, con el menú disponible.
                errorElement: <ErrorRuta />,
                children: [
                  { path: paths.inicio, element: <InicioRoute /> },
                  {
                    element: <RutaModulo modulo="perfil" />,
                    children: [{ path: paths.perfil, element: <PerfilRoute /> }],
                  },
                  {
                    element: <RutaModulo modulo="colaboradores" />,
                    children: [
                      { path: paths.colaboradores.lista, element: <ColaboradoresRoute /> },
                      { path: paths.colaboradores.patronDetalle, element: <ColaboradorDetalleRoute /> },
                    ],
                  },
                  {
                    element: <RutaModulo modulo="cargos" />,
                    children: [
                      { path: paths.cargos.lista, element: <CargosRoute /> },
                      { path: paths.cargos.patronDetalle, element: <CargoDetalleRoute /> },
                    ],
                  },
                  {
                    element: <RutaModulo modulo="notasCredito" />,
                    children: [
                      { path: paths.notasCredito.lista, element: <NotasCreditoRoute /> },
                      {
                        element: <RutaAutorizada permitido={puedeCrearNota} />,
                        children: [
                          { path: paths.notasCredito.nueva, element: <NuevaNotaCreditoRoute /> },
                        ],
                      },
                      { path: paths.notasCredito.patronDetalle, element: <DetalleNotaCreditoRoute /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NoEncontradoRoute /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
