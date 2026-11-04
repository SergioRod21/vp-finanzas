import { Anchor, Avatar, Button, Card, DataList, Divider, Group, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { EstadoActivo } from '@/components/datos/estado-activo'
import { CargadorPagina } from '@/components/feedback/cargador-pagina'
import { ErrorCarga } from '@/components/feedback/error-carga'
import { PaginaNoEncontrada } from '@/components/feedback/pagina-no-encontrada'
import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { paths } from '@/config/paths'
import { useColaborador } from '@/features/colaboradores/api/obtener-colaborador'
import {
  esColaboradorFicha,
  type CargoDelColaborador,
  type Colaborador,
  type ColaboradorFicha,
} from '@/features/colaboradores/types'
import { mensajeDeError } from '@/lib/api-client'
import { esNoEncontrado } from '@/lib/errores-api'
import { formatearFecha } from '@/utils/formatos'

/** Cómo mostrar el cargo. Lo decide quien compone la pantalla (por ejemplo, con un enlace al cargo). */
type RenderCargo = (cargo: CargoDelColaborador) => ReactNode

const soloTitulo: RenderCargo = (cargo) => cargo.titulo

function VolverAColaboradores() {
  return (
    <Button component={Link} to={paths.colaboradores.lista} variant="default">
      Volver a colaboradores
    </Button>
  )
}

/** Datos laborales que solo trae la ficha completa. */
function DatosLaborales({ ficha }: { ficha: ColaboradorFicha }) {
  return (
    <>
      <DataList.Item>
        <DataList.ItemLabel>Nivel</DataList.ItemLabel>
        <DataList.ItemValue>{ficha.nivel}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Departamento</DataList.ItemLabel>
        <DataList.ItemValue>{ficha.departamento}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>País</DataList.ItemLabel>
        <DataList.ItemValue>{ficha.pais}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Fecha de ingreso</DataList.ItemLabel>
        <DataList.ItemValue>{formatearFecha(ficha.fecha_ingreso)}</DataList.ItemValue>
      </DataList.Item>
    </>
  )
}

function DatosColaborador({ colaborador, renderCargo }: { colaborador: Colaborador; renderCargo: RenderCargo }) {
  const nombreCompleto = `${colaborador.nombre} ${colaborador.apellido}`
  const ficha = esColaboradorFicha(colaborador) ? colaborador : null

  return (
    <Stack>
      <EncabezadoPagina titulo={nombreCompleto} descripcion={colaborador.cargo} acciones={<VolverAColaboradores />} />

      <Card withBorder padding="xl">
        <Stack gap="lg">
          <Group gap="md" wrap="nowrap">
            <Avatar name={nombreCompleto} color="marca" size="lg" />
            <Stack gap={4}>
              <Anchor href={`mailto:${colaborador.correo}`}>{colaborador.correo}</Anchor>
              {ficha && (
                <Group gap="xs">
                  <EstadoActivo activo={ficha.activo} />
                </Group>
              )}
            </Stack>
          </Group>

          <Divider />

          <DataList labelWidth={160} withDivider>
            <DataList.Item>
              <DataList.ItemLabel>Cargo</DataList.ItemLabel>
              <DataList.ItemValue>
                {renderCargo({
                  cargoId: colaborador.cargo_id,
                  titulo: colaborador.cargo,
                  departamentoId: ficha?.departamento_id ?? null,
                })}
              </DataList.ItemValue>
            </DataList.Item>
            {ficha && <DatosLaborales ficha={ficha} />}
          </DataList>

          {!ficha && (
            <Text size="sm" c="dimmed">
              Como colaborador, ves los datos de contacto y el cargo de tus compañeros de departamento.
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

interface DetalleColaboradorProps {
  colaboradorId: number
  /** Cómo mostrar el cargo; por defecto, solo su título. */
  renderCargo?: RenderCargo
}

/**
 * Detalle de un colaborador: la ficha completa o el resumen, según lo que devuelva la API
 * para el rol del usuario. 404 si no existe o está fuera de su alcance.
 */
export function DetalleColaborador({ colaboradorId, renderCargo = soloTitulo }: DetalleColaboradorProps) {
  const colaborador = useColaborador(colaboradorId)

  if (colaborador.isPending) return <CargadorPagina />
  if (colaborador.isError) {
    if (esNoEncontrado(colaborador.error)) return <PaginaNoEncontrada />
    return (
      <Stack>
        <EncabezadoPagina titulo="Ficha del colaborador" acciones={<VolverAColaboradores />} />
        <ErrorCarga
          titulo="No se pudo cargar el colaborador"
          mensaje={mensajeDeError(colaborador.error)}
          onReintentar={() => void colaborador.refetch()}
        />
      </Stack>
    )
  }
  return <DatosColaborador colaborador={colaborador.data} renderCargo={renderCargo} />
}
