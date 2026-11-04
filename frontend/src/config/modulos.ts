import { paths } from '@/config/paths'
import { puedeVerModulo, type Modulo } from '@/lib/authorization'
import type { Rol } from '@/types/rol'

/** Un módulo tal como aparece en el menú lateral y en los accesos directos del inicio. */
export interface EntradaModulo {
  modulo: Modulo
  etiqueta: string
  descripcion: string
  ruta: string
}

/** Módulos del portal, en el orden en que se muestran. Único lugar donde se definen. */
export const ENTRADAS_MODULOS: readonly EntradaModulo[] = [
  {
    modulo: 'perfil',
    etiqueta: 'Mi perfil',
    descripcion: 'Tus datos personales, tu cargo y tu departamento.',
    ruta: paths.perfil,
  },
  {
    modulo: 'colaboradores',
    etiqueta: 'Colaboradores',
    descripcion: 'Directorio de las personas que trabajan en la Vicepresidencia.',
    ruta: paths.colaboradores.lista,
  },
  {
    modulo: 'cargos',
    etiqueta: 'Cargos y funciones',
    descripcion: 'Cargos de cada departamento y las funciones que tienen asignadas.',
    ruta: paths.cargos.lista,
  },
  {
    modulo: 'notasCredito',
    etiqueta: 'Notas de crédito',
    descripcion: 'Solicitudes de notas de crédito, su aprobación y su historial.',
    ruta: paths.notasCredito.lista,
  },
]

/** Los módulos que el rol puede ver, filtrados con la matriz de lib/authorization.ts. */
export function entradasVisibles(rol: Rol): EntradaModulo[] {
  return ENTRADAS_MODULOS.filter((entrada) => puedeVerModulo(rol, entrada.modulo))
}
