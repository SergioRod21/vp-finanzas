import type { MantineColor } from '@mantine/core'

import type { NivelAprobacion } from '@/lib/authorization'

/**
 * Tipos del módulo de notas de crédito. Reflejan los modelos públicos del backend
 * (app/models/nota_credito_public.py) y su máquina de estados (app/domain/nota_credito.py).
 */

/** Estados de una nota, en el orden en que se ofrecen en el filtro. */
export const ESTADOS_NOTA = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'ANULADA'] as const

export type EstadoNota = (typeof ESTADOS_NOTA)[number]

/** Acciones que quedan registradas en el historial. */
export type AccionNota = 'CREAR' | 'APROBAR' | 'RECHAZAR' | 'ANULAR'

/** Si el texto (por ejemplo, un parámetro de la URL) es un estado válido. */
export function esEstadoNota(valor: string | null): valor is EstadoNota {
  return ESTADOS_NOTA.some((estado) => estado === valor)
}

/**
 * Cómo se presenta cada estado: etiqueta y color de Mantine. Único lugar donde se
 * asocian los estados con un color; lo usan el Badge y el historial.
 */
export const PRESENTACION_ESTADO: Record<EstadoNota, { etiqueta: string; color: MantineColor }> = {
  PENDIENTE: { etiqueta: 'Pendiente', color: 'orange' },
  APROBADA: { etiqueta: 'Aprobada', color: 'green' },
  RECHAZADA: { etiqueta: 'Rechazada', color: 'red' },
  ANULADA: { etiqueta: 'Anulada', color: 'gray' },
}

/** Quién debe aprobar la nota, según su nivel de aprobación. */
export const APROBADOR_SEGUN_NIVEL: Record<NivelAprobacion, string> = {
  JEFE_DEPARTAMENTO: 'Jefe de Departamento',
  ADMINISTRADOR: 'Administrador',
}

/** Cómo se nombra cada acción en el historial. */
export const ETIQUETA_ACCION: Record<AccionNota, string> = {
  CREAR: 'Solicitud creada',
  APROBAR: 'Nota aprobada',
  RECHAZAR: 'Nota rechazada',
  ANULAR: 'Nota anulada',
}

/** Motivo de una nota de crédito (GET /api/motivos-nota-credito). */
export interface MotivoNotaCredito {
  motivo_nota_credito_id: number
  descripcion: string
}

/** Nota de crédito tal como la devuelve la API. Cumple NotaAutorizable de lib/authorization. */
export interface NotaCredito {
  nota_credito_id: number
  /** Número visible, por ejemplo "NC-000001". */
  numero: string
  /** Decimal en texto ("1250.00"): no se convierte a number para no perder precisión. */
  monto: string
  detalle: string
  estado: EstadoNota
  /** Rol que debe aprobarla: el Jefe si la solicitó un Colaborador; el Administrador si la solicitó un Jefe. */
  nivel_aprobacion: NivelAprobacion
  motivo_nota_credito_id: number
  motivo: string
  departamento_id: number
  departamento: string
  solicitante_id: number
  /** Nombre completo de quien la solicitó. */
  solicitante: string
  /** Quien la aprobó o rechazó; null mientras está pendiente o si se anuló. */
  resolutor_id: number | null
  resolutor: string | null
  /** Fechas ISO 8601. */
  creada_en: string
  actualizada_en: string
}

/** Un evento del historial de auditoría (GET /api/notas-credito/{id}/historial). */
export interface EventoHistorialNota {
  accion: AccionNota
  /** null en la creación. */
  estado_anterior: EstadoNota | null
  estado_nuevo: EstadoNota
  usuario_id: number
  /** Nombre de quien realizó la acción. */
  usuario: string
  comentario: string | null
  /** Fecha ISO 8601. */
  ocurrido_en: string
}

/** Cuerpo de POST /api/notas-credito. */
export interface NuevaNotaCredito {
  motivo_nota_credito_id: number
  /** Texto decimal con 2 decimales como máximo, por ejemplo "1250.50". */
  monto: string
  detalle: string
}
