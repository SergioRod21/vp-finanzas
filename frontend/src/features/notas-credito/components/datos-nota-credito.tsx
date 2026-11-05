import { DataList, Text } from '@mantine/core'
import type { ReactNode } from 'react'

import { BadgeEstadoNota } from '@/features/notas-credito/components/badge-estado-nota'
import { APROBADOR_SEGUN_NIVEL, type NotaCredito } from '@/features/notas-credito/types'
import { formatearFechaHora, formatearMonto } from '@/utils/formatos'

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <DataList.Item>
      <DataList.ItemLabel>{etiqueta}</DataList.ItemLabel>
      <DataList.ItemValue>{children}</DataList.ItemValue>
    </DataList.Item>
  )
}

/** Todos los datos de una nota de crédito. */
export function DatosNotaCredito({ nota }: { nota: NotaCredito }) {
  return (
    <DataList withDivider labelWidth={170}>
      <Dato etiqueta="Número">{nota.numero}</Dato>
      <Dato etiqueta="Estado">
        <BadgeEstadoNota estado={nota.estado} />
      </Dato>
      <Dato etiqueta="Monto">
        <Text span fw={600}>
          {formatearMonto(nota.monto)}
        </Text>
      </Dato>
      <Dato etiqueta="Motivo">{nota.motivo}</Dato>
      <Dato etiqueta="Detalle">
        <Text span size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {nota.detalle}
        </Text>
      </Dato>
      <Dato etiqueta="Departamento">{nota.departamento}</Dato>
      <Dato etiqueta="Solicitante">{nota.solicitante}</Dato>
      <Dato etiqueta="Aprueba">{APROBADOR_SEGUN_NIVEL[nota.nivel_aprobacion]}</Dato>
      {/* Solo aprobar y rechazar registran un resolutor: una nota anulada no lo tiene. */}
      <Dato etiqueta="Resolutor">
        {nota.resolutor ?? (
          <Text span size="sm" c="dimmed">
            {nota.estado === 'PENDIENTE'
              ? `Pendiente de aprobación del ${APROBADOR_SEGUN_NIVEL[nota.nivel_aprobacion]}`
              : 'Sin resolutor'}
          </Text>
        )}
      </Dato>
      <Dato etiqueta="Creada">{formatearFechaHora(nota.creada_en)}</Dato>
      <Dato etiqueta="Última actualización">{formatearFechaHora(nota.actualizada_en)}</Dato>
    </DataList>
  )
}
