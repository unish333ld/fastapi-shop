import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/AuthContext'
import { ScrollProgress } from '../shared/ui/scroll-motion'
import { ThemeProvider } from './theme-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider><ScrollProgress /><AuthProvider>{children}</AuthProvider></ThemeProvider>
}
