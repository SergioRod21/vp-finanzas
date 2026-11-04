import { Paper, Stack } from '@mantine/core'
import { useNavigate } from 'react-router'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { paths } from '@/config/paths'
import { FormularioNuevaNota } from '@/features/notas-credito/components/formulario-nueva-nota'

/** Solicitud de una nota de crédito. El router ya restringe la ruta con puedeCrearNota. */
export function NuevaNotaCreditoRoute() {
  const navigate = useNavigate()

  return (
    <Stack gap="lg" maw={720}>
      <EncabezadoPagina
        titulo="Nueva nota de crédito"
        descripcion="Completa los datos de la solicitud. Todos los campos son obligatorios."
      />
      <Paper withBorder p="lg">
        {/* replace: al volver atrás desde el detalle no se regresa al formulario ya enviado. */}
        <FormularioNuevaNota
          onCreada={(nota) => void navigate(paths.notasCredito.detalle(nota.nota_credito_id), { replace: true })}
        />
      </Paper>
    </Stack>
  )
}
