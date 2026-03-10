import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'auth.jwt'
const ROLE_KEY = 'auth.role'
const AUTH_CHANGED_EVENT = 'auth:changed'

type Role = 'user' | 'admin'

interface AuthSession {
  token: string | null
  role: Role | null
}

const readStoredSession = (): AuthSession => {
  if (typeof window === 'undefined') {
    return { token: null, role: null }
  }

  const token = window.localStorage.getItem(TOKEN_KEY)
  const roleValue = window.localStorage.getItem(ROLE_KEY)
  const role = roleValue === 'admin' || roleValue === 'user' ? roleValue : null

  return { token, role }
}

let cachedSession: AuthSession = { token: null, role: null }

const getStoredSession = (): AuthSession => {
  const nextSession = readStoredSession()

  if (
    cachedSession.token === nextSession.token &&
    cachedSession.role === nextSession.role
  ) {
    return cachedSession
  }

  cachedSession = nextSession
  return cachedSession
}

const notifyAuthChanged = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export const setAuthSession = (token: string, role: Role) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(ROLE_KEY, role)
  notifyAuthChanged()
}

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(ROLE_KEY)
  notifyAuthChanged()
}

export const isAuthenticated = () => Boolean(getStoredSession().token)

export const isAdmin = () => getStoredSession().role === 'admin'

export const getRole = () => getStoredSession().role

export const useAuthSession = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => {}
      }

      const handleStorage = (event: StorageEvent) => {
        if (event.key === TOKEN_KEY || event.key === ROLE_KEY) {
          onStoreChange()
        }
      }

      // listen for auth changes
      const handleAuthChange = () => onStoreChange()

      window.addEventListener('storage', handleStorage)
      window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange)

      return () => {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange)
      }
    },
    getStoredSession,
    () => ({ token: null, role: null }),
  )
