import { Button, Card, DataList, Stack, Title } from '@mantine/core'
import { Link } from 'react-router'

import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { paths } from '@/config/paths'
import { useCargo } from '@/features/cargos/api/obtener-cargo'
import { FuncionesCargo } from '@/features/cargos/components/funciones-cargo'
import type { CargoFicha } from '@/features/cargos/types'
import { mensajeDeError } from '@/lib/api-client'
import { esNoEncontrado } from '@/lib/errores-api'

function VolverACargos() {
  return (
    <Button component={Link} to={paths.cargos.lista} variant="default">
      Volver a cargos
    </Button>
  )
}

function DatosCargo({ cargo }: { cargo: CargoFicha }) {
  return (
    <Stack>
      <EncabezadoPagina titulo={cargo.titulo} descripcion={cargo.departamento} acciones={<VolverACargos />} />

      <Card withBorder padding="xl">
        <Stack gap="lg">
          <DataList labelWidth={160} withDivider>
            <DataList.Item>
              <DataList.ItemLabel>Nivel</DataList.ItemLabel>
              <DataList.ItemValue>{cargo.nivel}</DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>Departamento</DataList.ItemLabel>
              <DataList.ItemValue>{cargo.departamento}</DataList.ItemValue>
            </DataList.Item>
          </DataList>

          <Stack gap="xs">
            <Title order={3} size="h4">
              Funciones
            </Title>
            <FuncionesCargo funciones={cargo.funciones} size="md" />
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )
}

/** Detalle de un cargo con sus funciones. 404 si no existe o el usuario no puede verlo. */
export function DetalleCargo({ cargoId }: { cargoId: number }) {
  const cargo = useCargo(cargoId)

  if (cargo.isPending) return <CargadorPagina />
  if (cargo.isError) {
    if (esNoEncontrado(cargo.error)) return <PaginaNoEncontrada />
    return (
      <Stack>
        <EncabezadoPagina titulo="Detalle del cargo" acciones={<VolverACargos />} />
        <ErrorCarga
          titulo="No se pudo cargar el cargo"
          mensaje={mensajeDeError(cargo.error)}
          onReintentar={() => void cargo.refetch()}
        />
      </Stack>
    )
  }
  return <DatosCargo cargo={cargo.data} />
}
