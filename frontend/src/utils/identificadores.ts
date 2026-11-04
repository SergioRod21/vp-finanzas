/** Un identificador de la base de datos: entero positivo, sin ceros a la izquierda ni signos. */
const ID_VALIDO = /^[1-9]\d*$/

/**
 * Convierte en número el identificador que llega como texto en la URL (un parámetro de
 * ruta como `:colaboradorId` o un parámetro de búsqueda). Devuelve null si falta o no es
 * válido ("abc", "0", "-3", "1.5"), para mostrar un 404 o ignorarlo sin llamar a la API.
 */
export function parsearId(valor: string | null | undefined): number | null {
  if (!valor || !ID_VALIDO.test(valor)) return null
  const id = Number(valor)
  return Number.isSafeInteger(id) ? id : null
}
