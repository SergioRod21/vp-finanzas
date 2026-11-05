import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppProvider } from '@/app/provider'
import { AppRouter } from '@/app/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </StrictMode>,
)
