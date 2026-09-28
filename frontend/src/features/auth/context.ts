import { createContext } from 'react'

export type AuthUser = { username: string; role: string }

export type AuthContextValue = {
  user: AuthUser | null
  accessToken: string
  busy: boolean
  message: string
  error: string
  login: (username: string, password: string) => Promise<boolean>
  refresh: () => Promise<boolean>
  check: (path: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
