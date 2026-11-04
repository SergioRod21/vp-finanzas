import { Anchor, Table } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'

import { EstadoActivo } from '@/components/datos/estado-activo'
import { paths } from '@/config/paths'
import {
  sonFichas,
  type ColaboradorFicha,
  type ColaboradorResumen,
  type ListaColaboradores,
} from '@/features/colaboradores/types'
import { formatearFecha } from '@/utils/formatos'

/** Una columna de la tabla: su encabezado y cómo se muestra la celda de cada colaborador. */
interface Columna<T> {
  titulo: string
  celda: (colaborador: T) => ReactNode
  /** Si el contenido de la celda no debe partirse en varias líneas (fechas, badges). */
  sinSalto?: boolean
}

/** Columnas del resumen: lo único que recibe el Colaborador. */
const COLUMNAS_RESUMEN: readonly Columna<ColaboradorResumen>[] = [
  {
    titulo: 'Nombre',
    // El nombre es un enlace para que el detalle también se abra con el teclado.
    celda: (c) => (
      <Anchor component={Link} to={paths.colaboradores.detalle(c.colaborador_id)} fw={500}>
        {c.nombre} {c.apellido}
      </Anchor>
    ),
  },
  { titulo: 'Correo', celda: (c) => c.correo },
  { titulo: 'Cargo', celda: (c) => c.cargo },
]

/** Columnas de la ficha completa: Administrador y Jefe de Departamento. */
const COLUMNAS_FICHA: readonly Columna<ColaboradorFicha>[] = [
  ...COLUMNAS_RESUMEN,
  { titulo: 'Nivel', celda: (c) => c.nivel },
  { titulo: 'Departamento', celda: (c) => c.departamento },
  { titulo: 'País', celda: (c) => c.pais },
  { titulo: 'Fecha de ingreso', celda: (c) => formatearFecha(c.fecha_ingreso), sinSalto: true },
  { titulo: 'Estado', celda: (c) => <EstadoActivo activo={c.activo} />, sinSalto: true },
]

interface TablaProps<T extends ColaboradorResumen> {
  filas: readonly T[]
  columnas: readonly Columna<T>[]
  minWidth: number
}

function Tabla<T extends ColaboradorResumen>({ filas, columnas, minWidth }: TablaProps<T>) {
  const navigate = useNavigate()

  return (
    <Table.ScrollContainer minWidth={minWidth} type="native">
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {columnas.map((columna) => (
              <Table.Th key={columna.titulo}>{columna.titulo}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filas.map((colaborador) => (
            <Table.Tr
              key={colaborador.colaborador_id}
              onClick={(evento) => {
                // Un clic en el enlace del nombre ya navega: no se navega dos veces.
                if (evento.target instanceof Element && evento.target.closest('a')) return
                void navigate(paths.colaboradores.detalle(colaborador.colaborador_id))
              }}
              style={{ cursor: 'pointer' }}
            >
              {columnas.map((columna) => (
                <Table.Td key={columna.titulo} style={columna.sinSalto ? { whiteSpace: 'nowrap' } : undefined}>
                  {columna.celda(colaborador)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

/**
 * Tabla del directorio. Las columnas dependen de lo que devolvió la API: la ficha
 * completa o solo el resumen. Cada fila lleva al detalle del colaborador.
 */
export function TablaColaboradores({ colaboradores }: { colaboradores: ListaColaboradores }) {
  return sonFichas(colaboradores) ? (
    <Tabla filas={colaboradores} columnas={COLUMNAS_FICHA} minWidth={1100} />
  ) : (
    <Tabla filas={colaboradores} columnas={COLUMNAS_RESUMEN} minWidth={600} />
  )
}
