import { useSearchParams } from 'react-router'

import { useUsuarioAutenticado } from '@/lib/auth/usuario-actual'
import { puedeFiltrarPorDepartamento } from '@/lib/authorization'
import { parsearId } from '@/utils/identificadores'

/** Parámetro de la URL con el departamento elegido, por ejemplo /colaboradores?departamento=2. */
const PARAMETRO = 'departamento'

export interface FiltroDepartamento {
  /** Si el usuario puede elegir el departamento. Solo el Administrador ve todos. */
  disponible: boolean
  /** Departamento elegido, o null para todos. Siempre null si el filtro no está disponible. */
  departamentoId: number | null
  /** Cambia el departamento en la URL; null lo quita. Conserva los demás parámetros. */
  cambiarDepartamento: (departamentoId: number | null) => void
}

/**
 * Filtro de departamento de las pantallas de consulta (colaboradores, cargos), guardado en
 * la URL para que se pueda compartir y se conserve al recargar.
 *
 * Según la matriz de permisos (S3), solo el Administrador consulta varios departamentos; el
 * Jefe y el Colaborador siempre ven el suyo, y si pidieran otro la API respondería 404. Por
 * eso, para ellos el filtro no está disponible y se ignora cualquier valor de la URL.
 */
export function useFiltroDepartamento(): FiltroDepartamento {
  const usuario = useUsuarioAutenticado()
  const [parametros, setParametros] = useSearchParams()
  const disponible = puedeFiltrarPorDepartamento(usuario)

  function cambiarDepartamento(departamentoId: number | null) {
    setParametros(
      (anteriores) => {
        const siguientes = new URLSearchParams(anteriores)
        if (departamentoId === null) siguientes.delete(PARAMETRO)
        else siguientes.set(PARAMETRO, String(departamentoId))
        return siguientes
      },
      // Cambiar el filtro no agrega una entrada al historial: "Atrás" vuelve a la página anterior.
      { replace: true },
    )
  }

  return {
    disponible,
    departamentoId: disponible ? parsearId(parametros.get(PARAMETRO)) : null,
    cambiarDepartamento,
  }
}
