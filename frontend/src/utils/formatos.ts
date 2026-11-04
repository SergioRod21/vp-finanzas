/**
 * Formatos de presentación compartidos por todas las pantallas. Funciones puras.
 *
 * Los formateadores de Intl se crean una sola vez: construirlos en cada llamada es costoso.
 */

const LOCALE = 'es'

/**
 * Moneda de los montos de las notas de crédito. El backend no envía la moneda
 * (nota_credito.monto es NUMERIC sin unidad), así que se define aquí, una sola vez.
 */
const MONEDA = 'USD'

const formatoFecha = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })
const formatoFechaHora = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const formatoMonto = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: MONEDA })

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/
const NUMERO_DECIMAL = /^-?\d+(\.\d+)?$/

/**
 * Convierte el texto de la API en Date. Una fecha sin hora ("2024-03-15", campos date del
 * backend) se interpreta en la zona local: new Date("2024-03-15") la tomaría como medianoche
 * UTC y en América mostraría el día anterior.
 */
function aFecha(valor: string): Date {
  const soloFecha = SOLO_FECHA.exec(valor)
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha
    return new Date(Number(anio), Number(mes) - 1, Number(dia))
  }
  return new Date(valor)
}

/** "2026-10-06" o "2026-10-06T13:15:00Z" → "6 oct 2026". Si el valor no es una fecha, lo devuelve tal cual. */
export function formatearFecha(valor: string): string {
  const fecha = aFecha(valor)
  return Number.isNaN(fecha.getTime()) ? valor : formatoFecha.format(fecha)
}

/** "2026-10-06T13:15:00Z" → "6 oct 2026, 9:15" (en la zona horaria del navegador). */
export function formatearFechaHora(valor: string): string {
  const fecha = aFecha(valor)
  return Number.isNaN(fecha.getTime()) ? valor : formatoFechaHora.format(fecha)
}

function esNumeroDecimal(valor: string): valor is `${number}` {
  return NUMERO_DECIMAL.test(valor)
}

/**
 * Monto en moneda: "1250.00" → "1250,00 US$". Los montos llegan de la API como texto;
 * Intl los formatea a partir del texto, sin pasar por number, así que no pierden precisión.
 */
export function formatearMonto(monto: string): string {
  return esNumeroDecimal(monto) ? formatoMonto.format(monto) : monto
}
