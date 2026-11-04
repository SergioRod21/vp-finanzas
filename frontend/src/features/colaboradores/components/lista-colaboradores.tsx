import { Button, EmptyState, Group, Stack, Text, TextInput } from '@mantine/core'
import { useState } from 'react'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { FiltroDepartamento } from '@/components/filtros/filtro-departamento'
import { useColaboradores } from '@/features/colaboradores/api/listar-colaboradores'
import { TablaColaboradores } from '@/features/colaboradores/components/tabla-colaboradores'
import { sonFichas, type ColaboradorResumen, type ListaColaboradores } from '@/features/colaboradores/types'
import { useFiltroDepartamento } from '@/hooks/use-filtro-departamento'
import { mensajeDeError } from '@/lib/api-client'

/** Texto para comparar sin distinguir mayúsculas ni tildes: "Ángela" coincide con "angela". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim()
}

function coincide(colaborador: ColaboradorResumen, busqueda: string): boolean {
  const nombreCompleto = normalizar(`${colaborador.nombre} ${colaborador.apellido}`)
  return nombreCompleto.includes(busqueda) || normalizar(colaborador.correo).includes(busqueda)
}

/** Búsqueda por nombre o correo, en el cliente. Conserva el tipo de la lista (fichas o resúmenes). */
function filtrarPorBusqueda(lista: ListaColaboradores, texto: string): ListaColaboradores {
  const busqueda = normalizar(texto)
  if (busqueda === '') return lista
  return sonFichas(lista)
    ? lista.filter((c) => coincide(c, busqueda))
    : lista.filter((c) => coincide(c, busqueda))
}

function plural(cantidad: number): string {
  return cantidad === 1 ? '1 colaborador' : `${cantidad} colaboradores`
}

interface ResultadoProps {
  departamentoId: number | null
  busqueda: string
  onLimpiarBusqueda: () => void
}

/** Resultado de la consulta: cargador, error, vacío o la tabla. */
function ResultadoColaboradores({ departamentoId, busqueda, onLimpiarBusqueda }: ResultadoProps) {
  const colaboradores = useColaboradores(departamentoId)

  if (colaboradores.isPending) return <CargadorPagina />
  if (colaboradores.isError) {
    return (
      <ErrorCarga
        titulo="No se pudieron cargar los colaboradores"
        mensaje={mensajeDeError(colaboradores.error)}
        onReintentar={() => void colaboradores.refetch()}
      />
    )
  }

  const total = colaboradores.data.length
  if (total === 0) {
    return (
      <EmptyState
        title="No hay colaboradores para mostrar"
        description={
          departamentoId === null
            ? 'Todavía no hay colaboradores registrados en tu alcance.'
            : 'El departamento seleccionado no tiene colaboradores.'
        }
      />
    )
  }

  const visibles = filtrarPorBusqueda(colaboradores.data, busqueda)
  if (visibles.length === 0) {
    return (
      <EmptyState title="No hay colaboradores que coincidan con la búsqueda" description="Prueba con otro nombre o correo.">
        <EmptyState.Actions>
          <Button variant="light" onClick={onLimpiarBusqueda}>
            Limpiar la búsqueda
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    )
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed" aria-live="polite">
        {visibles.length === total ? plural(total) : `${visibles.length} de ${plural(total)}`}
      </Text>
      <TablaColaboradores colaboradores={visibles} />
    </Stack>
  )
}

/** Filtro de departamento (solo el Administrador). Las opciones salen de la lista sin filtrar. */
function FiltroColaboradores({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const todos = useColaboradores(null)
  // La lista sin filtrar del Administrador siempre es de fichas, que traen el departamento.
  const elementos = todos.data && sonFichas(todos.data) ? todos.data : undefined
  return <FiltroDepartamento elementos={elementos} value={value} onChange={onChange} cargando={todos.isPending} />
}

/**
 * Directorio de colaboradores con búsqueda por nombre o correo. El Administrador además
 * filtra por departamento en el backend; el filtro se guarda en la URL.
 */
export function ListaColaboradores() {
  const filtro = useFiltroDepartamento()
  const [busqueda, setBusqueda] = useState('')

  return (
    <Stack>
      <Group align="flex-end">
        <TextInput
          type="search"
          label="Buscar"
          placeholder="Nombre o correo"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.currentTarget.value)}
          w={{ base: '100%', sm: 320 }}
        />
        {filtro.disponible && <FiltroColaboradores value={filtro.departamentoId} onChange={filtro.cambiarDepartamento} />}
      </Group>
      <ResultadoColaboradores
        departamentoId={filtro.departamentoId}
        busqueda={busqueda}
        onLimpiarBusqueda={() => setBusqueda('')}
      />
    </Stack>
  )
}
