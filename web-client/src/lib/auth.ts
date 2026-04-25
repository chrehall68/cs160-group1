import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'auth.jwt'
const ROLE_KEY = 'auth.role'
const USER_ID_KEY = 'auth.userId'
const AUTH_CHANGED_EVENT = 'auth:changed'

type Role = 'user' | 'admin'

interface AuthSession {
  token: string | null
  role: Role | null
  userId: number | null
}

const decodeJwtExpMs = (token: string): number | null => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const claims = JSON.parse(atob(padded)) as { exp?: unknown }
    return typeof claims.exp === 'number' ? claims.exp * 1000 : null
  } catch {
    return null
  }
}

// Lenient: only treat as expired when we can read an `exp` claim that's in the
// past. Tokens without a parseable `exp` are passed through to the server.
const isTokenExpired = (token: string): boolean => {
  const expMs = decodeJwtExpMs(token)
  return expMs !== null && expMs <= Date.now()
}

const readStoredSession = (): AuthSession => {
  if (typeof window === 'undefined') {
    return { token: null, role: null, userId: null }
  }

  const token = window.localStorage.getItem(TOKEN_KEY)
  if (!token || isTokenExpired(token)) {
    return { token: null, role: null, userId: null }
  }

  const roleValue = window.localStorage.getItem(ROLE_KEY)
  const userIdValue = window.localStorage.getItem(USER_ID_KEY)
  const role = roleValue === 'admin' || roleValue === 'user' ? roleValue : null
  const parsedUserId = userIdValue ? Number.parseInt(userIdValue, 10) : null
  const userId = Number.isFinite(parsedUserId) ? parsedUserId : null

  return { token, role, userId }
}

let cachedSession: AuthSession = { token: null, role: null, userId: null }

const getStoredSession = (): AuthSession => {
  const nextSession = readStoredSession()

  if (
    cachedSession.token === nextSession.token &&
    cachedSession.role === nextSession.role &&
    cachedSession.userId === nextSession.userId
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

let expiryTimer: ReturnType<typeof setTimeout> | null = null

// When the timer fires we re-read the current token rather than clearing
// blindly, because another tab may have refreshed the session in the meantime —
// without this check, a stale timer scheduled for an old token could clear a
// brand-new valid one.
const handleExpiry = () => {
  expiryTimer = null
  if (typeof window === 'undefined') return
  const currentToken = window.localStorage.getItem(TOKEN_KEY)
  if (!currentToken) return
  if (isTokenExpired(currentToken)) {
    clearAuthSession()
  } else {
    scheduleExpiryClear(currentToken)
  }
}

const scheduleExpiryClear = (token: string) => {
  if (typeof window === 'undefined') return
  if (expiryTimer !== null) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
  const expMs = decodeJwtExpMs(token)
  if (expMs === null) return
  const delay = expMs - Date.now()
  if (delay <= 0) {
    clearAuthSession()
    return
  }
  expiryTimer = setTimeout(handleExpiry, delay)
}

export const setAuthSession = (token: string, role: Role, userId: number) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(ROLE_KEY, role)
  window.localStorage.setItem(USER_ID_KEY, String(userId))
  scheduleExpiryClear(token)
  notifyAuthChanged()
}

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return
  }

  if (expiryTimer !== null) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(ROLE_KEY)
  window.localStorage.removeItem(USER_ID_KEY)
  notifyAuthChanged()
}

export const isAuthenticated = () => Boolean(getStoredSession().token)

export const isAdmin = () => getStoredSession().role === 'admin'

export const getRole = () => getStoredSession().role

// On module load, reconcile any token already in storage with its expiry:
// drop it if expired, otherwise schedule the auto-clear timer.
if (typeof window !== 'undefined') {
  const storedToken = window.localStorage.getItem(TOKEN_KEY)
  if (storedToken) {
    if (isTokenExpired(storedToken)) {
      clearAuthSession()
    } else {
      scheduleExpiryClear(storedToken)
    }
  }
}

export const useAuthSession = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => {}
      }

      const handleStorage = (event: StorageEvent) => {
        if (
          event.key === TOKEN_KEY ||
          event.key === ROLE_KEY ||
          event.key === USER_ID_KEY
        ) {
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
    () => ({ token: null, role: null, userId: null }),
  )
