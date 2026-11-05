import { NavLink, Stack } from '@mantine/core'
import { Link, matchPath, useLocation } from 'react-router'

import classes from '@/components/layout/navegacion-lateral.module.css'
import { entradasVisibles } from '@/config/modulos'
import type { Rol } from '@/types/rol'

interface NavegacionLateralProps {
  rol: Rol
  /** Se llama al elegir un módulo: en pantallas pequeñas cierra el menú. */
  onNavegar: () => void
}

/** Menú con los módulos que el rol puede ver. Un módulo queda activo también en sus subrutas. */
export function NavegacionLateral({ rol, onNavegar }: NavegacionLateralProps) {
  const { pathname } = useLocation()

  return (
    <Stack component="nav" aria-label="Módulos" gap={4}>
      {entradasVisibles(rol).map((entrada) => {
        const activo = matchPath({ path: entrada.ruta, end: false }, pathname) !== null
        return (
          <NavLink
            key={entrada.modulo}
            component={Link}
            to={entrada.ruta}
            label={entrada.etiqueta}
            active={activo}
            aria-current={activo ? 'page' : undefined}
            className={classes.enlace}
            onClick={onNavegar}
          />
        )
      })}
    </Stack>
  )
}
