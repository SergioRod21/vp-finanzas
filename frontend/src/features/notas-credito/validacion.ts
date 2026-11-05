/**
 * Validación en el cliente de los datos de una nota de crédito. Refleja las reglas del
 * backend (NotaCreditoCrear, AccionConComentario y RechazoNota en
 * app/models/nota_credito_public.py) para avisar antes de enviar; el backend las vuelve
 * a verificar. Funciones puras: devuelven el mensaje de error o null.
 */

/** Máximo de caracteres del detalle de la nota y de los comentarios de las acciones. */
export const MAX_CARACTERES_TEXTO = 500

/** El monto admite 14 dígitos como máximo, de los cuales 2 son decimales. */
export const DECIMALES_MONTO = 2
const MAX_DIGITOS_ENTEROS = 14 - DECIMALES_MONTO

const NUMERO_POSITIVO = /^\d+(\.\d+)?$/
const SOLO_CEROS = /^0*(\.0*)?$/

/**
 * El valor del NumberInput como texto decimal, listo para enviar. NumberInput entrega
 * un number, o un string cuando el número tiene demasiados dígitos para number.
 */
export function montoComoTexto(valor: number | string): string {
  return String(valor).trim()
}

export function validarMonto(valor: number | string): string | null {
  const texto = montoComoTexto(valor)
  if (texto === '') return 'Ingresa el monto'
  if (!NUMERO_POSITIVO.test(texto)) return 'Ingresa un monto válido, sin signos ni letras'

  const [enteros = '', decimales = ''] = texto.split('.')
  if (decimales.length > DECIMALES_MONTO) return `El monto admite ${DECIMALES_MONTO} decimales como máximo`
  if (enteros.replace(/^0+/, '').length > MAX_DIGITOS_ENTEROS) {
    return `El monto admite ${MAX_DIGITOS_ENTEROS} dígitos enteros como máximo`
  }
  if (SOLO_CEROS.test(texto)) return 'El monto debe ser mayor que 0'
  return null
}

/** Texto obligatorio: no puede quedar en blanco (el backend recorta los espacios). */
export function validarTextoObligatorio(valor: string, mensajeSiVacio: string): string | null {
  const texto = valor.trim()
  if (texto === '') return mensajeSiVacio
  return validarTextoOpcional(texto)
}

export function validarTextoOpcional(valor: string): string | null {
  return valor.trim().length > MAX_CARACTERES_TEXTO
    ? `Admite ${MAX_CARACTERES_TEXTO} caracteres como máximo`
    : null
}
