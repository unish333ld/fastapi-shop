import { useState } from 'react'
import type { ReactNode } from 'react'
import { API_URL } from '../../shared/config/api'
import { AuthContext, type AuthUser } from './context'

type ApiResponse = { detail?: string; message?: string; [key: string]: unknown }

function readCookie(name: string) {
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))
  return value ? decodeURIComponent(value.split('=').slice(1).join('=')) : ''
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    })
    const body = await response.json().catch(() => ({})) as ApiResponse
    if (!response.ok) throw new Error(body.detail ?? body.message ?? `Request failed: ${response.status}`)
    return body
  }

  async function login(username: string, password: string) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }) as ApiResponse & { access_token: string; user: AuthUser }
      setAccessToken(result.access_token)
      setUser(result.user)
      setMessage(`Вход выполнен. Роль: ${result.user.role}`)
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось войти')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function refresh() {
    setBusy(true)
    setError('')
    try {
      const result = await request('/api/auth/refresh', { method: 'POST', headers: { 'X-CSRF-TOKEN': readCookie('csrf_refresh_token') } }) as ApiResponse & { access_token: string }
      setAccessToken(result.access_token)
      setMessage('Access-токен обновлён через refresh-cookie')
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось обновить токен')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function check(path: string) {
    setBusy(true)
    setError('')
    try {
      const result = await request(path, { headers: { Authorization: `Bearer ${accessToken}` } })
      setMessage(`${path}: ${JSON.stringify(result)}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Запрос отклонён')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await request('/api/auth/logout', { method: 'POST' })
    } catch {
      // Clear local auth state even if the API is unavailable.
    } finally {
      setAccessToken('')
      setUser(null)
      setError('')
      setMessage('Вы вышли из аккаунта')
      setBusy(false)
    }
  }

  const value = { user, accessToken, busy, message, error, login, refresh, check, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
