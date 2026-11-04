import { Textarea, type TextareaProps } from '@mantine/core'

import { MAX_CARACTERES_TEXTO } from '@/features/notas-credito/validacion'

interface TextareaConContadorProps extends Omit<TextareaProps, 'maxLength' | 'description'> {
  /** Caracteres escritos hasta ahora. */
  longitud: number
}

/**
 * Textarea limitado a MAX_CARACTERES_TEXTO, con un contador debajo. Se usa para el
 * detalle de la nota y para los comentarios de las acciones.
 */
export function TextareaConContador({ longitud, ...props }: TextareaConContadorProps) {
  return (
    <Textarea
      autosize
      minRows={3}
      maxRows={10}
      {...props}
      maxLength={MAX_CARACTERES_TEXTO}
      description={`${longitud} de ${MAX_CARACTERES_TEXTO} caracteres`}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
    />
  )
}
