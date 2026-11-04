import { Select, type ComboboxItem } from '@mantine/core'
import { useMemo } from 'react'

/** Lo mínimo que se necesita de cada elemento para saber a qué departamento pertenece. */
interface ConDepartamento {
  departamento_id: number
  departamento: string
}

interface FiltroDepartamentoProps {
  /**
   * Elementos de los que se obtienen los departamentos (la lista sin filtrar). La API no
   * tiene un endpoint de departamentos: las opciones son los valores distintos de la lista.
   */
  elementos: readonly ConDepartamento[] | undefined
  value: number | null
  onChange: (departamentoId: number | null) => void
  cargando?: boolean
}

/** Una opción por departamento_id, en orden alfabético. */
function opcionesDeDepartamento(elementos: readonly ConDepartamento[]): ComboboxItem[] {
  const nombrePorId = new Map<number, string>()
  for (const { departamento_id, departamento } of elementos) nombrePorId.set(departamento_id, departamento)
  return [...nombrePorId]
    .map(([id, nombre]) => ({ value: String(id), label: nombre }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/** Select de departamento. Sin selección equivale a "Todos los departamentos". */
export function FiltroDepartamento({ elementos, value, onChange, cargando = false }: FiltroDepartamentoProps) {
  const opciones = useMemo(() => opcionesDeDepartamento(elementos ?? []), [elementos])

  return (
    <Select
      label="Departamento"
      placeholder={cargando ? 'Cargando departamentos…' : 'Todos los departamentos'}
      data={opciones}
      value={value === null ? null : String(value)}
      onChange={(seleccion) => onChange(seleccion === null ? null : Number(seleccion))}
      disabled={cargando}
      clearable
      nothingFoundMessage="No hay departamentos"
      w={{ base: '100%', sm: 280 }}
    />
  )
}
