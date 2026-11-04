import { EmptyState, Group, SimpleGrid, Stack, Text } from '@mantine/core'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { FiltroDepartamento } from '@/components/filtros/filtro-departamento'
import { useCargos } from '@/features/cargos/api/listar-cargos'
import { TarjetaCargo } from '@/features/cargos/components/tarjeta-cargo'
import { useFiltroDepartamento } from '@/hooks/use-filtro-departamento'
import { mensajeDeError } from '@/lib/api-client'

/** Resultado de la consulta: cargador, error, vacío o las tarjetas. */
function ResultadoCargos({ departamentoId }: { departamentoId: number | null }) {
  const cargos = useCargos(departamentoId)

  if (cargos.isPending) return <CargadorPagina />
  if (cargos.isError) {
    return (
      <ErrorCarga
        titulo="No se pudieron cargar los cargos"
        mensaje={mensajeDeError(cargos.error)}
        onReintentar={() => void cargos.refetch()}
      />
    )
  }

  if (cargos.data.length === 0) {
    return (
      <EmptyState
        title="No hay cargos para mostrar"
        description={
          departamentoId === null
            ? 'Todavía no hay cargos registrados.'
            : 'El departamento seleccionado no tiene cargos registrados.'
        }
      />
    )
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {cargos.data.length === 1 ? '1 cargo' : `${cargos.data.length} cargos`}
      </Text>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {cargos.data.map((cargo) => (
          <TarjetaCargo key={cargo.cargo_id} cargo={cargo} />
        ))}
      </SimpleGrid>
    </Stack>
  )
}

/** Filtro de departamento (solo el Administrador). Las opciones salen de la lista sin filtrar. */
function FiltroCargos({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const todos = useCargos(null)
  return <FiltroDepartamento elementos={todos.data} value={value} onChange={onChange} cargando={todos.isPending} />
}

/**
 * Cargos y funciones que el usuario puede ver. El Administrador puede filtrar por
 * departamento (el filtro se guarda en la URL); el Jefe ve los de su departamento y el
 * Colaborador, solo el suyo.
 */
export function ListaCargos() {
  const filtro = useFiltroDepartamento()

  return (
    <Stack>
      {filtro.disponible && (
        <Group>
          <FiltroCargos value={filtro.departamentoId} onChange={filtro.cambiarDepartamento} />
        </Group>
      )}
      <ResultadoCargos departamentoId={filtro.departamentoId} />
    </Stack>
  )
}
